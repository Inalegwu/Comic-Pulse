import { Hash } from "@disgruntleddevs/prelude";
import { Effect, Option } from "effect";
import { Cheerio } from "../cheerio/client.ts";
import { AppConfig } from "../config.ts";
import { SupabaseService } from "../supabase/client.ts";

export const checkForComics = Effect.gen(function* () {
	const config = yield* AppConfig;
	const cheerio = yield* Cheerio;
	const supabase = yield* SupabaseService;

	const page = yield* cheerio.make(`${config.SOURCE_URL}/category/dc-weekly/`);

	const posts = page("div.tdb_module_loop").find("a");

	yield* Effect.forEach(
		posts,
		(post) =>
			Effect.gen(function* () {
				const href = yield* Option.fromNullable(page(post).attr("href"));
				const title = yield* Option.fromNullable(page(post).text());

				if (title.split(":").length < 2) return;

				const date = yield* Option.fromNullable(
					title.match(/\b((\w{3,9})\s+\d{1,2},\s+\d{4})\b/)?.[0],
				);

				const timestamp = Date.parse(date);
				const isNew = Date.now() <= timestamp;

				if (!isNew) {
					return;
				}

				yield* Effect.logInfo(`Reading Page ${title}`);

				const _ = yield* cheerio.make(href);
				const body = _("div.tdb-block-inner").find("p");

				const parsed = yield* Option.fromNullable(
					body
						.text()
						.split("\n")
						.map((v) => v.trim())
						.join("\n")
						.match(/[\w\s&]+ \#\d+/g)
						?.map((v) => v.trim())
						.filter((curr, idx, arr) => curr !== arr[idx + 1]),
				);

				yield* Effect.logInfo(`Found ${parsed.length} Issues`);

				yield* Effect.logInfo(parsed);

				yield* Effect.forEach(parsed, (issue) =>
					supabase.use(async (client) => {
						const { data } = await client
							.from("issues")
							.select("*")
							.filter("issueTitle", "eq", issue);

						if (data?.length !== 0) return;

						await client.from("issues").insert({
							id: Hash.randomuuid("issues", "_", 15),
							issueTitle: issue,
							isPublished: false,
							publishDate: date,
						});
					}),
				);

				yield* Effect.log(`Saved ${parsed.length} issues`);
			}),
		{
			concurrency: "unbounded",
		},
	);
}).pipe(
	Effect.scoped,
	Effect.provide(Cheerio.Default),
	Effect.provide(SupabaseService.Default),
	Effect.orDie,
);
