import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.logInfo("Adding fact_plays table")

  yield* sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_fact_plays_id ON fact_plays (id)`

  yield* Effect.logInfo("fact_plays table added")
})
