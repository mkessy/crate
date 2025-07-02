import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* Effect.log("Dropping master_relations table")

  yield* sql`DROP TABLE IF EXISTS master_relations;`

  yield* Effect.log("Creating master_relations table")

  yield* sql`CREATE TABLE IF NOT EXISTS master_relations (
      subject_id          TEXT NOT NULL,
      subject_type        TEXT NOT NULL,
      subject_name        TEXT,
      predicate           TEXT NOT NULL,
      object_id           TEXT NOT NULL,
      object_type         TEXT NOT NULL,
      object_name         TEXT,
      attribute_type      TEXT,
      source              TEXT NOT NULL,
      kexp_play_id        INTEGER,
      PRIMARY KEY(subject_id, predicate, object_id, attribute_type)
    ) WITHOUT ROWID;

    subject_id          TEXT NOT NULL,
    subject_type        TEXT NOT NULL,
    subject_name        TEXT,

    predicate           TEXT NOT NULL,

    object_id           TEXT NOT NULL,
    object_type         TEXT NOT NULL,
    object_name         TEXT,

    attribute_type      TEXT,

    source              TEXT NOT NULL,
    kexp_play_id        INTEGER,

    PRIMARY KEY(subject_id, predicate, object_id, attribute_type)
) WITHOUT ROWID;`

  yield* Effect.log("Done creating master_relations table")
})
