import { Effect, Option } from "effect";
import { CheerioClient } from "../cheerio/client.ts";
import { Store } from "../resources.ts";

const regex = /[\w\s&]+ \#\d+/g;

export const checkForComics = Effect.scoped(
  Effect.gen(function* () {
    const cheerio = yield* CheerioClient;
    const kv = yield* Store;

    const page = yield* cheerio.make(
      "https://comixnow.com/category/dc-weekly/",
    );

    const posts = page("div.tdb_module_loop").find("a");

    yield* Effect.forEach(posts, (post) =>
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

        const newPage = yield* cheerio.make(href);
        const body = newPage("div.tdb-block-inner").find("p");

        const parsed = yield* Option.fromNullable(
          body
            .text()
            .split("\n")
            .map((v) => v.trim())
            .join("\n")
            .match(regex)
            ?.map((v) => v.trim()),
        );

        yield* Effect.logInfo(parsed);

        if (!kv) {
          yield* Effect.fail(new Error("failed to connect to kv"));
          return;
        }

        yield* Effect.logInfo(`Found ${parsed.length} Issues`);

        yield* Effect.tryPromise(
          async () => await kv.set([`issues-${date}`], parsed),
        );

        yield* Effect.log(`Saved ${parsed.length} issues`);
      }));
  }).pipe(Effect.provide(CheerioClient.live)),
);
