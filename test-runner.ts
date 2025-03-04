import { Duration, Effect } from 'effect';
import * as esbuild from 'esbuild';
import { glob } from 'glob';
import * as fs from 'node:fs';
import { Module } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

type Ctx = {
  module: {
    exports: Record<string, TestMeta>;
  };
};

class VirtualMachine extends Effect.Service<VirtualMachine>()('@pulse/vm', {
  // deno-lint-ignore require-yield
  effect: Effect.gen(function* () {
    const execute = Effect.fn(function* (filePath: string) {
      const code = yield* Effect.try(() =>
        fs.readFileSync(filePath, 'utf8').toString()
      );

      const context = vm.createContext({
        ...globalThis,
        require: Module.createRequire(
          path.resolve(import.meta.dirname!, filePath),
        ),
        module: {},
      });

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
        entryPoints: ['src/**/*.ts'],
        // entryPoints: ['_fake/**/*.ts'],
        outdir: '.temp/build',
        format: 'cjs',
        platform: 'node',
        target: 'esnext',
        keepNames: true,
        absWorkingDir: import.meta.dirname,
        outExtension: {
          '.js': '.js',
        },
        loader: {
          '.ts': 'ts',
        },
        sourcemap: false,
        resolveExtensions: ['.js'],
      }),
  );

  //   yield* Effect.try(() => fixImports('.temp'));

  const files = yield* Effect.tryPromise(
    async () =>
      await glob('.temp/**/*.js', {
        ignore: 'node_modules/**',
      }),
  );

  yield* Effect.forEach(files, vm.execute, {
    concurrency: 'unbounded',
  }).pipe(
    Effect.andThen((ctxs) =>
      Effect.gen(function* () {
        const exports = ctxs.map((ctx) => ctx.module.exports).map((record) =>
          Object.keys(record).map((key) => record[key])
        ).flatMap((tests) => tests.map((test) => test));

        // detect test identifier conditions
        // and ensure 2 tests with the same name
        // don't get executed
        for (let i = 0; i < exports.length; i++) {
          const test = exports[i];
          let exists = 1;
          if (test.name === exports[i + 1].name) {
            exists += 1;
            yield* Effect.die(
              new Error(
                `Found ${exists} tests with the same identifier '${test.name}'`,
              ),
            );
          }
        }

        yield* Effect.forEach(exports, (test) =>
          Effect.gen(function* () {
            yield* test.resolveFn.pipe(
              Effect.catchAll(Effect.logFatal),
              Effect.timed,
              Effect.andThen(([duration]) =>
                Effect.logInfo(
                  `Finished ${test.name} in ${Duration.format(duration)}`,
                )
              ),
              Effect.annotateLogs({
                test: test.name,
                meta: test.meta || '',
              }),
            );
          }), {
          concurrency: 'inherit',
          discard: true,
        });
      })
    ),
    Effect.timed,
    Effect.andThen(([duration]) =>
      Effect.logInfo(`Done in ${Duration.format(duration)}`)
    ),
  );
}).pipe(
  Effect.provide(VirtualMachine.Default),
);

Effect.runPromise(testRunner);

const fixImports = (dir: string) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      content = content.replace(/\.ts(["'])/g, '.js$1');
      fs.writeFileSync(fullPath, content);
    }
  });
};
