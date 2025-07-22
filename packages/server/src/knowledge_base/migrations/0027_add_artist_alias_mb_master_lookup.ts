import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Adding artist_aliases column to mb_master_lookup table")

  yield* sql`ALTER TABLE mb_master_lookup ADD COLUMN artist_aliases TEXT`

  yield* Effect.log("artist_aliases column added to mb_master_lookup table")
})
