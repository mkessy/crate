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
CREATE UNIQUE INDEX idx_fact_plays_id ON fact_plays (id);
CREATE INDEX idx_artist_entity_relation ON mb_master_lookup(artist_mb_id, entity_type, relation_type);
CREATE INDEX idx_artist_entity ON mb_master_lookup(artist_mb_id, entity_type);
CREATE INDEX idx_entity_relation ON mb_master_lookup(entity_mb_id, relation_type);
CREATE INDEX idx_relation_entity ON mb_master_lookup(relation_type, entity_type);
CREATE INDEX idx_artist_relation ON mb_master_lookup(artist_mb_id, relation_type);
CREATE TABLE master_relations (
      subject_id          TEXT NOT NULL,
      subject_type        TEXT NOT NULL,
      subject_name        TEXT,
      predicate           TEXT NOT NULL,
      object_id           TEXT NOT NULL,
      object_type         TEXT NOT NULL,
      object_name         TEXT,
      attribute_type      TEXT,
      source              TEXT NOT NULL,
      kexp_play_id        INTEGER
    , updated_at DATETIME, created_at DATETIME);
CREATE UNIQUE INDEX idx_master_relations_pk 
ON master_relations(subject_id, predicate, object_id, attribute_type);
CREATE INDEX idx_relations_forward
ON master_relations (subject_id, predicate, object_type);
CREATE INDEX idx_relations_reverse
ON master_relations (object_id, predicate, subject_type);
CREATE INDEX idx_relations_predicate
ON master_relations (predicate);
CREATE INDEX idx_relations_source
ON master_relations (source);
CREATE INDEX idx_relations_kexp_play
ON master_relations (kexp_play_id) WHERE kexp_play_id IS NOT NULL;
CREATE TABLE sqlite_stat1(tbl,idx,stat);
CREATE TABLE sqlite_stat4(tbl,idx,neq,nlt,ndlt,sample);
CREATE TRIGGER fact_plays_has_recording_trigger
AFTER INSERT ON fact_plays
FOR EACH ROW
WHEN NEW.recording_id IS NOT NULL
BEGIN
    INSERT OR IGNORE INTO master_relations (
        subject_id, 
        subject_type, 
        subject_name, 
        predicate, 
        object_id, 
        object_type, 
        object_name,
        attribute_type,
        source, 
        kexp_play_id,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id, 
        'play', 
        NEW.song,
        'has_recording',
        NEW.recording_id, 
        'recording', 
        NEW.song,
        NULL,
        'kexp', 
        NEW.id,
        datetime('now'), 
        datetime('now')
    );
END;
CREATE TRIGGER fact_plays_has_release_trigger
AFTER INSERT ON fact_plays
FOR EACH ROW
WHEN NEW.release_id IS NOT NULL
BEGIN
    INSERT OR IGNORE INTO master_relations (
        subject_id, 
        subject_type, 
        subject_name, 
        predicate, 
        object_id, 
        object_type, 
        object_name,
        attribute_type,
        source, 
        kexp_play_id,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id, 
        'play', 
        NEW.song,
        'has_release',
        NEW.release_id, 
        'release', 
        NEW.album,
        NULL,
        'kexp', 
        NEW.id,
        datetime('now'), 
        datetime('now')
    );
END;

INSERT INTO effect_sql_migrations VALUES(1,'2025-06-25 07:56:52','initial_masters_table');
INSERT INTO effect_sql_migrations VALUES(2,'2025-06-25 07:58:51','create_indexes_on_mb_master_lookup');
INSERT INTO effect_sql_migrations VALUES(3,'2025-06-25 09:16:30','add_plays_table');
INSERT INTO effect_sql_migrations VALUES(4,'2025-06-25 09:46:16','add_idx_fact_plays');
INSERT INTO effect_sql_migrations VALUES(5,'2025-06-25 19:41:29','add_composite_idx_masters_table');
INSERT INTO effect_sql_migrations VALUES(6,'2025-06-26 06:12:05','create_master_relations_table');
INSERT INTO effect_sql_migrations VALUES(7,'2025-06-26 06:29:09','migrate_data_relations_table');
INSERT INTO effect_sql_migrations VALUES(8,'2025-06-26 06:50:48','populate_master_relations');
INSERT INTO effect_sql_migrations VALUES(9,'2025-06-26 06:50:48','create_master_relations_idexes');
INSERT INTO effect_sql_migrations VALUES(10,'2025-06-27 01:25:23','create_triggers_recording_release');