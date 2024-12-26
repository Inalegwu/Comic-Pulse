import { Effect } from "effect";
import { SqlService } from "../sql/client.ts";

Effect.runPromise(
  Effect.gen(function* () {
    const sql = yield* SqlService;

    yield* sql.createTable();
  }).pipe(Effect.provide(SqlService.live)),
);
