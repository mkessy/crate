import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    Effect.all([
      // Dimension tables for KEXP data
      Effect.logInfo("Creating fact and dimension tables"),

      sql`
      CREATE TABLE IF NOT EXISTS dim_artists_master (
        artist_id_internal TEXT,
        primary_name_observed TEXT,
        mb_id TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_hosts (
        host_id INTEGER,
        primary_name TEXT,
        host_uri TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_labels_master (
        label_id_internal TEXT,
        primary_name_observed TEXT,
        mb_id TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_programs (
        program_id INTEGER,
        primary_name TEXT,
        program_uri TEXT,
        description TEXT,
        tags TEXT,
        image_uri TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_releases_master (
        release_id_internal TEXT,
        primary_album_name_observed TEXT,
        mb_release_id TEXT,
        mb_release_group_id TEXT,
        release_date_iso TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_shows (
        show_id INTEGER,
        show_uri TEXT,
        program_id TEXT,
        start_time_iso TEXT,
        tagline_at_show_time TEXT,
        title_at_show_time TEXT,
        program_name_at_show_time TEXT,
        program_tags_at_show_time TEXT,
        host_ids_at_show_time TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_timeslots (
        timeslot_id INTEGER,
        program_id INTEGER,
        weekday INTEGER,
        start_date_iso TEXT,
        end_date_iso TEXT,
        start_time_str TEXT,
        end_time_str TEXT,
        duration_str TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS dim_tracks (
        track_id_internal TEXT,
        primary_song_title_observed TEXT,
        mb_track_id TEXT,
        mb_recording_id TEXT,
        release_id_internal_on_track TEXT
      )
    `,

      // Fact table
      sql`
      CREATE TABLE IF NOT EXISTS fact_plays (
        play_id INTEGER,
        airdate_iso TEXT,
        show_id INTEGER,
        track_id_internal TEXT,
        comment TEXT,
        rotation_status TEXT,
        is_local INTEGER CHECK(is_local IN (0, 1)),
        is_request INTEGER CHECK(is_request IN (0, 1)),
        is_live INTEGER CHECK(is_live IN (0, 1)),
        play_type TEXT,
        original_artist_text TEXT,
        original_album_text TEXT,
        original_song_text TEXT
      )
    `,

      // Bridge tables for many-to-many relationships
      sql`
      CREATE TABLE IF NOT EXISTS bridge_artist_id_to_names (
        artist_id_internal TEXT,
        observed_name_string TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_label_id_to_names (
        label_id_internal TEXT,
        observed_label_name_string TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_play_to_artist (
        play_id INTEGER,
        artist_id_internal TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_play_to_label (
        play_id INTEGER,
        label_id_internal TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_release_id_to_names (
        release_id_internal TEXT,
        observed_album_name_string TEXT
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_show_hosts (
        show_id INTEGER,
        host_id INTEGER
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_timeslot_hosts (
        timeslot_id INTEGER,
        host_id INTEGER
      )
    `,

      // Create indexes for performance
      sql`CREATE INDEX IF NOT EXISTS idx_fact_plays_play_id ON fact_plays(play_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_fact_plays_track_id ON fact_plays(track_id_internal)`,
      sql`CREATE INDEX IF NOT EXISTS idx_fact_plays_show_id ON fact_plays(show_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_fact_plays_airdate ON fact_plays(airdate_iso)`,

      sql`CREATE INDEX IF NOT EXISTS idx_bridge_play_to_artist_play_id ON bridge_play_to_artist(play_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_bridge_play_to_artist_artist_id ON bridge_play_to_artist(artist_id_internal)`,

      Effect.logInfo("Fact and dimension tables created")
    ])
)
