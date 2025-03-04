import axios from 'axios';
import { Effect } from 'effect';
import { AppConfig } from '../config.ts';
import { Supabase } from '../supabase/client.ts';

export const informBroker = Effect.gen(function* () {
  const supabase = yield* Supabase;
  const config = yield* AppConfig;

  const unpublished = yield* Effect.tryPromise({
    try: async () =>
      (
        await supabase.client
          .from('issues')
          .select('*')
          .filter('isPublished', 'eq', false)
      ).data,
    catch: (e) => new Error(String(e)),
  });

  if (unpublished === null) return;

  yield* Effect.tryPromise(
    async () =>
      await axios.post(config.BROKER_URL, {
        issues: unpublished.map((issue) => ({
          id: issue.id,
          title: issue.issueTitle,
        })),
      }),
  );
}).pipe(Effect.scoped, Effect.provide(Supabase.Default), Effect.orDie);
