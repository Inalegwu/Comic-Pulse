import { Console, Effect } from 'effect';
import { Supabase } from '../supabase/client.ts';

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      const supabase = yield* Supabase;

      yield* Effect.logInfo('Reading DB Contents');

      yield* supabase.use(async (client) => {
        const { data, error } = await client.from('issues').select('*');

        if (error) throw new Error(String(error.message));

        data.map(Console.info);
      });
    }).pipe(Effect.provide(Supabase.test)),
  ),
);
