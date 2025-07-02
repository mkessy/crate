import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating comment tables")

  yield* sql`DROP TABLE IF EXISTS comments`

  yield* sql`
  CREATE TABLE IF NOT EXISTS comments (
    chunk_id INTEGER PRIMARY KEY,
    play_id INTEGER,
    chunk_index INTEGER,
    chunk_text TEXT,
    normalized_chunk_text TEXT,
    chunk_length INTEGER,
    contains_url INTEGER,
    is_url_only INTEGER,
    alpha_ratio REAL,
    alphanum_ratio REAL,
    bertopic_run_id INTEGER,
    topics_json TEXT,
    bertopic_140413_topic_id INTEGER,
    bertopic_140413_cleaned_text TEXT,
    search_text TEXT,
    created_at TEXT,
    updated_at TEXT
  );`

  yield* sql`
  CREATE TABLE IF NOT EXISTS comment_topics (
    topic_id INTEGER,
    parent_id INTEGER,
    parent_name TEXT,
    child_position TEXT,
    distance REAL
  );
  `

  yield* sql`
  CREATE TABLE IF NOT EXISTS comment_topic_info (
    topic_id INTEGER PRIMARY KEY,
    topic_name TEXT,
    document_count INTEGER,
    main_keywords TEXT,
    llm_summary TEXT
  );
  `
})
