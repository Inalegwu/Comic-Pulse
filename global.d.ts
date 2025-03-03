import { Effect } from 'effect';

declare global{
    export type TestMeta={
name:string;
resolveFn:Effect.Effect<unknown,unknown,never>;
meta?:Record<string,any>
    }
}

export { };
