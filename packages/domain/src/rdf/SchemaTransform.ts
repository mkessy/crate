import { HashMap, Option, Schema } from "effect"
import { ManyToMany } from "./Cardinality.js"
import type { Cardinality } from "./Cardinality.js"
import { Attribute, AttributeId, AttributeType, Entity, EntityUri } from "./Entity.js"
import { Predicate, PredicateUri } from "./Predicate.js"

// ============================================================================
// Source Schema JSON Structure (Input)
// ============================================================================

/**
 * Source relationship definition from JSON schema
 * @since 1.0.0
 */
export const SourceRelationship = Schema.Struct({
  type: Schema.String,
  uuid: Schema.Union(Schema.String, Schema.Null),
  forward_phrase: Schema.String,
  reverse_phrase: Schema.String,
  long_link_phrase: Schema.String,
  description: Schema.String,
  deprecated: Schema.Boolean,
  attributes: Schema.Array(Schema.String),
  parent_type: Schema.Union(Schema.String, Schema.Null)
})

/**
 * Source attribute definition from JSON schema
 * @since 1.0.0
 */
export const SourceAttribute = Schema.Struct({
  name: Schema.String,
  uuid: Schema.Union(Schema.String, Schema.Null),
  type: Schema.String,
  description: Schema.String,
  values: Schema.optional(Schema.Array(Schema.String))
})

/**
 * Source entity definition from JSON schema
 * @since 1.0.0
 */
export const SourceEntityDefinition = Schema.Struct({
  description: Schema.String,
  primary_attributes: Schema.Array(Schema.String),
  required_relationships: Schema.Array(Schema.String)
})

export const SourceRelationshipObject = Schema.Struct({
  type: Schema.String,
  relations: Schema.Array(SourceRelationship)
})

export const SourceRelationshipSubject = Schema.Struct({
  subject: Schema.String,
  objects: Schema.Array(SourceRelationshipObject)
})

/**
 * Complete source schema structure
 * @since 1.0.0
 */
export const SourceSchema = Schema.Struct({
  schema_version: Schema.String,
  generated_at: Schema.String,
  description: Schema.String,
  entity_types: Schema.Array(Schema.String),
  attribute_definitions: Schema.Array(SourceAttribute),
  relationships: Schema.Array(SourceRelationshipSubject),
  entity_definitions: Schema.optional(Schema.Record({ key: Schema.String, value: SourceEntityDefinition }))
})

export type SourceSchema = Schema.Schema.Type<typeof SourceSchema>
export type SourceRelationship = Schema.Schema.Type<typeof SourceRelationship>
export type SourceAttribute = Schema.Schema.Type<typeof SourceAttribute>
export type SourceEntityDefinition = Schema.Schema.Type<typeof SourceEntityDefinition>
export type SourceRelationshipObject = Schema.Schema.Type<typeof SourceRelationshipObject>
export type SourceRelationshipSubject = Schema.Schema.Type<typeof SourceRelationshipSubject>

// ============================================================================
// Parsed Schema Structure (Output)
// ============================================================================

/**
 * Schema metadata
 * @since 1.0.0
 */
export const SchemaMetadata = Schema.Struct({
  version: Schema.String,
  description: Schema.String,
  generatedAt: Schema.String
})

export type SchemaMetadata = Schema.Schema.Type<typeof SchemaMetadata>

/**
 * Parsed schema result
 * @since 1.0.0
 */
export const ParsedSchema = Schema.Struct({
  attributes: Schema.HashMap({ key: Schema.String, value: Schema.asSchema(Attribute) }),
  predicates: Schema.HashMap({ key: Schema.String, value: Schema.asSchema(Predicate) }),
  entities: Schema.HashMap({ key: Schema.String, value: Schema.asSchema(Entity) }),
  metadata: SchemaMetadata
})

export type ParsedSchema = Schema.Schema.Type<typeof ParsedSchema>

// ============================================================================
// Cardinality Utilities (Simplified)
// ============================================================================

/**
 * Default cardinality inference - returns many-to-many for flexibility
 * @since 1.0.0
 */
const inferCardinality = (_relType: string, _direction: "forward" | "reverse"): Cardinality => {
  return ManyToMany.make()
}

// ============================================================================
// Schema Transformation using Schema.transform
// ============================================================================

/**
 * Transform source schema to parsed schema using Schema.transform
 * @since 1.0.0
 */
