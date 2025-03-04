import { Hash } from '@disgruntleddevs/prelude';
import { Effect, Option } from 'effect';
import { Cheerio } from '../cheerio/client.ts';
import { AppConfig } from '../config.ts';
import { Supabase } from '../supabase/client.ts';

export const checkFetchConnect = (() => ({
  name: 'Check Fetch Connect',
  resolveFn: Effect.gen(function* () {
    const config = yield* AppConfig;
    const cheerio = yield* Cheerio;
    const supabase = yield* Supabase;

    yield* Effect.logInfo('Attempting to check for Magazine');
    const page = yield* cheerio.make(
      `${config.SOURCE_URL}/category/dc-connect/`,
    );

    const posts = page('div.tdb_module_loop').find('a');

    yield* Effect.forEach(posts, (post) =>
      Effect.gen(function* () {
        const href = yield* Option.fromNullable(page(post).attr('href'));
        const magazine_name = yield* Option.fromNullable(page(post).text());

        if (magazine_name === '') return;

        const newPage = yield* cheerio.make(href);

        const dwnldButton = newPage('div.tds-button').find('a');

        const magazine_url = dwnldButton.attr('href');

        if (magazine_url === undefined) return;

        yield* Effect.logInfo(`found ${magazine_url}`);
        yield* supabase
          .use(async (client) => {
            if (magazine_name === undefined || magazine_name === null) return;
            return await client.from('magazine').insert({
              id: Hash.randomuuid('magazines', '_', 15),
              magazine_name,
              magazine_url,
              created_at: new Date().toISOString(),
            });
          })
          .pipe(Effect.tap(Effect.log));
      }));
  }).pipe(
    Effect.provide(Cheerio.Default),
    Effect.provide(Supabase.Default),
    Effect.catchAll(Effect.logError),
    Effect.scoped,
  ),
} satisfies Test))();
