import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating full text search index on entities")

  yield* sql`-- Create the FTS5 table
CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
    entity_uri UNINDEXED,
    entity_type UNINDEXED,
    search_document,
    popularity_score UNINDEXED
);`

  yield* Effect.log("Done creating full text search index on entities")
})
