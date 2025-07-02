import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating comment search fts triggers")

  yield* sql`DROP TRIGGER IF EXISTS comment_fts_ai;`
  yield* sql`DROP TRIGGER IF EXISTS comment_fts_au;`
  yield* sql`DROP TRIGGER IF EXISTS comment_fts_ad;`

  yield* sql`CREATE TRIGGER IF NOT EXISTS comment_fts_ai AFTER INSERT ON comments BEGIN
    INSERT INTO comment_search_fts(chunk_id, chunk_text, search_text)
    VALUES (NEW.chunk_id, NEW.chunk_text, NEW.search_text);
  END;`

  yield* sql`CREATE TRIGGER IF NOT EXISTS comment_fts_au AFTER UPDATE OF chunk_text, search_text ON comments BEGIN
    UPDATE comment_search_fts 
    SET chunk_text = NEW.chunk_text, search_text = NEW.search_text
    WHERE chunk_id = NEW.chunk_id;
  END;`

  yield* sql`CREATE TRIGGER IF NOT EXISTS comment_fts_ad AFTER DELETE ON comments BEGIN
    DELETE FROM comment_search_fts WHERE chunk_id = OLD.chunk_id;
  END;`

  yield* Effect.log("Done creating comment search fts triggers")
})
