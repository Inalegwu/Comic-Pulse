import { Hash } from '@disgruntleddevs/prelude';
import { Effect, Option } from 'effect';
import { CheerioClient } from '../cheerio/client.ts';
import { AppConfig } from '../config.ts';
import { Supabase } from '../supabase/client.ts';

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      yield* Effect.logInfo('Running Test Script');
      const config = yield* AppConfig;
      const cheerio = yield* CheerioClient;
      const supabase = yield* Supabase;

      const page = yield* cheerio.make(
        config.SOURCE_URL,
      );

      const posts = page('div.tdb_module_loop').find('a');

      yield* Effect.forEach(posts, (post) =>
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
          yield* Effect.logInfo(date);

          const newPage = yield* cheerio.make(href);
          const body = newPage('div.tdb-block-inner').find('p');

          const parsed = yield* Option.fromNullable(
            body
              .text()
              .split('\n')
              .map((v) => v.trim())
              .join('\n')
              .match(/[\w\s&]+ \#\d+/g)
              ?.map((v) => v.trim()).filter((curr, idx, arr) =>
                curr !== arr[idx + 1]
              ),
          );

          yield* Effect.logInfo(`Found ${parsed.length} Issues`);

          yield* Effect.logInfo(parsed);

          yield* Effect.forEach(
            parsed,
            (issue) =>
              Effect.gen(function* () {
                yield* Effect.logInfo(`Saving ${issue}`);
                yield* supabase.use(async (client) => {
                  const { error } = await client.from('issues').insert({
                    id: Hash.randomuuid('issues', '_', 15),
                    issueTitle: issue,
                    isPublished: false,
                    publishDate: date,
                  });
                  if (error) throw new Error(String(error.message));
                });
              }),
          );

          yield* Effect.log(`Saved ${parsed.length} issues`);

          return parsed;
        }), {
        concurrency: 'unbounded',
      });
    }).pipe(Effect.provide(CheerioClient.live), Effect.provide(Supabase.test)),
  ),
).pipe(Effect.catchTag('supabase-error', Effect.logError));
