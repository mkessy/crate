CREATE TABLE IF NOT EXISTS "effect_sql_migrations" (
  migration_id integer PRIMARY KEY NOT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp,
  name VARCHAR(255) NOT NULL
);
CREATE TABLE mb_master_lookup(
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
                updated_at TEXT);
CREATE INDEX mb_master_artist_mb_id_index ON mb_master_lookup(artist_mb_id);
CREATE INDEX mb_master_entity_mb_id_index ON mb_master_lookup(entity_mb_id);
CREATE INDEX mb_master_entity_type_index ON mb_master_lookup(entity_type);
CREATE INDEX mb_master_relation_type_index ON mb_master_lookup(relation_type);
CREATE TABLE fact_plays (
        id INTEGER NOT NULL,
        airdate TEXT NOT NULL,
        show INTEGER NOT NULL,
        show_uri TEXT NOT NULL,
        image_uri TEXT,
        thumbnail_uri TEXT,
        song TEXT,
        track_id TEXT,
        recording_id TEXT,
        artist TEXT,
        artist_ids TEXT,
        album TEXT,
        release_id TEXT,
        release_group_id TEXT,
        labels TEXT,
        label_ids TEXT,
        release_date TEXT,
        rotation_status TEXT,
        is_local INTEGER CHECK(is_local IN (0, 1)),
        is_request INTEGER CHECK(is_request IN (0, 1)),
        is_live INTEGER CHECK(is_live IN (0, 1)),
        comment TEXT,
        play_type CHECK(play_type IN ('trackplay', 'nontrackplay')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

INSERT INTO effect_sql_migrations VALUES(1,'2025-06-25 07:56:52','initial_masters_table');
INSERT INTO effect_sql_migrations VALUES(2,'2025-06-25 07:58:51','create_indexes_on_mb_master_lookup');
INSERT INTO effect_sql_migrations VALUES(3,'2025-06-25 09:16:30','add_plays_table');