import { Console, Effect } from "effect";
import * as esbuild from "esbuild";
import { glob } from "glob";
import * as fs from "node:fs";
import Module from "node:module";
import vm from "node:vm";

type Ctx = {
	module: {
		exports:Record<string,any>
	};
};

class VirtualMachine extends Effect.Service<VirtualMachine>()("@pulse/vm", {
	// deno-lint-ignore require-yield
	effect: Effect.gen(function* () {
		const execute = Effect.fn(function* (filePath: string) {
			const code = yield* Effect.try(() =>
				fs.readFileSync(filePath, "utf8").toString(),
			);

			const context = vm.createContext({
				// ...globalThis,
				require: Module.createRequire(import.meta.url),
				__dirname:import.meta.dirname,
				__filename:import.meta.filename,
				module: {},
			});

			context.exports=context.module.exports;

			yield* Effect.sync(() => vm.runInContext(code, context)).pipe(
				Effect.orDie,
			);

			

			return context as Ctx;
		});

		return { execute } as const;
	}),
}) {}

const testRunner = Effect.gen(function* () {
	const vm = yield* VirtualMachine;

	yield* Effect.tryPromise(
		async () =>
			await esbuild.build({
				entryPoints: ["src/**/*.ts"],
				// entryPoints: ["_fake/fake.test.ts"],
				outdir: ".temp/build",
				format: "cjs",
				platform:"node",
				target:"esnext",
				keepNames:true,
				absWorkingDir:import.meta.dirname
			}),
	);

	// .temp/build/tests/**/*.js
	const files = yield* Effect.tryPromise(
		async () =>
			await glob(".temp/build/tests/**/*.js", {
				ignore: "node_modules/**",
			}),
	);

	yield* Effect.forEach(files, vm.execute).pipe(Effect.tap(Effect.logInfo));
}).pipe(
	Effect.catchAll(Console.log),
	Effect.annotateLogs({
		module: "runner",
	}),
	Effect.provide(VirtualMachine.Default),
);

Effect.runPromise(testRunner);
