import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    Effect.all([
      sql`DROP TABLE IF EXISTS mb_artists_raw`,

      sql`
      CREATE TABLE mb_artists_raw (
        id PRIMARY KEY,
        type TEXT,
        aliases TEXT, 
        sort_name TEXT,
        country TEXT,
        gender TEXT,
        name TEXT NOT NULL,
        disambiguation TEXT
      )
    `,

      // Create indexes
      sql`CREATE INDEX IF NOT EXISTS idx_mb_artists_raw_id ON mb_artists_raw(id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_mb_artists_raw_name ON mb_artists_raw(name)`,

      Effect.logInfo("Simplified Musicbrainz artists table created")
    ])
)
