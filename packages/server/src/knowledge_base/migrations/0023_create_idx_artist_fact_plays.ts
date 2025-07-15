// packages/server/src/knowledge_base/migrations/0023_create_idx_artist_fact_plays.ts
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating indexes on artist_fact_plays table")

  yield* sql`CREATE INDEX IF NOT EXISTS idx_afp_airdate ON artist_fact_plays(airdate)`
  yield* sql`CREATE INDEX IF NOT EXISTS idx_afp_artist_airdate ON artist_fact_plays(artist_id, airdate DESC)`
})
