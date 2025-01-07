import axios from 'axios';
import { Effect } from 'effect';
import { ScraperConfig } from '../config.ts';
import { Supabase } from '../supabase/client.ts';

// will inform the 'broker' service to
// run expo-push-notifications
export const informBroker = Effect.scoped(
  Effect.gen(function* () {
    const supabase = yield* Supabase;
    const config = yield* ScraperConfig;

    const unpublished = yield* Effect.tryPromise(
      {
        try: async () =>
          (await supabase.client.from('issues').select('*').filter(
            'isPublished',
            'eq',
            false,
          )).data,
        catch: (e) => new Error(String(e)),
      },
    );

    yield* Effect.tryPromise(async () =>
      await axios.post(config.BROKER_URL, {
        issues: unpublished,
      })
    );
  }).pipe(Effect.provide(Supabase.live)),
).pipe(Effect.catchAll(() => Effect.void));
