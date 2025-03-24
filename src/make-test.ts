export function makeTest({ resolveFn, name, meta }: Test) {
  return {
    name,
    meta,
    resolveFn,
  };
}
