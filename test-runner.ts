import { Effect } from "effect";
import * as esbuild from "esbuild";
import { glob } from "glob";
import * as fs from "node:fs";
import Module from "node:module";
import vm from "node:vm";

type Ctx = {
	module: {
		exports:Record<string,TestMeta>
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
				require: Module.createRequire(import.meta.filename!),
				// __dirname:import.meta.dirname,
				// __filename:import.meta.filename,
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
				// entryPoints: ["src/**/*.ts"],
				entryPoints:["_fake/**/*.ts"],
				outdir: ".temp/build",
				format: "cjs",
				platform:"node",
				target:"esnext",
				keepNames:true,
				absWorkingDir:import.meta.dirname
			}),
	)

	const files = yield* Effect.tryPromise(
		async () =>
			await glob(".temp/build/**/*.js", {
				ignore: "node_modules/**",
			}),
	);

	yield* Effect.forEach(files, vm.execute,{
		concurrency:"unbounded",
	}).pipe(Effect.andThen((ctxs)=>Effect.gen(function*(){
		const exports=ctxs.map((ctx)=>ctx.module.exports).map((record)=>Object.keys(record).map((key)=>record[key])).flatMap((tests)=>tests.map((test)=>test));

		yield* Effect.forEach(exports,(test)=>Effect.gen(function*(){
			yield* test.resolveFn.pipe(
				Effect.catchAll(Effect.logFatal),
				Effect.annotateLogs({
					test:test.name,
					meta:test.meta||""
				})
			);
		}));
		
	})));
}).pipe(
	Effect.provide(VirtualMachine.Default),
);

Effect.runPromise(testRunner);
