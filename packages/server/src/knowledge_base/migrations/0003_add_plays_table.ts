import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.logInfo("Adding fact_plays table")

  yield* Effect.all([
    sql`
      CREATE TABLE IF NOT EXISTS fact_plays (
        id INTEGER NOT NULL,
        airdate TEXT NOT NULL,
        show INTEGER NOT NULL,
        show_uri TEXT NOT NULL,
        image_uri TEXT,
        thumbnail_uri TEXT,
        song TEXT,
        track_id TEXT,
        recording_id TEXT,
        artist TEXT,
        artist_ids TEXT,
        album TEXT,
        release_id TEXT,
        release_group_id TEXT,
        labels TEXT,
        label_ids TEXT,
        release_date TEXT,
        rotation_status TEXT,
        is_local INTEGER CHECK(is_local IN (0, 1)),
        is_request INTEGER CHECK(is_request IN (0, 1)),
        is_live INTEGER CHECK(is_live IN (0, 1)),
        comment TEXT,
        play_type CHECK(play_type IN ('trackplay', 'nontrackplay')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `
  ])

  yield* Effect.logInfo("fact_plays table added")
})
