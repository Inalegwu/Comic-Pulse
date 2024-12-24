import { Effect } from "effect";
import { checkForComics } from "./handlers/check-for-comics.ts";

Effect.runFork(checkForComics);
