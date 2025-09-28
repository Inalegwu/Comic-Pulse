import { Console, Effect, Option } from 'effect';
import { Cheerio } from '../cheerio/client.ts';
import { Pocketbase } from '../pocketbase/client.ts';

export const checkForConnectMagazine = Effect.gen(function* () {
  const cheerio = yield* Cheerio;
  const pb=yield* Pocketbase;

  const page = yield* cheerio.make('https://comixnow.com/category/dc-connect/');

  const posts = page('div.tdb_module_loop').find('a');

  yield* Effect.forEach(posts, (post) =>
    Effect.gen(function* () {
      const href = yield* Option.fromNullable(page(post).attr('href'));
      const magazine_name = yield* Option.fromNullable(page(post).text());

      if (magazine_name === '') return;

      const newPage = yield* cheerio.make(href);

      const dwnldButton = newPage('div.tds-button').find('a');

      const magazine_url = dwnldButton.attr('href');

      yield* Effect.logInfo(`found ${magazine_url}`);

      yield* pb.use(async(client)=>{
        const exists=(await client.collection("Magazines").getFullList<Magazine>()).find((record)=>record.magazineUrl===magazine_url);

        if(exists)return;

        await client.collection("Magazines").create({
          magazineUrl:magazine_url
        });
      })
    }));
}).pipe(
  Effect.provide(Cheerio.Default),
  Effect.catchAllCause((cause) => Console.log(cause)),
  Effect.scoped,
);
