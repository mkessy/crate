import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* Effect.log("Creating audit log table")

  yield* sql`CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      metadata TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )`

  yield* Effect.log("Audit log table created")
})
