import { Effect } from "effect";
import { checkForComics } from "./handlers/check-for-comics.ts";
import { checkForConnectMagazine } from "./handlers/fetch-connect-magazine.ts";
import { informBroker } from "./handlers/inform-broker.ts";
import { publishToBsky } from "./handlers/publish-to-bsky.ts";

Deno.cron("Check for new comics", "* 10 * * 5", () =>
	checkForComics.pipe(Effect.runPromise),
);

Deno.cron("Inform Broker", "* 10 * * 4", () =>
	informBroker.pipe(Effect.runPromise),
);

Deno.cron("Fetch Connect Magazine", "0 10 */2 * *", () =>
	checkForConnectMagazine.pipe(Effect.runPromise),
);

Deno.cron("Publish New Comic Release on BlueSky", "* 10 * * 4", () =>
	publishToBsky.pipe(Effect.runPromise),
);
