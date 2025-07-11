import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Dropping comment search FTS triggers")

  // Drop all comment FTS triggers first
  yield* sql`DROP TRIGGER IF EXISTS comment_fts_ai;`
  yield* sql`DROP TRIGGER IF EXISTS comment_fts_au;`
  yield* sql`DROP TRIGGER IF EXISTS comment_fts_ad;`

  yield* Effect.log("Dropping comment search FTS virtual table")

  // Drop the FTS virtual table (this will also drop the associated _data, _idx, _docsize, _config tables)
  yield* sql`DROP TABLE IF EXISTS comment_search_fts;`

  yield* Effect.log("Dropping comment topic tables")

  // Drop comment topic-related tables
  yield* sql`DROP TABLE IF EXISTS comment_topic_info;`
  yield* sql`DROP TABLE IF EXISTS comment_topics;`

  yield* Effect.log("Dropping comment indexes")

  // Drop comment-related indexes
  yield* sql`DROP INDEX IF EXISTS idx_play_id;`
  yield* sql`DROP INDEX IF EXISTS idx_topic_id;`
  yield* sql`DROP INDEX IF EXISTS idx_topic;`

  yield* Effect.log("Dropping comments table")

  // Drop the main comments table
  yield* sql`DROP TABLE IF EXISTS comments;`

  yield* Effect.log("Comment tables and FTS cleanup completed")
})
