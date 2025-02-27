import { Hash } from "@disgruntleddevs/prelude";
import { Console, Effect, Option } from "effect";
import { Cheerio } from "../cheerio/client.ts";
import { AppConfig } from "../config.ts";
import { Supabase } from "../supabase/client.ts";

export const testCheckForConnect = Effect.gen(function* () {
	const config = yield* AppConfig;
	const cheerio = yield* Cheerio;
	const supabase = yield* Supabase;

	yield* Effect.logInfo("Attempting to check for Magazine on url: ");
	const page = yield* cheerio.make(`${config.SOURCE_URL}/category/dc-connect/`);

	const posts = page("div.tdb_module_loop").find("a");

	yield* Effect.forEach(posts, (post) =>
		Effect.gen(function* () {
			const href = yield* Option.fromNullable(page(post).attr("href"));
			const title = yield* Option.fromNullable(page(post).text());

			const newPage = yield* cheerio.make(href);

			const dwnldButton = newPage("div.tds-button").find("a");

			const magazineLink = dwnldButton.attr("href");

			if (magazineLink === undefined) return;

			yield* supabase.use(async (client) => {
				const { data } = await client.from("magazine").select("*");

				if (data?.find((d) => d.magazine_name === title)) return;

				Console.log(`Saving ${magazineLink}`);

				await client.from("magazine").insert({
					id: Hash.randomuuid("magazines", "_", 15),
					magazine_name: title,
					magazine_url: magazineLink,
				});
			});
		}),
	);
}).pipe(
	Effect.provide(Cheerio.Default),
	Effect.provide(Supabase.Default),
	Effect.catchAllCause((cause) => Console.log(cause)),
	Effect.scoped,
);

Effect.runFork(testCheckForConnect);
