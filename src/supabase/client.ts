import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Context, Effect, Layer } from 'effect';
import type { Database } from '../database.types.ts';
import { SupabaseDevConfig, SupabaseLiveConfig } from './config.ts';
import { SupabaseClientInstantiationError, SupabaseError } from './error.ts';

type UseFn<A> = (client: SupabaseClient<Database>) => Promise<A>;

const make = Effect.gen(function* () {
  const config = yield* SupabaseDevConfig;

  const client = yield* Effect.try({
    try: () => createClient<Database>(config.SUPABASE_URL, config.SUPABASE_KEY),
    catch: (cause) => new SupabaseClientInstantiationError({ cause }),
  });

  const use = Effect.fnUntraced(function* <A>(fn: UseFn<A>) {
    return yield* Effect.tryPromise({
      try: () => fn(client),
      catch: (cause) => new SupabaseError({ cause }),
    }).pipe(Effect.orDie);
  });

  return { use, client } as const;
});

export class Supabase extends Context.Tag('supabase-client')<
  Supabase,
  Effect.Effect.Success<typeof make>
>() {
  static live = () => Layer.effect(this, make);
  static Default = this.live();
}

// Production
export class SupabaseService extends Effect.Service<SupabaseService>()(
  '@pulse/supabase',
  {
    effect: Effect.gen(function* () {
      const config = yield* SupabaseLiveConfig;

      const client = yield* Effect.try({
        try: () =>
          createClient<Database>(config.SUPABASE_URL, config.SUPABASE_KEY),
        catch: (cause) => new SupabaseClientInstantiationError({ cause }),
      });

      const use = Effect.fn(function* <A>(fn: UseFn<A>) {
        return yield* Effect.tryPromise({
          try: () => fn(client),
          catch: (cause) => new SupabaseError({ cause }),
        }).pipe(Effect.orDie);
      });

      return { use, client } as const;
    }).pipe(Effect.orDie),
  },
) {}
