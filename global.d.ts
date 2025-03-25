import { Effect } from 'effect';

declare global {
  export type Test = {
    name: string;
    resolveFn: Effect.Effect<unknown, unknown, never>;
    // deno-lint-ignore no-explicit-any
    meta?: Record<string, any>;
  };
}

export { };

