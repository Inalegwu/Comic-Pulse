import { Hash } from "@disgruntleddevs/prelude";
import { Console, Effect, Option } from "effect";
import { Cheerio } from "../cheerio/client";
import { AppConfig } from "../config";
import { SupabaseService } from "../supabase/client";

export const checkForConnectMagazine = Effect.gen(function* () {
	const config = yield* AppConfig;
	const cheerio = yield* Cheerio;
	const supabase = yield* SupabaseService;

	const page = yield* cheerio.make(`${config.SOURCE_URL}/category/dc-connect/`);

	const posts = page("div.tdb_module_loop").find("a");

	yield* Effect.forEach(posts, (post) =>
		Effect.gen(function* () {
			const href = yield* Option.fromNullable(page(post).attr("href"));
			const magazine_name = yield* Option.fromNullable(page(post).text());

			if (magazine_name === "") return;

			const newPage = yield* cheerio.make(href);

			const downloadButton = newPage("div.tds-button").find("a");

			const magazine_url = downloadButton.attr("href");

			yield* supabase
				.use(async (client) => {
					if (magazine_name === undefined || magazine_name === null) return;

					return await client.from("magazine").insert({
						id: Hash.randomuuid("magazines", "_", 15),
						magazine_name,
						magazine_url,
						created_at: new Date().toISOString(),
					});
				})
				.pipe(Effect.tap(Effect.log));
		}),
	);
}).pipe(
	Effect.provide(Cheerio.Default),
	Effect.provide(SupabaseService.Default),
	Effect.catchAllCause((cause) => Console.log(cause)),
	Effect.scoped,
);
