import { Effect } from "effect";

export const Store = Effect.acquireRelease(
  Effect.tryPromise(async () => await Deno.openKv()),
  (k) => Effect.succeed(k.close()),
).pipe(Effect.catchAll(Effect.logError));
