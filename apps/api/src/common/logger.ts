/**
 * Structured logs.
 *
 * One line per event, as JSON, so that a run of the browser can be read
 * afterwards: what was published, where somebody arrived, what was searched
 * for, and what the history did about it.
 *
 * The events are the ones the brief cares about - publish, navigate, and
 * every move of the history cursor - because those are the ones a reviewer
 * will want to see the shape of.
 */
export function logEvent(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, at: new Date().toISOString(), ...fields }));
}
