import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating comment search fts")

  yield* sql`DROP TABLE IF EXISTS comment_search_fts;`
  yield* sql`CREATE VIRTUAL TABLE comment_search_fts USING fts5(
    chunk_id UNINDEXED,
    chunk_text,
    search_text,
    content=comments,
    content_rowid=chunk_id
  );`

  yield* Effect.log("Done creating comment search fts")
})
