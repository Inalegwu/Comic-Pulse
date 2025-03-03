import { Effect } from "effect";
import * as esbuild from "esbuild";
import { glob } from "glob";
import * as fs from "node:fs";
import { Module } from 'node:module';
import path from 'node:path';
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
				...globalThis,
				require:Module.createRequire(path.resolve(import.meta.dirname!,filePath)),
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
				// entryPoints:["_fake/**/*.ts"],
				outdir: ".temp/build",
				format: "cjs",
				platform:"node",
				target:"esnext",
				keepNames:true,
				absWorkingDir:import.meta.dirname,
				outExtension:{
					".js":".js",
				},
				loader:{
					".ts":"ts",
				},
				sourcemap:false,
				resolveExtensions:[".js"]
			}),
	);

	yield* Effect.try(()=>fixImports(".temp/build/"))

	const files = yield* Effect.tryPromise(
		async () =>
			await glob(".temp/build/tests/**/*.js", {
				ignore: "node_modules/**",
			}),
	);

	yield* Effect.forEach(files, vm.execute,{
		concurrency:"unbounded",
	}).pipe(Effect.andThen((ctxs)=>Effect.gen(function*(){
		const exports=ctxs.map((ctx)=>ctx.module.exports).map((record)=>Object.keys(record).map((key)=>record[key])).flatMap((tests)=>tests.map((test)=>test));

		// TODO: detect naming collisions among tests and report

		yield* Effect.forEach(exports,(test)=>Effect.gen(function*(){
			yield* test.resolveFn.pipe(
				Effect.catchAll(Effect.logFatal),
				Effect.annotateLogs({
					test:test.name,
					meta:test.meta||""
				})
			);
		}),{
			concurrency:"inherit",
			discard:true
		});

	})));
}).pipe(
	Effect.provide(VirtualMachine.Default),
);

Effect.runPromise(testRunner);

const fixImports=(dir:string)=>{
fs.readdirSync(dir).forEach((file)=>{
			const fullPath=path.join(dir,file);

			if(fs.statSync(fullPath).isDirectory()){
				fixImports(fullPath)
			}else if(file.endsWith(".js")){
				let content=fs.readFileSync(fullPath,"utf-8");
				content=content.replace(/\.ts(["'])/g,".js$1")
				fs.writeFileSync(fullPath,content)
			}

		})
}