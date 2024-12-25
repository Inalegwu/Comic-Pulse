import { Effect } from "effect";
import { checkForComics } from "./handlers/check-for-comics.ts";

Deno.cron(
  "Check for new comics",
  "0 */2 * * 4",
  () =>
    Effect.runPromise(
      checkForComics,
    ),
);
