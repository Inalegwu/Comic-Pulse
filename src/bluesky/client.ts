import { Effect } from "effect";

export class BlueSky extends Effect.Service()("BlueSkyClient", {
	// deno-lint-ignore require-yield
	effect: Effect.gen(function* () {
		return {};
	}),
}) {}
