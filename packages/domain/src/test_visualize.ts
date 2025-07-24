#!/usr/bin/env bun

import { Effect } from "effect"
import mbSchemaJson from "./entity_resolution/KnowledgeBase/schema_json/mb_schema.json" with { type: "json" }
import { Make, Ontology } from "./rdf/Ontology.js"
import type { SourceSchema } from "./rdf/SchemaTransform.js"

// Create ontology from MB schema
const mbSchema = mbSchemaJson as unknown as SourceSchema
const ontologyLayer = Make([mbSchema])

// Test the visualization methods
const testVisualization = Effect.gen(function*() {
  const ontology = yield* Ontology

  console.log("=".repeat(80))
  console.log("ONTOLOGY VISUALIZATION TEST - MB Schema")
  console.log("=".repeat(80))

  console.log("\n1. Basic toString() visualization:")
  console.log("-".repeat(40))
  console.log(ontology.toString(ontology))

  console.log("\n2. Formal mathematical structure:")
  console.log("-".repeat(40))
  console.log(ontology.toFormalString(ontology))

  console.log("\n3. Pretty print - compact style:")
  console.log("-".repeat(40))
  console.log(ontology.toPrettyString(ontology, { style: "compact" }))

  console.log("\n4. Pretty print - formal style:")
  console.log("-".repeat(40))
  console.log(ontology.toPrettyString(ontology, { style: "formal" }))

  console.log("\n5. Pretty print - summary style:")
  console.log("-".repeat(40))
  console.log(ontology.toPrettyString(ontology, { style: "summary" }))

  console.log("\n6. Ontology statistics:")
  console.log("-".repeat(40))
  const entityTypes = ontology.getEntityTypes()
  const predicateTypes = ontology.getPredicateTypes()
  const attributes = ontology.getAttributes()
  const signatures = ontology.getPredicateSignatures()

  console.log(`Entity Types: ${entityTypes.length}`)
  console.log(`Predicates: ${predicateTypes.length}`)
  console.log(`Attributes: ${attributes.length}`)
  console.log(`Predicate Signatures: ${signatures.length}`)

  console.log("\nFirst few entity types:")
  entityTypes.slice(0, 5).forEach((type) => console.log(`  - ${type}`))

  console.log("\nFirst few predicates:")
  predicateTypes.slice(0, 5).forEach((pred) => console.log(`  - ${pred}`))

  return "Visualization test completed successfully!"
})

// Run the test
Effect.runSync(testVisualization.pipe(Effect.provide(ontologyLayer)))
