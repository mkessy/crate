import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    Effect.all([
      // Comment splitting strategies
      Effect.logInfo("Creating comment analysis tables"),

      sql`
      CREATE TABLE IF NOT EXISTS comment_splitting_strategies (
        strategy_id INTEGER PRIMARY KEY,
        strategy_name TEXT NOT NULL,
        description TEXT,
        split_pattern TEXT NOT NULL
      )
    `,

      // Comment chunks
      sql`
      CREATE TABLE IF NOT EXISTS comment_chunks_raw (
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
      )
    `,

      // Chunk embeddings (without vector type, store as JSON text)
      sql`
      CREATE TABLE IF NOT EXISTS chunk_embeddings (
        chunk_id INTEGER PRIMARY KEY,
        embedding TEXT NOT NULL, -- Will store as JSON array
        created_at TEXT DEFAULT (datetime('now'))
      )
    `,

      // BERTopic tables
      sql`
      CREATE TABLE IF NOT EXISTS bertopic_runs (
        run_id INTEGER PRIMARY KEY,
        model_run_name TEXT NOT NULL UNIQUE,
        ingested_at TEXT DEFAULT (datetime('now'))
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bertopic_topics (
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
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bertopic_hierarchy (
        run_id INTEGER NOT NULL,
        parent_id INTEGER,
        parent_name TEXT,
        child_left_id INTEGER,
        child_left_name TEXT,
        child_right_id INTEGER,
        child_right_name TEXT,
        distance REAL,
        FOREIGN KEY (run_id) REFERENCES bertopic_runs(run_id)
      )
    `,

      sql`
      CREATE TABLE IF NOT EXISTS bridge_chunk_topic (
        run_id INTEGER,
        chunk_id INTEGER,
        topic_id INTEGER NOT NULL,
        PRIMARY KEY (run_id, chunk_id),
        FOREIGN KEY (run_id) REFERENCES bertopic_runs(run_id)
      )
    `,

      // Create indexes
      sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_chunks_raw_chunk_id ON comment_chunks_raw(chunk_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_chunk_id ON chunk_embeddings(chunk_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_bridge_chunk_topic_chunk_id ON bridge_chunk_topic(chunk_id)`,

      Effect.log("Comment analysis tables created")
    ])
)
