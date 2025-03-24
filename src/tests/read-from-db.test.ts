import { Console, Effect } from 'effect';
import { Supabase } from '../supabase/client.ts';

export const readFromDb = (() => ({
  name: 'read-from-db',
  resolveFn: Effect.gen(function* () {
    const supabase = yield* Supabase;

    yield* Effect.logInfo('Reading DB Contents');

    yield* supabase.use(async (client) => {
      const { data, error } = await client.from('issues').select('*');

      if (error) throw new Error(String(error.message));

      data.map(Console.info);

      return data;
    });
  }).pipe(Effect.provide(Supabase.Default), Effect.scoped),
}))();
