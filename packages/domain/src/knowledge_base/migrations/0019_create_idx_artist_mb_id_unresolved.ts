import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating unique index on mb_artist_unresolved artist_mb_id")

  yield* sql`CREATE UNIQUE INDEX idx_mb_artist_unresolved_artist_mb_id 
ON mb_artist_unresolved(artist_mb_id);`
  yield* Effect.log("Done creating unique index on mb_artist_unresolved artist_mb_id")
})
