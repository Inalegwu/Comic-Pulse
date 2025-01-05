import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Context, Effect, Layer } from 'effect';
import { SupabaseDevConfig, SupabaseLiveConfig } from './config.ts';
import { SupabaseError } from './error.ts';

type ISupabase = Readonly<{
  client: SupabaseClient;
  use: <A>(
    fn: (client: SupabaseClient) => Promise<A>,
  ) => Effect.Effect<A, SupabaseError, never>;
}>;

const make = Effect.gen(function* () {
  const config = yield* SupabaseLiveConfig;

  const client = yield* Effect.try({
    try: () => createClient(config.SUPABASE_URL, config.SUPABASE_KEY),
    catch: (cause) => new SupabaseError({ cause }),
  });

  const use = <A>(fn: (client: SupabaseClient) => Promise<A>) =>
    Effect.tryPromise({
      try: () => fn(client),
      catch: (cause) => new SupabaseError({ cause }),
    });

  return { use, client } satisfies ISupabase;
});

// for running in testing environments. uses the local .env
// instead of deno deploy and deno environment
const test = Effect.gen(function* () {
  const config = yield* SupabaseDevConfig;

  const client = yield* Effect.try({
    try: () => createClient(config.SUPABASE_URL, config.SUPABASE_KEY),
    catch: (cause) => new SupabaseError({ cause }),
  });

  const use = <A>(fn: (client: SupabaseClient) => Promise<A>) =>
    Effect.tryPromise({
      try: () => fn(client),
      catch: (cause) => new SupabaseError({ cause }),
    });

  return { use, client } satisfies ISupabase;
});

export class Supabase extends Context.Tag('supabase-client')<
  Supabase,
  ISupabase
>() {
  static live = Layer.effect(this, make);
  static test = Layer.effect(this, test);
}
