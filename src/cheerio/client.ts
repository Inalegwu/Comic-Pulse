import axios from "axios";
import * as cheerio from "cheerio";
import { Effect } from "effect";
import { CheerioError } from "./error.ts";

export class Cheerio extends Effect.Service<Cheerio>()("@pulse/cheerio", {
	// deno-lint-ignore require-yield
	effect: Effect.gen(function* () {
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
	}),
}) {}
