import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.logInfo("Starting initial schema migration")

  // Core entity tables
  yield* Effect.all([
    sql`
        CREATE TABLE IF NOT EXISTS kb_Artist (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          sort_name TEXT,
          type TEXT CHECK(type IN ('PERSON', 'GROUP', 'ORCHESTRA', 'CHOIR', 'CHARACTER', 'OTHER')),
          mb_artist_id TEXT UNIQUE,
          begin_date TEXT,
          end_date TEXT,
          disambiguation TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Album (
          kb_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          mb_release_group_id TEXT UNIQUE,
          primary_type TEXT,
          secondary_types TEXT,
          first_release_date TEXT,
          disambiguation TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Song (
          kb_id TEXT PRIMARY KEY,
          title TEXT,
          length_ms INTEGER,
          mb_recording_id TEXT UNIQUE,
          disambiguation TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Release (
          kb_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          mb_release_id TEXT UNIQUE,
          album_id TEXT,
          release_date TEXT,
          country TEXT,
          barcode TEXT,
          disambiguation TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (album_id) REFERENCES kb_Album(kb_id)
        )
      `
  ])
  // Metadata tables
  yield* Effect.all([
    sql`
        CREATE TABLE IF NOT EXISTS kb_Genre (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          mb_genre_id TEXT,
          description TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Location (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          mb_area_id TEXT UNIQUE,
          type TEXT,
          country_code TEXT,
          latitude REAL,
          longitude REAL,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_RecordLabel (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          mb_label_id TEXT,
          country TEXT,
          label_code INTEGER,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `
  ])

  // Relationship table
  yield* Effect.all([
    sql`
        CREATE TABLE IF NOT EXISTS kb_Relationship (
          triple_id TEXT PRIMARY KEY,
          subject_type TEXT NOT NULL,
          subject_id TEXT NOT NULL,
          predicate TEXT NOT NULL,
          object_type TEXT NOT NULL,
          object_id TEXT NOT NULL,
          source_name TEXT,
          target_name TEXT,
          mb_relation_type TEXT,
          mb_target_type TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`CREATE INDEX IF NOT EXISTS idx_kb_relationship_subject ON kb_Relationship(subject_type, subject_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_kb_relationship_object ON kb_Relationship(object_type, object_id)`,
    sql`CREATE INDEX IF NOT EXISTS idx_kb_relationship_predicate ON kb_Relationship(predicate)`
  ])
  // KEXP-specific tables
  yield* Effect.all([
    sql`
        CREATE TABLE IF NOT EXISTS kb_Host (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kexp_host_id INTEGER UNIQUE,
          host_uri TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Program (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kexp_program_id INTEGER UNIQUE,
          description TEXT,
          tags TEXT,
          program_uri TEXT,
          image_uri TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Show (
          kb_id TEXT PRIMARY KEY,
          kexp_show_id INTEGER NOT NULL UNIQUE,
          show_uri TEXT,
          start_time TEXT,
          title TEXT,
          tagline TEXT,
          program_name TEXT,
          program_tags TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_Play (
          kb_id TEXT PRIMARY KEY,
          play_id INTEGER NOT NULL UNIQUE,
          airdate TEXT,
          rotation_status TEXT,
          is_local INTEGER CHECK(is_local IN (0, 1)),
          is_request INTEGER CHECK(is_request IN (0, 1)),
          is_live INTEGER CHECK(is_live IN (0, 1)),
          play_type TEXT,
          has_comment INTEGER CHECK(has_comment IN (0, 1)),
          comment_length INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS kb_KexpComment (
          kb_id TEXT PRIMARY KEY,
          play_id INTEGER NOT NULL,
          comment_text TEXT NOT NULL,
          comment_length INTEGER NOT NULL,
          has_links INTEGER CHECK(has_links IN (0, 1)),
          contains_url INTEGER CHECK(contains_url IN (0, 1)),
          comment_type TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `
  ])

  // Bridge tables
  yield* Effect.all([
    sql`
        CREATE TABLE IF NOT EXISTS bridge_kb_artist_to_kexp (
          kb_artist_id TEXT,
          kexp_artist_id_internal TEXT,
          PRIMARY KEY (kb_artist_id, kexp_artist_id_internal),
          FOREIGN KEY (kb_artist_id) REFERENCES kb_Artist(kb_id)
        )
      `,
    sql`
        CREATE TABLE IF NOT EXISTS bridge_kb_song_to_kexp (
          kb_song_id TEXT,
          kexp_track_id_internal TEXT,
          PRIMARY KEY (kb_song_id, kexp_track_id_internal),
          FOREIGN KEY (kb_song_id) REFERENCES kb_Song(kb_id)
        )
    `
  ])

  yield* Effect.logInfo("Initial schema migration completed")
})
