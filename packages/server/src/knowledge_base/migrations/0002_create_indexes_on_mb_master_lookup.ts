import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.logInfo("Creating indexes on mb_master_lookup table")

  yield* sql`CREATE INDEX IF NOT EXISTS mb_master_artist_mb_id_index ON mb_master_lookup(artist_mb_id)`
  yield* sql`CREATE INDEX IF NOT EXISTS mb_master_entity_mb_id_index ON mb_master_lookup(entity_mb_id)`
  yield* sql`CREATE INDEX IF NOT EXISTS mb_master_entity_type_index ON mb_master_lookup(entity_type)`
  yield* sql`CREATE INDEX IF NOT EXISTS mb_master_relation_type_index ON mb_master_lookup(relation_type)`

  yield* Effect.logInfo("mb_master_lookup table indexes created")
})
