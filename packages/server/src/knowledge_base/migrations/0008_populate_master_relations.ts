import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Deleting all rows from master_relations")

  yield* sql`DELETE FROM master_relations;`

  yield* Effect.log("Creating unique index on master_relations")
  yield* sql`CREATE UNIQUE INDEX idx_master_relations_pk 
ON master_relations(subject_id, predicate, object_id, attribute_type);`

  yield* Effect.log("Inserting data from mb_master_lookup into master_relations")

  yield* sql`INSERT OR IGNORE INTO master_relations (
    subject_id,
    subject_type,
    subject_name,
    predicate,
    object_id,
    object_type,
    object_name,
    attribute_type,
    source
)
SELECT
    artist_mb_id,
    'artist',
    artist_name,
    relation_type,
    entity_mb_id,
    entity_type,
    entity_name,
    attribute_type,
    'musicbrainz'
FROM
    mb_master_lookup
WHERE
    artist_mb_id IS NOT NULL 
    AND entity_mb_id IS NOT NULL
    AND relation_type IS NOT NULL;`

  yield* Effect.log("Done populating master_relations")
})
