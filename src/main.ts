import { Effect } from "effect";
import { checkForComics } from "./handlers/check-for-comics.ts";
import { checkForConnectMagazine } from "./handlers/fetch-connect-magazine.ts";
import { informBroker } from "./handlers/inform-broker.ts";

Deno.cron("Check for new comics", "* */2 * * 5", () =>
	Effect.runPromise(checkForComics),
);

Deno.cron("Inform Broker", "* */4 * * 4", () =>
	Effect.runPromise(informBroker),
);

Deno.cron("Fetch Connect Magazine", "0 0 */2 * * ", () =>
	Effect.runPromise(checkForConnectMagazine),
);
