import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating indexes on master_relations")

  yield* Effect.log("Creating forward index on master_relations")
  yield* sql`CREATE INDEX IF NOT EXISTS idx_relations_forward
ON master_relations (subject_id, predicate, object_type);`

  yield* Effect.log("Creating reverse index on master_relations")
  yield* sql`CREATE INDEX IF NOT EXISTS idx_relations_reverse
ON master_relations (object_id, predicate, subject_type);`

  yield* Effect.log("Creating predicate index on master_relations")
  yield* sql`CREATE INDEX IF NOT EXISTS idx_relations_predicate
ON master_relations (predicate);`

  yield* Effect.log("Creating source index on master_relations")
  yield* sql`CREATE INDEX IF NOT EXISTS idx_relations_source
ON master_relations (source);`

  yield* Effect.log("Creating kexp_play index on master_relations")
  yield* sql`CREATE INDEX IF NOT EXISTS idx_relations_kexp_play
ON master_relations (kexp_play_id) WHERE kexp_play_id IS NOT NULL;`

  yield* Effect.log("Done creating indexes on master_relations")
})
