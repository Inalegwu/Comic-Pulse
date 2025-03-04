import { Duration, Effect } from 'effect';
import * as esbuild from 'esbuild';
import { glob } from 'glob';
import * as fs from 'node:fs';
import { Module } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

type Ctx = {
  module: {
    exports: Record<string, Test>;
  };
};

class VirtualMachine extends Effect.Service<VirtualMachine>()('@pulse/vm', {
  // deno-lint-ignore require-yield
  effect: Effect.gen(function* () {
    const execute = Effect.fn(function* (filePath: string) {
      yield* Effect.logInfo(`Executing ${filePath}`);
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
        outdir: 'dist',
        format: 'cjs',
        platform: 'node',
        target: 'esnext',
        keepNames: true,
        absWorkingDir: import.meta.dirname,
        sourcemap: false,
        resolveExtensions: ['.js'],
      }),
  );

  yield* fixImports('dist/tests');

  const files = yield* Effect.tryPromise(
    async () =>
      await glob('dist/tests/**/*.js', {
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

        yield* Effect.logInfo(exports);

        // prevent naming collisions
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
  return Effect.gen(function* () {
    const files = yield* Effect.try(() => fs.readdirSync(dir));

    yield* Effect.forEach(files, (file) =>
      Effect.gen(function* () {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
          fixImports(fullPath);
        } else if (file.endsWith('.js')) {
          let content = fs.readFileSync(fullPath, 'utf-8');
          content = content.replace(/\.ts(["'])/g, '.js$1');
          fs.writeFileSync(fullPath, content);
        }
      }), {
      concurrency: files.length,
    });
  }).pipe(
    Effect.catchAll(Effect.logFatal),
    Effect.timed,
    Effect.andThen(([duration]) =>
      Effect.logInfo(`Fixed all imports in ${Duration.format(duration)}`)
    ),
  );
};
