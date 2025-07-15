// packages/server/src/knowledge_base/migrations/0023_create_idx_artist_fact_plays.ts
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating indexes on airdate column in fact_plays table")

  yield* sql`CREATE INDEX IF NOT EXISTS idx_fp_airdate ON fact_plays(airdate)`
})
