import { Hash } from "@disgruntleddevs/prelude";
import { Effect, Option } from "effect";
import { CheerioClient } from "../cheerio/client.ts";
import { Store } from "../resources.ts";
import { SqlService } from "../sql/client.ts";

// const regex = /[\w\s&]+ \#\d+/g;

// scrapes comic book data from "https://comixnow.com/category/dc-weekly/"
export const checkForComics = Effect.scoped(
  Effect.gen(function* () {
    // create a cheerio client for this instance
    const cheerio = yield* CheerioClient;
    // scoped access to Deno.Kv so some data can be stored
    // within the instance
    const kv = yield* Store;
    // our database connection where all discovered issues
    // can be saved into the shared database for the discord
    // bot as well
    const sql = yield* SqlService;

    // always makes sure the table exists
    // when spun up so we aren't writing to nothing
    yield* sql.createTable();

    // convert the initial page into a CheerioApi
    // object
    const page = yield* cheerio.make(
      "https://comixnow.com/category/dc-weekly/",
    );

    // get all posts in the page based on this specific
    // class/identifier
    const posts = page("div.tdb_module_loop").find("a");

    yield* Effect.forEach(posts, (post) =>
      Effect.gen(function* () {
        const href = yield* Option.fromNullable(page(post).attr("href"));
        const title = yield* Option.fromNullable(page(post).text());

        if (title.split(":").length < 2) return;

        // since we are doing regex matching we have to ensure
        // that the date isn't null
        const date = yield* Option.fromNullable(
          title.match(/\b((\w{3,9})\s+\d{1,2},\s+\d{4})\b/)?.[0],
        );

        const timestamp = Date.parse(date);
        const isNew = Date.now() <= timestamp;

        // we don't do any extra work in the event of a
        // post from an already published week
        if (!isNew) {
          return;
        }

        yield* Effect.logInfo(`Reading Page ${title}`);

        // load in the new page and retrieve all elements
        // with this specific class since that's where issue
        // names are stored
        const newPage = yield* cheerio.make(href);
        const body = newPage("div.tdb-block-inner").find("p");

        // get the list of issues from the body
        // once again pattern matching
        const parsed = yield* Option.fromNullable(
          body
            .text()
            .split("\n")
            .map((v) => v.trim())
            .join("\n")
            .match(/[\w\s&]+ \#\d+/g)
            ?.map((v) => v.trim()).filter((a, i, b) => a !== b[i + 1]),
        );

        yield* Effect.logInfo(`Found ${parsed.length} Issues`);

        yield* Effect.logInfo(parsed);

        // save each parsed issue into the database
        // using our sql module
        yield* Effect.forEach(
          parsed,
          (issue) =>
            Effect.gen(function* () {
              yield* sql.insert({
                id: Hash.randomuuid(`issues_${date}`, "-", 15),
                name: issue,
                isPublished: 0,
                publishDate: new Date(date),
              });
            }),
        );

        if (!kv) {
          yield* Effect.fail(new Error("failed to connect to kv"));
          return;
        }

        // also save issues into the KV instance. as a backup.
        // still not sure about this though
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
        `${e._tag.toUpperCase()} ==> ${e.message}=== CAUSE: ${e.cause}`,
      );
    }),
  "UnknownException": (e) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `${e._tag.toUpperCase()} ==> ${e.message}`,
      );
    }),
}));
