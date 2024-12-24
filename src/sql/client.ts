import { SqlClient, type SqlError, SqlResolver } from "@effect/sql";
import { LibsqlClient } from "@effect/sql-libsql";
import { Context, Effect, Layer, Schema } from "effect";
import type { ParseError } from "effect/ParseResult";
import { DatabaseConfig } from "./config.ts";

type ISqlService = Readonly<{
  insert: (input: {
    readonly id: string;
    readonly name: string;
    readonly publishDate: Date;
    readonly isPublished: boolean;
  }) => Effect.Effect<
    Issue,
    SqlError.ResultLengthMismatch | SqlError.SqlError | ParseError,
    never
  >;
}>;

const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* DatabaseConfig;

    return LibsqlClient.layer({
      url: config.DATBASE_URL,
      authToken: config.DATABASE_AUTH_TOKEN,
    });
  }),
);

class Issue extends Schema.Class<Issue>("Issue")({
  id: Schema.String,
  name: Schema.String,
  publishDate: Schema.Date,
  isPublished: Schema.Boolean,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
}) {}

const InsertIssueSchema = Issue.pipe(Schema.omit("createdAt", "updatedAt"));

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const InsertIssue = yield* SqlResolver.ordered("InsertIssue", {
    Request: InsertIssueSchema,
    Result: Issue,
    execute: (requests) =>
      sql`INSERT INTO issues ${sql.insert(requests)} RETURNING issues.*`,
  });

  const insert = InsertIssue.execute;

  return { insert };
});

export class SqlService extends Context.Tag("sql-service")<
  SqlService,
  ISqlService
>() {
  static live = Layer.effect(this, make).pipe(Layer.provide(SqlLive));
}
