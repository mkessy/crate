import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* Effect.log("Creating artists masters table")

  yield* sql`CREATE TABLE artists_masters (
      mb_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      disambiguation TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )`

  yield* Effect.log("Audit log table created")
})
