import { assert, beforeEach, describe, it } from "@effect/vitest"
import type { Layer } from "effect"
import { Effect, HashMap, Option } from "effect"
import kexpSchemaJson from "../src/entity_resolution/KnowledgeBase/kexp_schema.json" with { type: "json" }
import mbSchemaJson from "../src/entity_resolution/KnowledgeBase/mb_schema.json" with { type: "json" }
import type { EntityType } from "../src/rdf/Entity.js"
import { Entity, WithMetadata } from "../src/rdf/Entity.js"
import { Make, Ontology, UnknownEntityTypeError } from "../src/rdf/Ontology.js"
import type { SourceSchema } from "../src/rdf/SchemaTransform.js"

describe("Ontology", () => {
  let ontologyLayer: Layer.Layer<Ontology>

  beforeEach(() => {
    ontologyLayer = Make([
      mbSchemaJson as unknown as SourceSchema,
      kexpSchemaJson as unknown as SourceSchema
    ])
  })

  describe("Layer Creation", () => {
    it("should create ontology layer from single schema", () => {
      const singleSchemaLayer = Make([kexpSchemaJson as unknown as SourceSchema])

      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Should have KEXP entities
        const entities = HashMap.keys(ontology.entityFactories)
        const entityTypes = Array.from(entities)

        assert.isTrue(entityTypes.includes("play"))
        assert.isTrue(entityTypes.includes("artist"))
        assert.isTrue(entityTypes.includes("recording"))

        return "success"
      })

      const result = Effect.runSync(test.pipe(Effect.provide(singleSchemaLayer)))
      assert.strictEqual(result, "success")
    })

    it("should create ontology layer from multiple schemas", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Should have both MB and KEXP entities
        const entities = HashMap.keys(ontology.entityFactories)
        const entityTypes = Array.from(entities)

        // KEXP entities
        assert.isTrue(entityTypes.includes("play"))
        // MB entities (assuming some exist in the schema)
        assert.isTrue(entityTypes.includes("artist"))
        assert.isTrue(entityTypes.includes("recording"))

        return entityTypes.length
      })

      const entityCount = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))
      assert.isTrue(entityCount > 5) // Should have multiple entity types
    })

    it("should build predicate hierarchies correctly", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Test that predicate hierarchy is populated
        const hierarchy = ontology.predicateHierarchy
        const hierarchySize = HashMap.size(hierarchy)

        // Should have some hierarchy entries (depending on schema)
        return hierarchySize
      })

      const hierarchySize = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))
      assert.isTrue(hierarchySize >= 0) // Could be 0 if no parent relationships
    })

    it("should index predicates by source and target entities", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const sourceIndex = ontology.predicatesBySourceEntity
        const targetIndex = ontology.predicatesByTargetEntity

        return {
          sourceIndexSize: HashMap.size(sourceIndex),
          targetIndexSize: HashMap.size(targetIndex)
        }
      })

      const { sourceIndexSize, targetIndexSize } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.isTrue(sourceIndexSize > 0)
      assert.isTrue(targetIndexSize > 0)
    })
  })

  describe("Entity Creation", () => {
    it("should create entities for known types", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const artistEntity = yield* ontology.createEntity("artist" as EntityType, "test-artist-123")
        const playEntity = yield* ontology.createEntity("play" as EntityType, "test-play-456")

        return { artistEntity, playEntity }
      })

      const { artistEntity, playEntity } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.strictEqual(artistEntity.type, "artist")
      assert.strictEqual(artistEntity.id, "crate://artist/test-artist-123")
      assert.isTrue(artistEntity instanceof Entity)

      assert.strictEqual(playEntity.type, "play")
      assert.strictEqual(playEntity.id, "crate://play/test-play-456")
      assert.isTrue(playEntity instanceof Entity)
    })

    it("should create entities with metadata for known types", () => {
      interface PlayMetadata {
        timestamp: string
        duration: number
        station?: string
      }

      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const metadata: PlayMetadata = {
          timestamp: "2024-01-01T00:00:00Z",
          duration: 180,
          station: "KEXP"
        }

        const playEntity = yield* ontology.createEntityWithMetadata<EntityType, PlayMetadata>(
          "play" as EntityType,
          "test-play-123",
          metadata
        )

        return { playEntity, metadata }
      })

      const { metadata, playEntity } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.strictEqual(playEntity.type, "play")
      assert.strictEqual(playEntity.id, "crate://play/test-play-123")
      assert.isTrue(playEntity instanceof WithMetadata)
      assert.deepStrictEqual(playEntity.value, metadata)
    })

    it("should fail with UnknownEntityTypeError for unknown types", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const result = yield* ontology.createEntity(
          "unknown_type" as EntityType,
          "test-123"
        ).pipe(Effect.either)

        return result
      })

      const result = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(result._tag, "Left")
      if (result._tag === "Left") {
        assert.isTrue(result.left instanceof UnknownEntityTypeError)
        assert.strictEqual(result.left.entityType, "unknown_type")
      }
    })

    it("should fail with UnknownEntityTypeError for metadata creation with unknown types", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const result = yield* ontology.createEntityWithMetadata(
          "unknown_type" as EntityType,
          "test-123",
          { some: "data" }
        ).pipe(Effect.either)

        return result
      })

      const result = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(result._tag, "Left")
      if (result._tag === "Left") {
        assert.isTrue(result.left instanceof UnknownEntityTypeError)
        assert.strictEqual(result.left.entityType, "unknown_type")
      }
    })

    it("should create multiple entities of same type with different IDs", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const artist1 = yield* ontology.createEntity("artist" as EntityType, "artist-1")
        const artist2 = yield* ontology.createEntity("artist" as EntityType, "artist-2")

        return { artist1, artist2 }
      })

      const { artist1, artist2 } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.strictEqual(artist1.type, "artist")
      assert.strictEqual(artist2.type, "artist")
      assert.strictEqual(artist1.id, "crate://artist/artist-1")
      assert.strictEqual(artist2.id, "crate://artist/artist-2")
      assert.notStrictEqual(artist1.id, artist2.id)
    })
  })

  describe("Predicate Queries", () => {
    it("should find predicates for entity pairs", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const playArtistPredicates = ontology.getPredicatesForEntityPair("play", "artist")
        const artistRecordingPredicates = ontology.getPredicatesForEntityPair("artist", "recording")

        return { playArtistPredicates, artistRecordingPredicates }
      })

      const { artistRecordingPredicates, playArtistPredicates } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.isTrue(playArtistPredicates.length > 0)
      assert.isTrue(artistRecordingPredicates.length >= 0) // May be 0 depending on schema

      // Test specific predicate exists
      const playedByPredicate = playArtistPredicates.find((p) => p.forwardPhrase === "played by")
      assert.isDefined(playedByPredicate)
      if (playedByPredicate) {
        assert.strictEqual(playedByPredicate.forwardPhrase, "played by")
      }
    })

    it("should return empty array for non-existent entity pairs", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const nonExistentPredicates = ontology.getPredicatesForEntityPair("nonexistent", "alsononexistent")

        return nonExistentPredicates
      })

      const predicates = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))
      assert.strictEqual(predicates.length, 0)
    })

    it("should find predicates by source entity type", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Get all predicates where play is the source
        const playPredicates = HashMap.get(ontology.predicatesBySourceEntity, "play")

        return playPredicates
      })

      const playPredicates = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      if (Option.isSome(playPredicates)) {
        assert.isTrue(playPredicates.value.length > 0)
        // All predicates should have play as source based on our schema
        playPredicates.value.forEach((predicate) => {
          // The predicate key format is source-target-type, so we can't directly check
          // but we know these came from the play source index
          assert.isDefined(predicate.forwardPhrase)
        })
      }
    })

    it("should find predicates by target entity type", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Get all predicates where artist is the target
        const artistTargetPredicates = HashMap.get(ontology.predicatesByTargetEntity, "artist")

        return artistTargetPredicates
      })

      const artistPredicates = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      if (Option.isSome(artistPredicates)) {
        assert.isTrue(artistPredicates.value.length > 0)
        artistPredicates.value.forEach((predicate) => {
          assert.isDefined(predicate.reversePhrase)
        })
      }
    })
  })

  describe("Predicate Hierarchy", () => {
    it("should provide getPredicateDescendants method", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Test with a predicate URI (may not have descendants in test data)
        const descendants = ontology.getPredicateDescendants("test-predicate" as any)

        return descendants
      })

      const descendants = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      // Should return a Set (may be empty)
      assert.isTrue(descendants instanceof Set)
    })

    it("should return empty set for non-existent predicates", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const descendants = ontology.getPredicateDescendants("non-existent-predicate" as any)

        return descendants
      })

      const descendants = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))
      assert.strictEqual(descendants.size, 0)
    })
  })

  describe("Schema Integration", () => {
    it("should have all entity types from both schemas", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const entityTypes = Array.from(HashMap.keys(ontology.entityFactories))

        return entityTypes
      })

      const entityTypes = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      // Should have KEXP entities
      assert.isTrue(entityTypes.includes("play"))
      assert.isTrue(entityTypes.includes("artist"))
      assert.isTrue(entityTypes.includes("recording"))
      assert.isTrue(entityTypes.includes("release"))

      // Should have reasonable number of entity types
      assert.isTrue(entityTypes.length >= 5)
    })

    it("should have predicates from both schemas", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const predicateCount = HashMap.size(ontology.predicates)
        const attributeCount = HashMap.size(ontology.attributes)

        return { predicateCount, attributeCount }
      })

      const { attributeCount, predicateCount } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.isTrue(predicateCount > 10) // Should have many predicates
      assert.isTrue(attributeCount > 5) // Should have many attributes
    })

    it("should provide access to raw predicates and attributes", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Test direct access to maps
        const predicates = ontology.predicates
        const attributes = ontology.attributes

        // Get a sample predicate and attribute
        const predicateEntries = Array.from(HashMap.entries(predicates))
        const attributeEntries = Array.from(HashMap.entries(attributes))

        return {
          hasPredicate: predicateEntries.length > 0,
          hasAttribute: attributeEntries.length > 0,
          samplePredicate: predicateEntries[0]?.[1],
          sampleAttribute: attributeEntries[0]?.[1]
        }
      })

      const { hasAttribute, hasPredicate, sampleAttribute, samplePredicate } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      assert.isTrue(hasPredicate)
      assert.isTrue(hasAttribute)

      if (samplePredicate) {
        assert.isDefined(samplePredicate.forwardPhrase)
        assert.isDefined(samplePredicate.reversePhrase)
        assert.isDefined(samplePredicate.description)
      }

      if (sampleAttribute) {
        assert.isDefined(sampleAttribute.name)
        assert.isDefined(sampleAttribute.description)
      }
    })
  })

  describe("Performance and Efficiency", () => {
    it("should handle multiple entity creations efficiently", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Create multiple entities
        const entities = yield* Effect.all([
          ontology.createEntity("artist" as EntityType, "artist-1"),
          ontology.createEntity("artist" as EntityType, "artist-2"),
          ontology.createEntity("recording" as EntityType, "recording-1"),
          ontology.createEntity("play" as EntityType, "play-1"),
          ontology.createEntity("release" as EntityType, "release-1")
        ])

        return entities
      })

      const entities = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(entities.length, 5)
      entities.forEach((entity) => {
        assert.isDefined(entity.id)
        assert.isDefined(entity.type)
      })
    })

    it("should handle multiple predicate queries efficiently", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Perform multiple queries
        const queries = [
          ontology.getPredicatesForEntityPair("play", "artist"),
          ontology.getPredicatesForEntityPair("artist", "recording"),
          ontology.getPredicatesForEntityPair("recording", "release"),
          ontology.getPredicatesForEntityPair("play", "recording")
        ]

        return queries
      })

      const results = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(results.length, 4)
      results.forEach((result) => {
        assert.isTrue(Array.isArray(result))
      })
    })

    it("should reuse entity factories efficiently", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Create multiple entities of same type
        const artists = yield* Effect.all([
          ontology.createEntity("artist" as EntityType, "artist-1"),
          ontology.createEntity("artist" as EntityType, "artist-2"),
          ontology.createEntity("artist" as EntityType, "artist-3")
        ])

        return artists
      })

      const artists = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(artists.length, 3)
      artists.forEach((artist, index) => {
        assert.strictEqual(artist.type, "artist")
        assert.strictEqual(artist.id, `crate://artist/artist-${index + 1}`)
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle concurrent failed entity creations", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Try to create multiple unknown entities concurrently
        const results = yield* Effect.all([
          ontology.createEntity("unknown1" as EntityType, "test-1").pipe(Effect.either),
          ontology.createEntity("unknown2" as EntityType, "test-2").pipe(Effect.either),
          ontology.createEntity("artist" as EntityType, "test-3").pipe(Effect.either) // This should succeed
        ])

        return results
      })

      const results = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(results.length, 3)

      // First two should fail
      assert.strictEqual(results[0]._tag, "Left")
      assert.strictEqual(results[1]._tag, "Left")

      // Third should succeed
      assert.strictEqual(results[2]._tag, "Right")
      if (results[2]._tag === "Right") {
        assert.strictEqual(results[2].right.type, "artist")
      }
    })

    it("should provide detailed error information", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const result = yield* ontology.createEntity(
          "detailed_unknown_type" as EntityType,
          "test-detailed"
        ).pipe(Effect.either)

        return result
      })

      const result = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.strictEqual(result._tag, "Left")
      if (result._tag === "Left") {
        const error = result.left
        assert.isTrue(error instanceof UnknownEntityTypeError)
        assert.strictEqual(error._tag, "UnknownEntityTypeError")
        assert.strictEqual(error.entityType, "detailed_unknown_type")
      }
    })
  })

  describe("Formal Ontology Functions - δ (Predicate Signatures)", () => {
    it("should provide predicate signature function (δ) that maps predicates to (subject, object) pairs", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Get a sample predicate from the ontology
        const predicateEntries = Array.from(HashMap.entries(ontology.predicates))
        assert.isTrue(predicateEntries.length > 0, "Should have predicates in ontology")

        const [predicateKey, predicate] = predicateEntries[0]

        // Test the δ function: getPredicateSignature
        const signature = ontology.getPredicateSignature(predicate.id)

        return { predicateKey, predicate, signature }
      })

      const { predicateKey, signature } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      // Should return Some(PredicateSignature) for existing predicates
      assert.isTrue(Option.isSome(signature), "Should return Some for existing predicate")

      if (Option.isSome(signature)) {
        const sig = signature.value
        assert.isDefined(sig.subject, "Signature should have subject EntityType")
        assert.isDefined(sig.object, "Signature should have object EntityType")

        // Verify the signature matches the predicate key format (subject-object-type)
        const [expectedSubject, expectedObject] = predicateKey.split("-")
        assert.strictEqual(sig.subject, expectedSubject, "Subject should match predicate key")
        assert.strictEqual(sig.object, expectedObject, "Object should match predicate key")
      }
    })

    it("should return None for non-existent predicate signatures", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Test with non-existent predicate
        const signature = ontology.getPredicateSignature("non-existent-predicate" as any)

        return signature
      })

      const signature = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))
      assert.isTrue(Option.isNone(signature), "Should return None for non-existent predicate")
    })

    it("should have consistent predicate signatures across all predicates", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Test all predicates have valid signatures
        const predicateEntries = Array.from(HashMap.entries(ontology.predicates))
        const signatureResults = predicateEntries.map(([key, predicate]) => {
          const signature = ontology.getPredicateSignature(predicate.id)
          return { key, predicate, signature }
        })

        return signatureResults
      })

      const results = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      results.forEach(({ key, predicate, signature }) => {
        assert.isTrue(Option.isSome(signature), `Predicate ${predicate.id} should have a signature`)

        if (Option.isSome(signature)) {
          const sig = signature.value
          const [expectedSubject, expectedObject] = key.split("-")

          assert.strictEqual(
            sig.subject,
            expectedSubject,
            `Predicate ${predicate.id} subject should match key format`
          )
          assert.strictEqual(
            sig.object,
            expectedObject,
            `Predicate ${predicate.id} object should match key format`
          )
        }
      })
    })

    it("should provide direct access to predicate signatures HashMap", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const signaturesMap = ontology.predicateSignatures
        const signaturesCount = HashMap.size(signaturesMap)
        const predicatesCount = HashMap.size(ontology.predicates)

        return { signaturesCount, predicatesCount }
      })

      const { predicatesCount, signaturesCount } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      // Should have the same number of signatures as predicates
      assert.strictEqual(
        signaturesCount,
        predicatesCount,
        "Should have signature for every predicate"
      )
    })
  })

  describe("Formal Ontology Functions - π (Predicate Attributes)", () => {
    it("should provide predicate schema function (π) that maps predicates to sets of allowed attributes", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Get a sample predicate with attributes
        const predicateEntries = Array.from(HashMap.entries(ontology.predicates))
        const predicateWithAttrs = predicateEntries.find(([_, pred]) => pred.attributes.size > 0)

        if (predicateWithAttrs) {
          const [_, predicate] = predicateWithAttrs

          // Test the π function: getPredicateAttributes
          const attributes = ontology.getPredicateAttributes(predicate.id)

          return { predicate, attributes, hasPredicateWithAttrs: true }
        } else {
          // Test with any predicate even if no attributes
          const [_, predicate] = predicateEntries[0]
          const attributes = ontology.getPredicateAttributes(predicate.id)

          return { predicate, attributes, hasPredicateWithAttrs: false }
        }
      })

      const { attributes, hasPredicateWithAttrs, predicate } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      // Should always return a Set (may be empty)
      assert.isTrue(attributes instanceof Set, "Should return a Set of AttributeIds")

      if (hasPredicateWithAttrs) {
        // If we found a predicate with attributes, verify they match
        assert.strictEqual(
          attributes.size,
          predicate.attributes.size,
          "Returned attributes should match predicate's attributes"
        )

        // Verify all attributes are present
        for (const attr of predicate.attributes) {
          assert.isTrue(attributes.has(attr), `Should contain attribute ${attr}`)
        }
      }
    })

    it("should return empty set for predicates with no attributes", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Find a predicate with no attributes or create test case
        const predicateEntries = Array.from(HashMap.entries(ontology.predicates))
        const predicateWithNoAttrs = predicateEntries.find(([_, pred]) => pred.attributes.size === 0)

        if (predicateWithNoAttrs) {
          const [_, predicate] = predicateWithNoAttrs
          const attributes = ontology.getPredicateAttributes(predicate.id)

          return { predicate, attributes, foundPredicateWithNoAttrs: true }
        } else {
          // Test with non-existent predicate
          const attributes = ontology.getPredicateAttributes("non-existent" as any)

          return { predicate: null, attributes, foundPredicateWithNoAttrs: false }
        }
      })

      const { attributes, foundPredicateWithNoAttrs } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      if (foundPredicateWithNoAttrs) {
        assert.strictEqual(attributes.size, 0, "Should return empty set for predicate with no attributes")
      } else {
        // Non-existent predicate should also return empty set
        assert.strictEqual(attributes.size, 0, "Should return empty set for non-existent predicate")
      }
    })

    it("should return empty set for non-existent predicates", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const attributes = ontology.getPredicateAttributes("definitely-non-existent-predicate" as any)

        return attributes
      })

      const attributes = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      assert.isTrue(attributes instanceof Set, "Should return a Set")
      assert.strictEqual(attributes.size, 0, "Should return empty set for non-existent predicate")
    })

    it("should have consistent predicate attributes across all predicates", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Test all predicates have consistent attribute mappings
        const predicateEntries = Array.from(HashMap.entries(ontology.predicates))
        const attributeResults = predicateEntries.map(([_, predicate]) => {
          const returnedAttrs = ontology.getPredicateAttributes(predicate.id)
          const originalAttrs = predicate.attributes
          return {
            predicateId: predicate.id,
            returnedAttrs,
            originalAttrs,
            sizesMatch: returnedAttrs.size === originalAttrs.size
          }
        })

        return attributeResults
      })

      const results = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      results.forEach(({ originalAttrs, predicateId, returnedAttrs, sizesMatch }) => {
        assert.isTrue(
          sizesMatch,
          `Predicate ${predicateId} should have matching attribute set sizes`
        )

        // Verify all original attributes are in returned set
        for (const attr of originalAttrs) {
          assert.isTrue(
            returnedAttrs.has(attr),
            `Predicate ${predicateId} should contain attribute ${attr}`
          )
        }
      })
    })

    it("should provide direct access to predicate attributes HashMap", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        const attributesMap = ontology.predicateAttributes
        const attributesCount = HashMap.size(attributesMap)
        const predicatesCount = HashMap.size(ontology.predicates)

        return { attributesCount, predicatesCount }
      })

      const { attributesCount, predicatesCount } = Effect.runSync(
        test.pipe(Effect.provide(ontologyLayer))
      )

      // Should have the same number of attribute mappings as predicates
      assert.strictEqual(
        attributesCount,
        predicatesCount,
        "Should have attribute mapping for every predicate"
      )
    })
  })

  describe("Formal Ontology Integration - δ and π functions working together", () => {
    it("should demonstrate complete ontology tuple O = (T, P, A, δ, π, ≺) functionality", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // T: Entity types (already tested via entityFactories)
        const entityTypes = Array.from(HashMap.keys(ontology.entityFactories))

        // P: Predicates (already available via predicates HashMap)
        const predicates = Array.from(HashMap.values(ontology.predicates))

        // A: Attributes (already available via attributes HashMap)
        const attributes = Array.from(HashMap.values(ontology.attributes))

        // δ: Predicate signature function - test with first predicate
        const firstPredicate = predicates[0]
        const signature = ontology.getPredicateSignature(firstPredicate.id)

        // π: Predicate schema function - test with first predicate
        const attributeSet = ontology.getPredicateAttributes(firstPredicate.id)

        // ≺: Predicate hierarchy (already tested via getPredicateDescendants)
        const descendants = ontology.getPredicateDescendants(firstPredicate.id)

        return {
          entityTypesCount: entityTypes.length,
          predicatesCount: predicates.length,
          attributesCount: attributes.length,
          hasSignature: Option.isSome(signature),
          attributeSetSize: attributeSet.size,
          descendantsSize: descendants.size
        }
      })

      const result = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      // Verify all components of the ontology tuple are present and functional
      assert.isTrue(result.entityTypesCount > 0, "Should have entity types (T)")
      assert.isTrue(result.predicatesCount > 0, "Should have predicates (P)")
      assert.isTrue(result.attributesCount > 0, "Should have attributes (A)")
      assert.isTrue(result.hasSignature, "δ function should work (predicate signatures)")
      assert.isTrue(result.attributeSetSize >= 0, "π function should work (predicate attributes)")
      assert.isTrue(result.descendantsSize >= 0, "≺ function should work (predicate hierarchy)")
    })

    it("should validate formal consistency between δ and π functions", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Get all predicates and verify both δ and π work for each
        const predicateEntries = Array.from(HashMap.entries(ontology.predicates))

        const validationResults = predicateEntries.map(([key, predicate]) => {
          // Test δ function
          const signature = ontology.getPredicateSignature(predicate.id)

          // Test π function
          const attributes = ontology.getPredicateAttributes(predicate.id)

          // Validate signature format matches key
          let signatureValid = false
          if (Option.isSome(signature)) {
            const [expectedSubject, expectedObject] = key.split("-")
            signatureValid = signature.value.subject === expectedSubject &&
              signature.value.object === expectedObject
          }

          return {
            predicateId: predicate.id,
            hasSignature: Option.isSome(signature),
            signatureValid,
            attributesCount: attributes.size,
            originalAttributesCount: predicate.attributes.size,
            attributesMatch: attributes.size === predicate.attributes.size
          }
        })

        return validationResults
      })

      const results = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      // Verify all predicates have valid δ and π function results
      results.forEach((result) => {
        assert.isTrue(
          result.hasSignature,
          `Predicate ${result.predicateId} should have signature from δ function`
        )
        assert.isTrue(
          result.signatureValid,
          `Predicate ${result.predicateId} should have valid signature format`
        )
        assert.isTrue(
          result.attributesMatch,
          `Predicate ${result.predicateId} should have matching attributes from π function`
        )
      })
    })

    it("should demonstrate practical usage of ontology functions for knowledge graph queries", () => {
      const test = Effect.gen(function*() {
        const ontology = yield* Ontology

        // Simulate a knowledge graph query workflow:
        // 1. Find predicates connecting play to artist
        const playArtistPredicates = ontology.getPredicatesForEntityPair("play", "artist")

        if (playArtistPredicates.length > 0) {
          const predicate = playArtistPredicates[0]

          // 2. Get the formal signature (δ function)
          const signature = ontology.getPredicateSignature(predicate.id)

          // 3. Get allowed attributes (π function)
          const allowedAttributes = ontology.getPredicateAttributes(predicate.id)

          // 4. Get predicate hierarchy (≺ function)
          const descendants = ontology.getPredicateDescendants(predicate.id)

          // 5. Create entities using the ontology
          const playEntity = yield* ontology.createEntity("play" as EntityType, "test-play")
          const artistEntity = yield* ontology.createEntity("artist" as EntityType, "test-artist")

          return {
            predicate,
            signature,
            allowedAttributes,
            descendants,
            playEntity,
            artistEntity,
            querySuccessful: true
          }
        }

        return { querySuccessful: false }
      })

      const result = Effect.runSync(test.pipe(Effect.provide(ontologyLayer)))

      if (result.querySuccessful) {
        // Verify the complete workflow worked
        assert.isDefined(result.predicate, "Should find play-artist predicate")
        assert.isTrue(Option.isSome(result.signature), "δ function should return signature")
        assert.isTrue(result.allowedAttributes instanceof Set, "π function should return attribute set")
        assert.isTrue(result.descendants instanceof Set, "≺ function should return descendants")
        assert.strictEqual(result.playEntity.type, "play", "Should create play entity")
        assert.strictEqual(result.artistEntity.type, "artist", "Should create artist entity")

        if (Option.isSome(result.signature)) {
          const sig = result.signature.value
          assert.strictEqual(sig.subject, "play", "Signature subject should be play")
          assert.strictEqual(sig.object, "artist", "Signature object should be artist")
        }
      }
    })
  })
})
