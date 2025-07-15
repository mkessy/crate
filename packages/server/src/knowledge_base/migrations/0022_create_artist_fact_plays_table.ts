// packages/server/src/knowledge_base/migrations/0022_create_artist_fact_plays_table.ts
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE IF NOT EXISTS artist_fact_plays (
      artist_id TEXT NOT NULL,
      fact_play_rowid INTEGER NOT NULL,
      airdate TEXT NOT NULL,
      album TEXT,
      release_id TEXT,
      song TEXT,
      play_hour INTEGER NOT NULL,
      play_day_of_week INTEGER NOT NULL,
      play_year INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (artist_id, fact_play_rowid)
    )
  `
})