export const SchemaTransform = Schema.transform(
  SourceSchema,
  ParsedSchema,
  {
    strict: true,
    decode: (source, _context) => {
      // Transform attributes - return as array of tuples (encoded form of HashMap)
      const attributeEntries = source.attribute_definitions.map((sourceAttr) =>
        [
          sourceAttr.name,
          Attribute.make({
            id: AttributeId.make(sourceAttr.uuid || `attr-${sourceAttr.name}`),
            name: sourceAttr.name,
            type: AttributeType.make(sourceAttr.type),
            description: sourceAttr.description,
            allowedValues: sourceAttr.values ? new Set(sourceAttr.values) : new Set<string>()
          })
        ] as const
      )

      // Transform entities - return as array of tuples (encoded form of HashMap)
      const entityEntries = source.entity_types.map((entityType) =>
        [
          entityType,
          Entity.make({
            id: EntityUri.make(`entity-${entityType}`),
            type: entityType
          })
        ] as const
      )

      // Transform relationships to predicates - return as array of tuples (encoded form of HashMap)
      const predicateEntries = source.relationships.flatMap((subjectRel) =>
        subjectRel.objects.flatMap((objectRel) =>
          objectRel.relations.map((sourceRel) => {
            const key = `${subjectRel.subject}-${objectRel.type}-${sourceRel.type}`
            const predicate = Predicate.make({
              id: PredicateUri.make(sourceRel.uuid || `${sourceRel.type}-${subjectRel.subject}-${objectRel.type}`),
              forwardPhrase: sourceRel.forward_phrase,
              reversePhrase: sourceRel.reverse_phrase,
              longForm: sourceRel.long_link_phrase,
              description: sourceRel.description,
              parent: sourceRel.parent_type ? Option.some(PredicateUri.make(sourceRel.parent_type)) : Option.none(),
              attributes: new Set(sourceRel.attributes.map((attr) => AttributeId.make(attr))),
              cardinality0: inferCardinality(sourceRel.type, "forward"),
              cardinality1: inferCardinality(sourceRel.type, "reverse")
            })
            return [key, predicate] as const
          })
        )
      )

      // Return the encoded form - arrays of tuples, not HashMaps
      return Schema.encodeSync(ParsedSchema)({
        attributes: HashMap.fromIterable(attributeEntries),
        predicates: HashMap.fromIterable(predicateEntries),
        entities: HashMap.fromIterable(entityEntries),
        metadata: {
          version: source.schema_version,
          description: source.description,
          generatedAt: source.generated_at
        }
      })
    },
    encode: (parsed, _context) => {
      // Extract values from HashMaps using HashMap operations
      const attribute_definitions = parsed.attributes.map(([_, attr]) => ({
        name: attr.name,
        uuid: attr.id === `attr-${attr.name}` ? null : attr.id,
        type: attr.type,
        description: attr.description,
        values: attr.allowedValues.length > 0 ? attr.allowedValues : undefined
      }))

      // Extract entity types from HashMap
      const entity_types = parsed.entities.map(([_, entity]) => entity.type)

      // Group relationships by subject and object type
      const relationshipMap = new Map<string, Map<string, Array<SourceRelationship>>>()

      // Iterate through predicates HashMap
      for (const [_i, [key, predicate]] of parsed.predicates.entries()) {
        const [sourceType, targetType, relType] = key.split("-")
        if (sourceType && targetType && relType) {
          if (!relationshipMap.has(sourceType)) {
            relationshipMap.set(sourceType, new Map())
          }
          const subjectMap = relationshipMap.get(sourceType)!
          if (!subjectMap.has(targetType)) {
            subjectMap.set(targetType, [])
          }
          subjectMap.get(targetType)!.push({
            type: relType,
            uuid: predicate.id.startsWith(`${relType}-`) ? null : predicate.id,
            forward_phrase: predicate.forwardPhrase,
            reverse_phrase: predicate.reversePhrase,
            long_link_phrase: predicate.longForm,
            description: predicate.description,
            deprecated: false,
            attributes: predicate.attributes.map((attrId) => attrId),
            parent_type: predicate.parent._tag === "Some" ? predicate.parent.value : null
          })
        }
      }

      // Convert to required structure
      const relationships: Array<SourceRelationshipSubject> = []
      for (const [subject, objectMap] of relationshipMap) {
        const objects: Array<SourceRelationshipObject> = []
        for (const [objectType, relations] of objectMap) {
          objects.push({ type: objectType, relations })
        }
        relationships.push({ subject, objects })
      }

      return {
        schema_version: parsed.metadata.version,
        generated_at: parsed.metadata.generatedAt,
        description: parsed.metadata.description,
        entity_types,
        attribute_definitions,
        relationships,
        entity_definitions: undefined
      }
    }
  }
)

// ============================================================================
// High-level Parsing Functions
// ============================================================================

/**
 * Parse source schema JSON to domain types
 * @since 1.0.0
 */
export const parseSchema = (sourceSchema: SourceSchema): ParsedSchema => {
  return Schema.decodeUnknownSync(SchemaTransform)(sourceSchema)
}

/**
 * Encode domain types back to source schema JSON
 * @since 1.0.0
 */
