import { Effect } from "effect";
import { checkForComics } from "./handlers/check-for-comics.ts";

Deno.cron(
  "Check for new comics",
  "0 */2 * * 4",
  () =>
    Effect.runSync(
      checkForComics,
    ),
);

Deno.cron(
  "Notify of releases",
  "0 9 * * 3",
  () => Effect.runSync(Effect.gen(function* () {})),
);
