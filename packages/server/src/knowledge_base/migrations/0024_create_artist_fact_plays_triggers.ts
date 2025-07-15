// packages/server/src/knowledge_base/migrations/0024_create_artist_fact_plays_triggers.ts
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  // Trigger for INSERTs on fact_plays
  yield* sql`
    CREATE TRIGGER IF NOT EXISTS artist_fact_plays_insert_trigger
    AFTER INSERT ON fact_plays
    WHEN NEW.artist_ids IS NOT NULL AND NEW.artist_ids != '[]'
    BEGIN
      INSERT INTO artist_fact_plays (
        fact_play_rowid, artist_id, airdate, album, release_id, song,
        play_hour, play_day_of_week, play_year
      )
      SELECT 
        NEW.rowid, artist_ids.value, NEW.airdate, NEW.album, NEW.release_id, NEW.song,
        CAST(strftime('%H', NEW.airdate) AS INTEGER), CAST(strftime('%w', NEW.airdate) AS INTEGER), CAST(strftime('%Y', NEW.airdate) AS INTEGER)
      FROM json_each(NEW.artist_ids) AS artist_ids;
    END;
  `

  // Trigger for DELETEs on fact_plays
  yield* sql`
    CREATE TRIGGER IF NOT EXISTS artist_fact_plays_delete_trigger
    AFTER DELETE ON fact_plays
    BEGIN
      DELETE FROM artist_fact_plays WHERE fact_play_rowid = OLD.rowid;
    END;
  `

  // Trigger for UPDATEs on fact_plays
  yield* sql`
    CREATE TRIGGER IF NOT EXISTS artist_fact_plays_update_trigger
    AFTER UPDATE OF artist_ids ON fact_plays
    WHEN NEW.artist_ids IS NOT NULL AND NEW.artist_ids != '[]'
    BEGIN
      DELETE FROM artist_fact_plays WHERE fact_play_rowid = OLD.rowid;
      INSERT INTO artist_fact_plays (
        fact_play_rowid, artist_id, airdate, album, release_id, song,
        play_hour, play_day_of_week, play_year
      )
      SELECT 
        NEW.rowid, artist_ids.value, NEW.airdate, NEW.album, NEW.release_id, NEW.song,
        CAST(strftime('%H', NEW.airdate) AS INTEGER), CAST(strftime('%w', NEW.airdate) AS INTEGER), CAST(strftime('%Y', NEW.airdate) AS INTEGER)
      FROM json_each(NEW.artist_ids) AS artist_ids;
    END;
  `
})