export const encodeSchema = (parsedSchema: ParsedSchema): SourceSchema => {
  return Schema.encodeSync(SchemaTransform)(parsedSchema)
}

/**
 * Parse and merge multiple schemas
 * @since 1.0.0
 */
export const parseMultipleSchemas = (schemas: ReadonlyArray<SourceSchema>): ParsedSchema => {
  const parsed = schemas.map(parseSchema)

  if (parsed.length === 0) {
    return {
      attributes: HashMap.empty<string, Attribute>(),
      predicates: HashMap.empty<string, Predicate>(),
      entities: HashMap.empty<string, Entity>(),
      metadata: {
        version: "empty",
        description: "Empty schema",
        generatedAt: new Date().toISOString()
      }
    }
  }

  // Merge schemas by reducing and combining HashMaps
  return parsed.reduce((merged, current) => {
    // Merge attributes - later values override earlier ones
    let mergedAttributes = merged.attributes
    for (const [key, value] of HashMap.entries(current.attributes)) {
      mergedAttributes = HashMap.set(mergedAttributes, key, value)
    }

    // Merge predicates - later values override earlier ones
    let mergedPredicates = merged.predicates
    for (const [key, value] of HashMap.entries(current.predicates)) {
      mergedPredicates = HashMap.set(mergedPredicates, key, value)
    }

    // Merge entities - later values override earlier ones
    let mergedEntities = merged.entities
    for (const [key, value] of HashMap.entries(current.entities)) {
      mergedEntities = HashMap.set(mergedEntities, key, value)
    }

    return {
      attributes: mergedAttributes,
      predicates: mergedPredicates,
      entities: mergedEntities,
      metadata: {
        version: "merged",
        description: "Merged from multiple schemas",
        generatedAt: new Date().toISOString()
      }
    }
  })
}

// ============================================================================
// Query Utilities
// ============================================================================

/**
 * Query utilities for parsed schemas
 * @since 1.0.0
 */
export const SchemaQueries = {
  /**
   * Get predicates connecting two entity types
   */
  getPredicatesForEntityPair: (
    parsed: ParsedSchema,
    sourceType: string,
    targetType: string
  ): ReadonlyArray<Predicate> => {
    return Array.from(
      HashMap.filter(parsed.predicates, (predicate, key) => key.startsWith(`${sourceType}-${targetType}-`)).pipe(
        HashMap.values
      )
    )
  },

  /**
   * Get all predicates where entity type is the source
   */
  getPredicatesForSourceEntity: (
    parsed: ParsedSchema,
    sourceType: string
  ): ReadonlyArray<Predicate> => {
    return Array.from(
      HashMap.filter(parsed.predicates, (predicate, key) => key.startsWith(`${sourceType}-`)).pipe(HashMap.values)
    )
  },

  /**
   * Get attributes matching a pattern
   */
  getAttributesByPattern: (
    parsed: ParsedSchema,
    pattern: RegExp
  ): ReadonlyArray<Attribute> => {
    return Array.from(
      HashMap.filter(parsed.attributes, (attr, name) => pattern.test(name)).pipe(HashMap.values)
    )
  },

  /**
   * Get entities of specific types
   */
  getEntitiesByTypes: (
    parsed: ParsedSchema,
    entityTypes: ReadonlyArray<string>
  ): ReadonlyArray<Entity> => {
    const typeSet = new Set(entityTypes)
    return Array.from(
      HashMap.filter(parsed.entities, (entity) => typeSet.has(entity.type)).pipe(HashMap.values)
    )
  },

  /**
   * Build relationship graph for traversal
   */
  buildRelationshipGraph: (parsed: ParsedSchema) => {
    const graph: { [key: string]: ReadonlyArray<{ target: string; predicate: Predicate }> } = {}

    for (const [key, predicate] of HashMap.entries(parsed.predicates)) {
      const [source, target] = key.split("-")
      if (source && target) {
        if (!graph[source]) {
          graph[source] = []
        }
        graph[source] = [...(graph[source] || []), { target, predicate }]
      }
    }

    return graph
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate parsed schema for consistency
 * @since 1.0.0
 */
export const validateParsedSchema = (parsed: ParsedSchema): ReadonlyArray<string> => {
  const errors: Array<string> = []
  const entityTypes = new Set(Array.from(HashMap.keys(parsed.entities)))

  // Check that all entity types referenced in predicates exist
  for (const [key] of HashMap.entries(parsed.predicates)) {
    const [sourceType, targetType] = key.split("-")
    if (sourceType && !entityTypes.has(sourceType)) {
      errors.push(`Missing entity type: ${sourceType}`)
    }
    if (targetType && !entityTypes.has(targetType)) {
      errors.push(`Missing entity type: ${targetType}`)
    }
  }

  return errors
}
