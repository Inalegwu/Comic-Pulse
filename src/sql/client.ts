import { SqlClient, type SqlError, SqlResolver } from "@effect/sql";
import { LibsqlClient } from "@effect/sql-libsql";
import { Context, Effect, Layer, type ParseResult, Schema } from "effect";
import { DatabaseConfig, TestConfig } from "./config.ts";

type ISqlService = Readonly<{
  insert: (input: {
    readonly id: string;
    readonly name: string;
    readonly publishDate: Date;
    readonly isPublished: number;
  }) => Effect.Effect<
    Issue,
    SqlError.ResultLengthMismatch | SqlError.SqlError | ParseResult.ParseError,
    never
  >;
  createTable: () => Effect.Effect<void, SqlError.SqlError, never>;
  sql: SqlClient.SqlClient;
}>;

const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* DatabaseConfig;

    return LibsqlClient.layer({
      url: config.DATABASE_URL,
      authToken: config.DATABASE_AUTH_TOKEN,
    });
  }),
);

const SqlTestLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* TestConfig;

    return LibsqlClient.layer({
      url: config.DATABASE_URL,
      authToken: config.DATABASE_AUTH_TOKEN,
    });
  }),
);

class Issue extends Schema.Class<Issue>("Issue")({
  id: Schema.String,
  name: Schema.String,
  publishDate: Schema.Date,
  isPublished: Schema.Int,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

const InsertIssueSchema = Issue.pipe(Schema.omit("createdAt", "updatedAt"));

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const InsertIssue = yield* SqlResolver.ordered("InsertIssue", {
    Request: InsertIssueSchema,
    Result: Issue,
    execute: (requests) =>
      sql`INSERT INTO issues ${sql.insert(requests)} RETURNING *`,
  });

  const insert = InsertIssue.execute;

  const createTable = () =>
    Effect.gen(function* () {
      yield* sql`CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        publishDate DATE,
        isPublished BOOLEAN NOT NULL DEFAULT 0,
        createdAt DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`;
    });

  return { insert, createTable, sql };
});

export class SqlService extends Context.Tag("sql-service")<
  SqlService,
  ISqlService
>() {
  static live = Layer.effect(this, make).pipe(Layer.provide(SqlLive));
  static test = Layer.effect(this, make).pipe(Layer.provide(SqlTestLive));
}
