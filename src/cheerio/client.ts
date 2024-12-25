import axios from "axios";
import * as cheerio from "cheerio";
import { Context, Effect, Layer } from "effect";
import { CheerioError } from "./error.ts";

type ICheerioClient = Readonly<{
  make: (url: string) => Effect.Effect<cheerio.CheerioAPI>;
}>;

// deno-lint-ignore require-yield
const make = Effect.gen(function* () {
  const make = (url: string) =>
    Effect.tryPromise({
      try: async () => {
        const page = await axios.get(url);

        return cheerio.load(page.data);
      },
      catch: (cause) => new CheerioError({ cause }),
    });

  return {
    make,
  } as ICheerioClient;
});

export class CheerioClient extends Context.Tag("cheerio-api")<
  CheerioClient,
  ICheerioClient
>() {
  static live = Layer.effect(this, make);
  static test = Layer.effect(this, make);
}
