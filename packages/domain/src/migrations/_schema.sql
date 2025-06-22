CREATE TABLE IF NOT EXISTS "effect_sql_migrations" (
  migration_id integer PRIMARY KEY NOT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp,
  name VARCHAR(255) NOT NULL
);
CREATE TABLE kb_Artist (
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
        );
CREATE TABLE kb_Album (
          kb_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          mb_release_group_id TEXT UNIQUE,
          primary_type TEXT,
          secondary_types TEXT,
          first_release_date TEXT,
          disambiguation TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_Song (
          kb_id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          length_ms INTEGER,
          mb_recording_id TEXT UNIQUE,
          disambiguation TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_Release (
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
        );
CREATE TABLE kb_Genre (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          mb_genre_id TEXT,
          description TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_Location (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          mb_area_id TEXT UNIQUE,
          type TEXT,
          country_code TEXT,
          latitude REAL,
          longitude REAL,
          created_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_RecordLabel (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          mb_label_id TEXT,
          country TEXT,
          label_code INTEGER,
          created_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_Relationship (
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
        );
CREATE INDEX idx_kb_relationship_subject ON kb_Relationship(subject_type, subject_id);
CREATE INDEX idx_kb_relationship_object ON kb_Relationship(object_type, object_id);
CREATE INDEX idx_kb_relationship_predicate ON kb_Relationship(predicate);
CREATE TABLE kb_Host (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kexp_host_id INTEGER UNIQUE,
          host_uri TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_Program (
          kb_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kexp_program_id INTEGER UNIQUE,
          description TEXT,
          tags TEXT,
          program_uri TEXT,
          image_uri TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE kb_Show (
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
        );
CREATE TABLE kb_Play (
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
        );
CREATE TABLE kb_KexpComment (
          kb_id TEXT PRIMARY KEY,
          play_id INTEGER NOT NULL,
          comment_text TEXT NOT NULL,
          comment_length INTEGER NOT NULL,
          has_links INTEGER CHECK(has_links IN (0, 1)),
          contains_url INTEGER CHECK(contains_url IN (0, 1)),
          comment_type TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
CREATE TABLE bridge_kb_artist_to_kexp (
          kb_artist_id TEXT,
          kexp_artist_id_internal TEXT,
          PRIMARY KEY (kb_artist_id, kexp_artist_id_internal),
          FOREIGN KEY (kb_artist_id) REFERENCES kb_Artist(kb_id)
        );
CREATE TABLE bridge_kb_song_to_kexp (
          kb_song_id TEXT,
          kexp_track_id_internal TEXT,
          PRIMARY KEY (kb_song_id, kexp_track_id_internal),
          FOREIGN KEY (kb_song_id) REFERENCES kb_Song(kb_id)
        );
CREATE TABLE dim_artists_master (
        artist_id_internal TEXT,
        primary_name_observed TEXT,
        mb_id TEXT
      );
CREATE TABLE dim_hosts (
        host_id INTEGER,
        primary_name TEXT,
        host_uri TEXT
      );
CREATE TABLE dim_labels_master (
        label_id_internal TEXT,
        primary_name_observed TEXT,
        mb_id TEXT
      );
CREATE TABLE dim_programs (
        program_id INTEGER,
        primary_name TEXT,
        program_uri TEXT,
        description TEXT,
        tags TEXT,
        image_uri TEXT
      );
CREATE TABLE dim_releases_master (
        release_id_internal TEXT,
        primary_album_name_observed TEXT,
        mb_release_id TEXT,
        mb_release_group_id TEXT,
        release_date_iso TEXT
      );
CREATE TABLE dim_shows (
        show_id INTEGER,
        show_uri TEXT,
        program_id TEXT,
        start_time_iso TEXT,
        tagline_at_show_time TEXT,
        title_at_show_time TEXT,
        program_name_at_show_time TEXT,
        program_tags_at_show_time TEXT,
        host_ids_at_show_time TEXT
      );
CREATE TABLE dim_timeslots (
        timeslot_id INTEGER,
        program_id INTEGER,
        weekday INTEGER,
        start_date_iso TEXT,
        end_date_iso TEXT,
        start_time_str TEXT,
        end_time_str TEXT,
        duration_str TEXT
      );
CREATE TABLE dim_tracks (
        track_id_internal TEXT,
        primary_song_title_observed TEXT,
        mb_track_id TEXT,
        mb_recording_id TEXT,
        release_id_internal_on_track TEXT
      );
CREATE TABLE fact_plays (
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
      );
CREATE TABLE bridge_artist_id_to_names (
        artist_id_internal TEXT,
        observed_name_string TEXT
      );
CREATE TABLE bridge_label_id_to_names (
        label_id_internal TEXT,
        observed_label_name_string TEXT
      );
CREATE TABLE bridge_play_to_artist (
        play_id INTEGER,
        artist_id_internal TEXT
      );
CREATE TABLE bridge_play_to_label (
        play_id INTEGER,
        label_id_internal TEXT
      );
CREATE TABLE bridge_release_id_to_names (
        release_id_internal TEXT,
        observed_album_name_string TEXT
      );
CREATE TABLE bridge_show_hosts (
        show_id INTEGER,
        host_id INTEGER
      );
CREATE TABLE bridge_timeslot_hosts (
        timeslot_id INTEGER,
        host_id INTEGER
      );
CREATE INDEX idx_fact_plays_play_id ON fact_plays(play_id);
CREATE INDEX idx_fact_plays_track_id ON fact_plays(track_id_internal);
CREATE INDEX idx_fact_plays_show_id ON fact_plays(show_id);
CREATE INDEX idx_fact_plays_airdate ON fact_plays(airdate_iso);
CREATE INDEX idx_bridge_play_to_artist_play_id ON bridge_play_to_artist(play_id);
CREATE INDEX idx_bridge_play_to_artist_artist_id ON bridge_play_to_artist(artist_id_internal);
CREATE TABLE comment_splitting_strategies (
        strategy_id INTEGER PRIMARY KEY,
        strategy_name TEXT NOT NULL,
        description TEXT,
        split_pattern TEXT NOT NULL
      );
CREATE TABLE comment_chunks_raw (
        chunk_id INTEGER,
        play_id INTEGER,
        strategy_id INTEGER,
        chunk_index INTEGER,
        chunk_text TEXT NOT NULL,
        chunk_length INTEGER NOT NULL,
        normalized_chunk_text TEXT NOT NULL,
        is_url_only INTEGER NOT NULL CHECK(is_url_only IN (0, 1)),
        contains_url INTEGER NOT NULL CHECK(contains_url IN (0, 1)),
        alpha_ratio REAL,
        alphanum_ratio REAL,
        created_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (play_id, strategy_id, chunk_index)
      );
CREATE TABLE chunk_embeddings (
        chunk_id INTEGER PRIMARY KEY,
        embedding TEXT NOT NULL, -- Will store as JSON array
        created_at TEXT DEFAULT (datetime('now'))
      );
CREATE TABLE bertopic_runs (
        run_id INTEGER PRIMARY KEY,
        model_run_name TEXT NOT NULL UNIQUE,
        ingested_at TEXT DEFAULT (datetime('now'))
      );
CREATE TABLE bertopic_topics (
        run_id INTEGER,
        topic_id INTEGER,
        name TEXT,
        count INTEGER,
        representation_main TEXT, -- JSON array
        representation_mmr TEXT, -- JSON array
        representation_pos TEXT, -- JSON array
        representative_docs TEXT, -- JSON array
        llm_summary TEXT,
        PRIMARY KEY (run_id, topic_id),
        FOREIGN KEY (run_id) REFERENCES bertopic_runs(run_id)
      );
CREATE TABLE bertopic_hierarchy (
        run_id INTEGER NOT NULL,
        parent_id INTEGER,
        parent_name TEXT,
        child_left_id INTEGER,
        child_left_name TEXT,
        child_right_id INTEGER,
        child_right_name TEXT,
        distance REAL,
        FOREIGN KEY (run_id) REFERENCES bertopic_runs(run_id)
      );
CREATE TABLE bridge_chunk_topic (
        run_id INTEGER,
        chunk_id INTEGER,
        topic_id INTEGER NOT NULL,
        PRIMARY KEY (run_id, chunk_id),
        FOREIGN KEY (run_id) REFERENCES bertopic_runs(run_id)
      );
CREATE UNIQUE INDEX idx_comment_chunks_raw_chunk_id ON comment_chunks_raw(chunk_id);
CREATE INDEX idx_chunk_embeddings_chunk_id ON chunk_embeddings(chunk_id);
CREATE INDEX idx_bridge_chunk_topic_chunk_id ON bridge_chunk_topic(chunk_id);
CREATE TABLE mb_artists_raw (
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
      );
CREATE TABLE mb_relations_enhanced (
        artist_mb_id TEXT,
        artist_name TEXT,
        relation_type TEXT,
        target_type TEXT,
        attributes_raw TEXT, -- JSON array
        attributes_array TEXT, -- JSON array
        begin_date TEXT,
        end_date TEXT
      );
CREATE INDEX idx_mb_artists_raw_id ON mb_artists_raw(id);
CREATE INDEX idx_mb_artists_raw_name ON mb_artists_raw(name);
CREATE INDEX idx_mb_relations_enhanced_artist_mb_id ON mb_relations_enhanced(artist_mb_id);
CREATE INDEX idx_mb_relations_enhanced_relation_type ON mb_relations_enhanced(relation_type);

INSERT INTO effect_sql_migrations VALUES(1,'2025-06-21 23:12:37','initial_schema');
INSERT INTO effect_sql_migrations VALUES(2,'2025-06-21 23:12:37','fact_dimension_tables');
INSERT INTO effect_sql_migrations VALUES(3,'2025-06-21 23:12:37','comment_analysis_tables');
INSERT INTO effect_sql_migrations VALUES(4,'2025-06-21 23:12:37','musicbrainz_tables');