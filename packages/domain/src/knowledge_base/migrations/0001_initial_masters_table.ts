import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.logInfo("Starting initial schema migration: mb_master table")

  yield* sql`CREATE TABLE IF NOT EXISTS mb_master_lookup(
                artist_mb_id TEXT, 
                artist_name TEXT, 
                artist_disambiguation TEXT, 
                artist_type TEXT, 
                artist_gender TEXT, 
                artist_country TEXT, 
                artist_life_begin TEXT, 
                artist_life_end TEXT, 
                artist_life_ended INTEGER, 
                entity_type TEXT, 
                entity_mb_id TEXT, 
                entity_name TEXT, 
                entity_disambiguation TEXT, 
                relation_type TEXT, 
                direction TEXT, 
                begin_date TEXT, 
                end_date TEXT, 
                ended INTEGER, 
                attribute_type TEXT, 
                entity_metadata TEXT,
                created_at TEXT,
                updated_at TEXT)`

  yield* Effect.logInfo("mb_master_lookup table created")
})
