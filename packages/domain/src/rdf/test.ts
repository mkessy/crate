import * as SchemaTransform from "./SchemaTransform.js"

// Import schema JSON files
import { Array, HashMap, Option } from "effect"
import kexpSchemaJson from "../entity_resolution/KnowledgeBase/kexp_schema.json" with { type: "json" }
import mbSchemaJson from "../entity_resolution/KnowledgeBase/mb_schema.json" with { type: "json" }

// === Schema Parsing Tests ===
console.log("=== Schema Transform Tests ===\n")

// Test MusicBrainz schema parsing
console.log("1. Testing MusicBrainz Schema Parsing...")
try {
  const mbSchema = SchemaTransform.parseSchema(mbSchemaJson as SchemaTransform.SourceSchema)

  console.log(`✓ MusicBrainz Schema parsed successfully`)
  console.log(`  - Entities: ${Object.keys(mbSchema.entities).length}`)
  console.log(`  - Predicates: ${Object.keys(mbSchema.predicates).length}`)
  console.log(`  - Attributes: ${Object.keys(mbSchema.attributes).length}`)
  console.log(`  - Version: ${mbSchema.metadata.version}`)

  // Show some entities
  console.log(`  - Entity types: ${mbSchema.entities.pipe(HashMap.keys, Array.fromIterable).slice(0, 5).join(", ")}...`)

  // Show some predicates
  const predicateKeys = mbSchema.predicates.pipe(HashMap.keys, Array.fromIterable).slice(0, 3)
  console.log(`  - Sample predicates:`)
  predicateKeys.forEach((key) => {
    const predicate = mbSchema.predicates.pipe(HashMap.get(key), Option.map((predicate) => predicate.forwardPhrase))
    console.log(`    ${key}: "${predicate}"`)
  })
} catch (error) {
  console.error("✗ MusicBrainz Schema parsing failed:", error)
}

console.log()

// Test KEXP schema parsing
console.log("2. Testing KEXP Schema Parsing...")
try {
  const kexpSchema = SchemaTransform.parseSchema(kexpSchemaJson as unknown as SchemaTransform.SourceSchema)

  console.log(`✓ KEXP Schema parsed successfully`)
  console.log(`  - Entities: ${kexpSchema.entities.pipe(HashMap.size)}`)
  console.log(`  - Predicates: ${kexpSchema.predicates.pipe(HashMap.size)}`)
  console.log(`  - Attributes: ${kexpSchema.attributes.pipe(HashMap.size)}`)
  console.log(`  - Version: ${kexpSchema.metadata.version}`)

  // Show entities
  console.log(`  - Entity types: ${kexpSchema.entities.pipe(HashMap.keys, Array.fromIterable).join(", ")}`)

  // Show predicates
  console.log(`  - Predicates:`)
  kexpSchema.predicates
    .pipe(
      HashMap.entries,
      Array.fromIterable,
      Array.map(([key, predicate]) => {
        console.log(`    ${key}: "${predicate.forwardPhrase}"`)
      })
    )
} catch (error) {
  console.error("✗ KEXP Schema parsing failed:", error)
}

console.log()

// Test multiple schema parsing
console.log("3. Testing Multiple Schema Parsing...")
try {
  const combinedSchema = SchemaTransform.parseMultipleSchemas([
    mbSchemaJson as unknown as SchemaTransform.SourceSchema,
    kexpSchemaJson as unknown as SchemaTransform.SourceSchema
  ])

  console.log(`✓ Combined schemas parsed successfully`)
  console.log(`  - Total entities: ${combinedSchema.entities.pipe(HashMap.size)}`)
  console.log(`  - Total predicates: ${combinedSchema.predicates.pipe(HashMap.size)}`)
  console.log(`  - Total attributes: ${combinedSchema.attributes.pipe(HashMap.size)}`)

  // Test query utilities
  console.log("\n  Query utilities tests:")

  // Find predicates for play entity
  const playPredicates = SchemaTransform.SchemaQueries.getPredicatesForSourceEntity(
    combinedSchema,
    "play"
  )
  console.log(`  - Play entity predicates: ${playPredicates.length}`)
  playPredicates.forEach((predicate) => {
    console.log(`    "${predicate.forwardPhrase}"`)
  })

  // Find relationships between play and artist
  const playArtistPredicates = SchemaTransform.SchemaQueries.getPredicatesForEntityPair(
    combinedSchema,
    "play",
    "artist"
  )
  console.log(`  - Play → Artist relationships: ${playArtistPredicates.length}`)
  playArtistPredicates.forEach((predicate) => {
    console.log(`    "${predicate.forwardPhrase}"`)
  })

  // Test canonical entities
  const canonicalEntities = SchemaTransform.SchemaQueries.getEntitiesByTypes(
    combinedSchema,
    ["artist", "recording", "release", "release_group", "label"]
  )
  console.log(`  - Canonical MB entities: ${canonicalEntities.length}`)
} catch (error) {
  console.error("✗ Combined schema parsing failed:", error)
}

console.log()

// Test validation
console.log("4. Testing Schema Validation...")
try {
  const kexpSchema = SchemaTransform.parseSchema(kexpSchemaJson as unknown as SchemaTransform.SourceSchema)
  const validationErrors = SchemaTransform.validateParsedSchema(kexpSchema)

  if (validationErrors.length === 0) {
    console.log("✓ KEXP schema validation passed")
  } else {
    console.log(`✗ KEXP schema validation found ${validationErrors.length} errors:`)
    validationErrors.forEach((error) => console.log(`  - ${error}`))
  }
} catch (error) {
  console.error("✗ Schema validation failed:", error)
}

console.log()

// Test bidirectional transformation
console.log("5. Testing Bidirectional Transform...")
try {
  const originalSchema = kexpSchemaJson as unknown as SchemaTransform.SourceSchema
  const parsedSchema = SchemaTransform.parseSchema(originalSchema)
  const encodedSchema = SchemaTransform.encodeSchema(parsedSchema)

  console.log("✓ Bidirectional transform completed")
  console.log(`  - Original entity types: ${originalSchema.entity_types.length}`)
  console.log(`  - Encoded entity types: ${encodedSchema.entity_types.length}`)
  console.log(`  - Schema versions match: ${originalSchema.schema_version === encodedSchema.schema_version}`)
} catch (error) {
  console.error("✗ Bidirectional transform failed:", error)
}

console.log("\n=== Schema Transform Tests Complete ===")
