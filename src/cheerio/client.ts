import axios from 'axios';
import * as cheerio from 'cheerio';
import { Context, Effect, Layer } from 'effect';
import { CheerioError } from './error.ts';

// deno-lint-ignore require-yield
const make = Effect.gen(function* () {
  const make = Effect.fn(function* (url: string) {
    return yield* Effect.tryPromise({
      try: async () => {
        const page = await axios.get(url);

        return cheerio.load(page.data);
      },
      catch: (cause) => new CheerioError({ cause }),
    }).pipe(Effect.orDie);
  });

  return {
    make,
  } as const;
});

export class CheerioClient extends Context.Tag('cheerio-api')<
  CheerioClient,
  Effect.Effect.Success<typeof make>
>() {
  static live = () => Layer.effect(this, make);
  static test = Layer.effect(this, make);

  static Default = this.live();
}
