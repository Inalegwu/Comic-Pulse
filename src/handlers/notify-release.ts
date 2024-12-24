import { Effect } from "effect";
import { Store } from "../resources.ts";

export const notifyRelease = Effect.scoped(Effect.gen(function* () {
  const kv = yield* Store;
}));
