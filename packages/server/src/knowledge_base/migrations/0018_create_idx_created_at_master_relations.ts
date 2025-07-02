import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating index on master_relations created_at")
  yield* sql`CREATE INDEX idx_master_relations_created_at 
ON master_relations(created_at);`

  yield* Effect.log("Done creating index on master_relations")
})
