import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating comment topic indexes")

  yield* sql`CREATE INDEX IF NOT EXISTS idx_play_id ON comments(play_id);`
  yield* sql`CREATE INDEX IF NOT EXISTS idx_topic_id ON comments(bertopic_140413_topic_id);`
  yield* sql`CREATE INDEX IF NOT EXISTS idx_topic ON comment_topics(topic_id);`

  yield* Effect.log("Done creating comment topic indexes")
})
