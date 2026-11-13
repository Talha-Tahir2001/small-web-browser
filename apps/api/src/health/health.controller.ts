import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
// mongoose is CommonJS, so under ESM the named exports are not available at
// runtime; the default import is the module object, and that is what we want.
import mongoose from 'mongoose';

export type HealthDto = {
  ok: boolean;
  db: 'up' | 'down';
  version: string;
  uptime: number;
};

@Controller('api/health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: mongoose.Connection) {}

  /** Is the API up, and is the database reachable? */
  @Get()
  health(): HealthDto {
    const states: string[] = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const state = states[this.connection.readyState] ?? 'disconnected';

    return {
      ok: state === 'connected',
      db: state === 'connected' ? 'up' : 'down',
      version: process.env.npm_package_version ?? '0.0.1',
      uptime: Math.round(process.uptime()),
    };
  }
}
