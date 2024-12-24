import { Effect } from "effect";
import { checkForComics } from "./handlers/check-for-comics.ts";
import { notifyRelease } from "./handlers/notify-release.ts";

// Deno.cron(
//   "Check for new comics",
//   "0 */2 * * 4",
//   () =>
//     Effect.runPromise(
//       checkForComics,
//     ),
// );
Deno.cron(
  "Check for new comics",
  "*/1 * * * *",
  () => Effect.runPromise(checkForComics),
);

Deno.cron(
  "Notify of releases",
  "0 9 * * 3",
  () => Effect.runPromise(notifyRelease),
);
