import { Data } from "effect";

export class BlueSkyInitError extends Data.TaggedError("BlueSkyInitError")<{
	cause: unknown;
}> {}

export class BlueSkyError extends Data.TaggedError("BlueSkyError")<{
	cause: unknown;
	message: string;
}> {}
