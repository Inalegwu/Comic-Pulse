import { Data, Effect } from 'effect';
import PocketBase from 'pocketbase';
import { PocketbaseDevConfig } from '../config.ts';

type UseFn<A> = (client: PocketBase) => Promise<A>;

class PocketbaseClientError
  extends Data.TaggedError('@pulse/PocketbaseClientError')<{
    cause: unknown;
    message: string;
  }> {}

class PocketbaseClientInitError
  extends Data.TaggedError('@pulse/PocketbaseClientInitError')<{
    cause: unknown;
  }> {}

export class Pocketbase
  extends Effect.Service<Pocketbase>()('@pulse/Pocketbase', {
    effect: Effect.gen(function* () {
      const config = yield* PocketbaseDevConfig;

      const client = yield* Effect.try({
        try: () => new PocketBase(config.POCKETBASE_URL),
        catch: (cause) => new PocketbaseClientInitError({ cause }),
      });

      const use = <A>(fn: UseFn<A>) =>
        Effect.tryPromise({
          try: () => fn(client),
          catch: (cause) =>
            new PocketbaseClientError({
              cause,
              message: 'Something went wrong',
            }),
        });

      return {
        client,
        use,
      };
    }),
  }) {}
