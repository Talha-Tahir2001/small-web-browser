'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import type { Person } from '@/lib/api';

/**
 * Who you are browsing as.
 *
 * There are no accounts, no passwords and no roles in this web: you pick a
 * name from the list of people who are here, and the history belongs to
 * whoever you picked. Anyone can pick any name - the brief takes
 * authentication out of scope on purpose.
 */
export function PersonPicker({
  people,
  personId,
  onChange,
}: {
  people: Person[];
  personId: string | null;
  onChange: (personId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="person" className="text-xs text-muted-foreground">
        Browsing as
      </Label>
      <Select value={personId} onValueChange={(value) => onChange(String(value))}>
        <SelectTrigger id="person" size="sm" className="w-32">
          <SelectValue>{(value) => people.find((person) => person.id === value)?.name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {people.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
