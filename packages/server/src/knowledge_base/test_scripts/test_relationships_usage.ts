import { Effect, HashSet, Layer, Schema } from "effect"
import { ArtistEntity } from "../entity_persistence/schemas.js"
import { RelationshipService } from "../relationships/service.js"

// Example usage of the RelationshipService with type-safe predicates and entity types

const program = Effect.gen(function*() {
  const service = yield* RelationshipService

  const artistRecordings = yield* service.getArtistSubjectRelationships(
    "a74b1b7f-71a5-4011-9441-d0b5e4122711"
  )

  const entityHash = Schema.decodeSync(ArtistEntity.pipe(Schema.HashSet))(artistRecordings)
  console.log("Artist recordings:", artistRecordings.length)
  console.log("Entity hash:", HashSet.size(entityHash))

  // check if any of the entity_uri are the same

  const entityUris = HashSet.fromIterable(HashSet.map(entityHash, (entity) => entity.entity_mb_id)).pipe(
    HashSet.toValues
  )
  console.log("Entity uris:", entityUris.length)

  // Example 4: More predicate examples with type safety
})

// The service would be provided via the layer system in your application
const runnable = program.pipe(
  Effect.provide(RelationshipService.Default)
)

runnable.pipe(Effect.runPromise)

// Usage patterns summary:
//
// 1. Forward navigation by predicate:
//    "subject:<id> predicate:<predicate>"
//    Use case: Find all recordings an artist performed
//    Predicates are now type-safe: performer, producer, composer, etc.
//
// 2. Reverse navigation by predicate:
//    "object:<id> predicate:<predicate>"
//    Use case: Find all artists who performed a recording
//
// 3. Filter by entity type:
//    "subject:<id> type:<entity_type>"
//    Use case: Find all relationships to a specific entity type
//    Entity types are now type-safe: artist, recording, work, label, etc.
//
// The DSL is minimal but covers the main access patterns efficiently
// leveraging the database indexes for optimal performance.
