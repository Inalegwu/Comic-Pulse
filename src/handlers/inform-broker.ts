import axios from 'axios';
import { Effect } from 'effect';
import { AppConfig } from '../config.ts';
import { Supabase } from '../supabase/client.ts';

// will inform the 'broker' service to
// run expo-push-notifications
export const informBroker = Effect.scoped(
  Effect.gen(function* () {
    const supabase = yield* Supabase;
    const config = yield* AppConfig;

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

    if (unpublished === null) return;

    yield* Effect.tryPromise(async () =>
      await axios.post(config.BROKER_URL, {
        issues: unpublished.map((issue) => ({
          id: issue.id,
          title: issue.issueTitle,
        })),
      })
    );
  }).pipe(Effect.provide(Supabase.live)),
).pipe(Effect.catchAll(() => Effect.void));
