import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Adding composite indexes to mb_master_lookup")

  yield* Effect.all([
    sql`CREATE INDEX idx_artist_entity_relation ON mb_master_lookup(artist_mb_id, entity_type, relation_type)`,
    sql`CREATE INDEX idx_artist_entity ON mb_master_lookup(artist_mb_id, entity_type)`,
    sql`CREATE INDEX idx_entity_relation ON mb_master_lookup(entity_mb_id, relation_type)`,
    sql`CREATE INDEX idx_relation_entity ON mb_master_lookup(relation_type, entity_type)`,
    sql`CREATE INDEX idx_artist_relation ON mb_master_lookup(artist_mb_id, relation_type)`
  ])

  yield* Effect.log("Done adding composite indexes to mb_master_lookup")
})
