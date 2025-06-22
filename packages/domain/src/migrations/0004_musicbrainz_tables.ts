import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    Effect.all([
      Effect.logInfo("Creating musicbrainz tables"),

      // MusicBrainz raw data table (simplified structure)
      sql`
      CREATE TABLE IF NOT EXISTS mb_artists_raw (
        type TEXT,
        id TEXT,
        aliases TEXT, -- JSON
        life_span TEXT, -- JSON
        area TEXT, -- JSON
        begin_area TEXT, -- JSON
        annotation TEXT,
        relations TEXT, -- JSON
        sort_name TEXT,
        type_id TEXT,
        country TEXT,
        end_area TEXT, -- JSON
        isnis TEXT, -- JSON array
        ipis TEXT, -- JSON array
        gender_id TEXT,
        tags TEXT, -- JSON
        gender TEXT,
        genres TEXT, -- JSON
        rating TEXT, -- JSON
        name TEXT,
        disambiguation TEXT
      )
    `,

      // Enhanced relations table
      sql`
      CREATE TABLE IF NOT EXISTS mb_relations_enhanced (
        artist_mb_id TEXT,
        artist_name TEXT,
        relation_type TEXT,
        target_type TEXT,
        attributes_raw TEXT, -- JSON array
        attributes_array TEXT, -- JSON array
        begin_date TEXT,
        end_date TEXT
      )
    `,

      // Create indexes
      sql`CREATE INDEX IF NOT EXISTS idx_mb_artists_raw_id ON mb_artists_raw(id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_mb_artists_raw_name ON mb_artists_raw(name)`,
      sql`CREATE INDEX IF NOT EXISTS idx_mb_relations_enhanced_artist_mb_id ON mb_relations_enhanced(artist_mb_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_mb_relations_enhanced_relation_type ON mb_relations_enhanced(relation_type)`,

      Effect.logInfo("Musicbrainz tables created")
    ])
)
