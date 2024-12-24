import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const issue = sqliteTable("issues", {
  id: text("id").notNull(),
  name: text("name").notNull(),
  published: integer("published", {
    mode: "boolean",
  }),
  publishDate: integer("publishDate", {
    mode: "timestamp",
  }).notNull().unique(),
});
