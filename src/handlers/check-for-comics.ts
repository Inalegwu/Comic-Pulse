import { Hash } from "@disgruntleddevs/prelude";
import { Effect, Option } from "effect";
import { CheerioClient } from "../cheerio/client.ts";
import { Store } from "../resources.ts";
import { SqlService } from "../sql/client.ts";

const regex = /[\w\s&]+ \#\d+/g;

export const checkForComics = Effect.scoped(
  Effect.gen(function* () {
    const cheerio = yield* CheerioClient;
    const kv = yield* Store;
    const sql = yield* SqlService;

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

        yield* Effect.logInfo(`Found ${parsed.length} Issues`);

        yield* Effect.logInfo(parsed);

        yield* Effect.forEach(parsed, (issue) =>
          Effect.gen(function* () {
            yield* sql.insert({
              id: Hash.randomuuid(`issues_${date}`, "-", 15),
              name: issue,
              isPublished: false,
              publishDate: new Date(date),
            });
          }));

        if (!kv) {
          yield* Effect.fail(new Error("failed to connect to kv"));
          return;
        }

        yield* Effect.tryPromise(
          async () => await kv.set([`issues-${date}`], parsed),
        );

        yield* Effect.log(`Saved ${parsed.length} issues`);
      }), {
      concurrency: "unbounded",
    });
  }).pipe(Effect.provide(CheerioClient.live), Effect.provide(SqlService.live)),
).pipe(Effect.catchTags({
  "ConfigError": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e._op}`,
      );
    }),
  "NoSuchElementException": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e.message}`,
      );
    }),
  "ParseError": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e.message}`,
      );
    }),
  "ResultLengthMismatch": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e.message}`,
      );
    }),
  "SqlError": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e.message}`,
      );
    }),
  "UnknownException": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e.message}`,
      );
    }),
}));
