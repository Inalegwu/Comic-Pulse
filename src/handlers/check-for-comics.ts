import { Effect, Option } from 'effect';
import { Cheerio } from '../cheerio/client.ts';
import { Pocketbase } from '../pocketbase/client.ts';

export const checkForComics = Effect.gen(function* () {
  const cheerio = yield* Cheerio;
  const pb = yield* Pocketbase;

  const page = yield* cheerio.make('https://comixnow.com/category/dc-weekly/');

  const posts = page('div.tdb_module_loop').find('a');

  yield* Effect.forEach(
    posts,
    (post) =>
      Effect.gen(function* () {
        const href = yield* Option.fromNullable(page(post).attr('href'));
        const title = yield* Option.fromNullable(page(post).text());

        if (title.split(':').length < 2) return;

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
        const body = _('div.tdb-block-inner').find('p');

        const parsed = yield* Option.fromNullable(
          body
            .text()
            .split('\n')
            .map((v) => v.trim())
            .join('\n')
            .match(/[\w\s&]+ \#\d+/g)
            ?.map((v) => v.trim())
            .filter((curr, idx, arr) => curr !== arr[idx + 1]),
        );

        yield* Effect.logInfo(`Found ${parsed.length} Issues`);

        yield* Effect.logInfo(parsed);

        yield* Effect.forEach(parsed, (issue) =>
          Effect.gen(function* () {
            yield* Effect.logInfo(`Saving ${issue}`);
            yield* pb.use(async (client) => {
              const all = await client.collection('Issues').getFullList<
                Issue
              >();

              const exists = all.find((saved) => saved.title === issue);

              if (exists) return

              await client.collection('Issues').create({
                title: issue,
                isPublished: false,
                publishDate: date,
              }).catch((e) => {
                if (e) throw new Error(String(e));
              });
            });
          }));

        yield* Effect.log(`Saved ${parsed.length} issues`);
      }),
    {
      concurrency: 'unbounded',
    },
  );
}).pipe(
  Effect.scoped,
  Effect.provide(Cheerio.Default),
  Effect.provide(Pocketbase.Default),
  Effect.orDie,
);
