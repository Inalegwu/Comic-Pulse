import { Console, Effect } from "effect";
import { glob as globLoader } from "glob";
import * as fs from "node:fs";
import { Module } from "node:module";
import path from "node:path";
import vm from "node:vm";

const testRunner = Effect.gen(function* () {
	const g = yield* Effect.tryPromise(
		async () =>
			// change this
			await globLoader("_fake/**/*.ts", {
				ignore: "node_modules/**",
			}),
	);

	yield* Effect.logInfo(g);

	yield* Effect.forEach(g, (filePath) =>
		Effect.gen(function* () {
			const context = vm.createContext({
				...globalThis,
			});

			context.require = Module.createRequire(path.resolve(filePath));
			context.module = { exports: {} };
			context.exports = context.module.exports;

			const code = yield* Effect.try(() =>
				fs.readFileSync(filePath).toString(),
			);

			yield* Effect.sync(() => vm.runInContext(code, context));

			yield* Effect.logInfo(context);
		}),
	);
}).pipe(Effect.catchAll(Console.log));

Effect.runPromise(testRunner);
