import { Effect, Layer } from "effect"
import { RelationshipService } from "../relationships/service.js"

// Example usage of the RelationshipService with type-safe predicates and entity types

const program = Effect.gen(function*() {
  const service = yield* RelationshipService

  // Example 1: Find all recordings performed by an artist
  // The predicate "performer" is now type-checked at compile time
  const performances = yield* service.getSubjectPredicate(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a predicate:performer"
  )
  console.log("Artist performances:", performances.length)

  // Example 2: Find all artists who performed a specific recording (reverse lookup)
  // TypeScript will error if you use an invalid predicate like "invalid-predicate"
  const performers = yield* service.getObjectPredicate(
    "object:d27fdd10-e1df-4208-8e2e-62187866246f predicate:performer"
  )
  console.log("Recording performers:", performers)

  // Example 3: Find all recordings (of any predicate) for an artist
  // The entity type "recording" is now type-checked
  const recordings = yield* service.getSubjectType(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a type:recording"
  )
  console.log("Artist recordings (all predicates):", recordings.length)

  // These would cause TypeScript errors:
  // "subject:123 predicate:invalid-predicate" // Error: invalid predicate
  // "subject:123 type:invalid-type" // Error: invalid entity type

  // Example 4: More predicate examples with type safety
  const producers = yield* service.getSubjectPredicate(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a predicate:producer"
  )

  console.log("Producers:", producers)

  const composers = yield* service.getSubjectPredicate(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a predicate:composer"
  )

  console.log("Composers:", composers)

  // Example 5: Entity type filtering examples
  const works = yield* service.getSubjectType(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a type:work"
  )

  console.log("Works:", works)

  const labels = yield* service.getSubjectType(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a type:label"
  )

  console.log("labels:", labels)

  const plays = yield* service.getSubjectType(
    "subject:2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a type:play"
  )
  console.log("plays:", plays)

  // Example 6: Get all relationships for a subject (utility method)
  const allRelationships = yield* service.getSubjectRelationships(
    "2d5fbbfd-27a7-4b74-848a-2b1f24fa1d0a"
  )
  console.log("All relationships:", allRelationships.length)
})

// The service would be provided via the layer system in your application
const runnable = program.pipe(
  Effect.provide(RelationshipService.Default),
  Effect.provide(Layer.scope)
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
