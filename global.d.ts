import { Effect } from 'effect';

declare global {
  export type Test = {
    name: string;
    resolveFn: Effect.Effect<unknown, unknown, never>;
    meta?: Record<string, any>;
  };
}

export {};
