import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* Effect.log("Creating unresolved mb artist table")

  yield* sql`CREATE TABLE mb_artist_unresolved (
      id INTEGER PRIMARY KEY,
      artist_mb_id TEXT NOT NULL,
      artist TEXT NOT NULL,
      source TEXT NOT NULL,
      kexp_play_id INTEGER,
      latest_play TIMESTAMP,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )`

  yield* Effect.log("Audit log table created")
})
