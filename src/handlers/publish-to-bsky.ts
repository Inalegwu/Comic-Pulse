import { Effect } from "effect";
import { BlueSky } from "../bluesky/client.ts";

export const publishToBsky = Effect.gen(function* () {
	const sky = yield* BlueSky;
}).pipe(Effect.scoped, Effect.provide(BlueSky.Default), Effect.orDie);
