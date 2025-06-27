import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating indexes on master_relations")

  yield* sql`DROP TRIGGER IF EXISTS fact_plays_has_recording_trigger;`
  yield* sql`DROP TRIGGER IF EXISTS fact_plays_has_release_trigger;`

  yield* sql`CREATE TRIGGER fact_plays_has_recording_trigger
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
END;`

  yield* sql`CREATE TRIGGER fact_plays_has_release_trigger
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
END;`

  yield* Effect.log("Done creating triggers on fact_plays")
})
