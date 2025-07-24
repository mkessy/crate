import { Option, Schema } from "effect"
import { ManyToMany, ManyToOne, OneToMany } from "../../rdf/Cardinality.js"
import { Attribute, AttributeId, AttributeType, Entity, EntityUri } from "../../rdf/Entity.js"
import { Predicate, PredicateUri } from "../../rdf/Predicate.js"

/**
 * Schema JSON structure for relationships
 * @since 1.0.0
 */
export const SchemaRelationship = Schema.Struct({
  type: Schema.String,
  uuid: Schema.String,
  forward_phrase: Schema.String,
  reverse_phrase: Schema.String,
  long_link_phrase: Schema.String,
  description: Schema.String,
  deprecated: Schema.Boolean,
  attributes: Schema.Array(Schema.String),
  parent_type: Schema.Union(Schema.String, Schema.Null)
})

/**
 * Schema JSON structure for attributes
 * @since 1.0.0
 */
export const SchemaAttribute = Schema.Struct({
  uuid: Schema.Union(Schema.String, Schema.Null),
  type: Schema.String,
  description: Schema.String,
  values: Schema.optional(Schema.Array(Schema.String))
})

/**
 * Schema JSON structure for entity definitions
 * @since 1.0.0
 */
export const SchemaEntityDefinition = Schema.Struct({
  description: Schema.String,
  primary_attributes: Schema.Array(Schema.String),
  required_relationships: Schema.Array(Schema.String)
})

/**
 * Complete schema structure
 * @since 1.0.0
 */
export const SchemaJSON = Schema.Struct({
  schema_version: Schema.String,
  generated_at: Schema.String,
  description: Schema.String,
  entity_types: Schema.Array(Schema.String),
  attribute_definitions: Schema.Record({ key: Schema.String, value: SchemaAttribute }),
  relationships: Schema.Record({
    key: Schema.String,
    value: Schema.Record({ key: Schema.String, value: Schema.Array(SchemaRelationship) })
  }),
  entity_definitions: Schema.optional(Schema.Record({ key: Schema.String, value: SchemaEntityDefinition }))
})

export type SchemaJSON = Schema.Schema.Type<typeof SchemaJSON>
export type SchemaRelationship = Schema.Schema.Type<typeof SchemaRelationship>
export type SchemaAttribute = Schema.Schema.Type<typeof SchemaAttribute>
export type SchemaEntityDefinition = Schema.Schema.Type<typeof SchemaEntityDefinition>

/**
 * Transform schema attribute to domain Attribute
 * @since 1.0.0
 */
export const transformAttribute = (name: string, schemaAttr: SchemaAttribute): Attribute => {
  const attributeURI = AttributeId.make(schemaAttr.uuid || `attr-${name}`)

  return Attribute.make({
    id: attributeURI,
    name,
    description: schemaAttr.description,
    type: AttributeType.make(schemaAttr.type),
    allowedValues: schemaAttr.values ? new Set(schemaAttr.values) : new Set<string>()
  })
}

/**
 * Transform schema relationship to domain Predicate
 * @since 1.0.0
 */
export const transformRelationship = (
  schemaRel: SchemaRelationship,
  sourceEntityType: string,
  targetEntityType: string
): Predicate => {
  const predicateURI = PredicateUri.make(schemaRel.uuid)

  // Determine cardinality based on relationship patterns and entity types
  const cardinality0 = inferCardinality(sourceEntityType, targetEntityType, schemaRel.type, "forward")
  const cardinality1 = inferCardinality(targetEntityType, sourceEntityType, schemaRel.type, "reverse")

  return Predicate.make({
    id: predicateURI,
    forwardPhrase: schemaRel.forward_phrase,
    reversePhrase: schemaRel.reverse_phrase,
    longForm: schemaRel.long_link_phrase,
    description: schemaRel.description,
    parent: schemaRel.parent_type ? Option.some(PredicateUri.make(schemaRel.parent_type)) : Option.none(),
    attributes: new Set(schemaRel.attributes.map((attr) => AttributeId.make(attr))),
    cardinality0,
    cardinality1
  })
}

/**
 * Infer cardinality from relationship patterns
 * @since 1.0.0
 */
const inferCardinality = (
  sourceType: string,
  targetType: string,
  relType: string,
  direction: "forward" | "reverse"
) => {
  // Common patterns for one-to-many relationships
  const oneToManyPatterns = [
    "appears_on",
    "part_of",
    "member_of",
    "released_by",
    "recorded_at",
    "mastered_at",
    "mixed_at",
    "has_recording",
    "has_release",
    "has_release_group"
  ]

  // Common patterns for many-to-many relationships
  const manyToManyPatterns = [
    "performer",
    "instrument",
    "vocals",
    "producer",
    "collaboration",
    "samples",
    "remix_of",
    "cover_of",
    "mentions",
    "played_by"
  ]

  // Default to many-to-many for flexibility
  if (manyToManyPatterns.some((pattern) => relType.includes(pattern))) {
    return ManyToMany.make()
  }

  if (oneToManyPatterns.some((pattern) => relType.includes(pattern))) {
    return direction === "forward" ? ManyToOne.make() : OneToMany.make()
  }

  // Special cases
  if (relType.includes("part_of") && direction === "reverse") {
    return OneToMany.make()
  }

  if (relType.includes("has_") && direction === "forward") {
    return OneToMany.make()
  }

  // Default fallback
  return ManyToMany.make()
}

/**
 * Transform entity type to domain Entity
 * @since 1.0.0
 */
export const transformEntity = (entityType: string): Entity => {
  const entityURI = EntityUri.make(`entity-${entityType}`)

  return Entity.make({
    id: entityURI,
    type: entityType
  })
}

/**
 * Parse complete schema JSON and extract domain types
 * @since 1.0.0
 */
export const parseSchema = (schemaJson: SchemaJSON) => {
  const attributes = new Map<string, Attribute>()
  const predicates = new Map<string, Predicate>()
  const entities = new Map<string, Entity>()

  // Transform attributes
  for (const [name, schemaAttr] of Object.entries(schemaJson.attribute_definitions)) {
    const attribute = transformAttribute(name, schemaAttr)
    attributes.set(name, attribute)
  }

  // Transform entities
  for (const entityType of schemaJson.entity_types) {
    const entity = transformEntity(entityType)
    entities.set(entityType, entity)
  }

  // Transform relationships to predicates
  for (const [sourceEntityType, targetEntities] of Object.entries(schemaJson.relationships)) {
    for (const [targetEntityType, relationships] of Object.entries(targetEntities)) {
      for (const schemaRel of relationships) {
        const predicate = transformRelationship(schemaRel, sourceEntityType, targetEntityType)
        const key = `${sourceEntityType}-${targetEntityType}-${schemaRel.type}`
        predicates.set(key, predicate)
      }
    }
  }

  return {
    attributes,
    predicates,
    entities,
    metadata: {
      version: schemaJson.schema_version,
      description: schemaJson.description,
      generatedAt: schemaJson.generated_at
    }
  }
}

/**
 * Parse multiple schemas and merge results
 * @since 1.0.0
 */
export const parseMultipleSchemas = (...schemas: Array<SchemaJSON>) => {
  const allAttributes = new Map<string, Attribute>()
  const allPredicates = new Map<string, Predicate>()
  const allEntities = new Map<string, Entity>()
  const metadata: Array<{ version: string; description: string; generatedAt: string }> = []

  for (const schema of schemas) {
    const parsed = parseSchema(schema)

    // Merge attributes (later schemas override)
    for (const [key, attr] of parsed.attributes) {
      allAttributes.set(key, attr)
    }

    // Merge predicates (later schemas override)
    for (const [key, pred] of parsed.predicates) {
      allPredicates.set(key, pred)
    }

    // Merge entities (later schemas override)
    for (const [key, entity] of parsed.entities) {
      allEntities.set(key, entity)
    }

    metadata.push(parsed.metadata)
  }

  return {
    attributes: allAttributes,
    predicates: allPredicates,
    entities: allEntities,
    metadata
  }
}

/**
 * Extract predicates by entity type combinations
 * @since 1.0.0
 */
export const getPredicatesForEntityPair = (
  predicates: Map<string, Predicate>,
  sourceType: string,
  targetType: string
): Array<Predicate> => {
  const results: Array<Predicate> = []

  for (const [key, predicate] of predicates) {
    if (key.startsWith(`${sourceType}-${targetType}-`)) {
      results.push(predicate)
    }
  }

  return results
}

/**
 * Get all predicates for a specific entity type (as source)
 * @since 1.0.0
 */
export const getPredicatesForSourceEntity = (
  predicates: Map<string, Predicate>,
  sourceType: string
): Array<Predicate> => {
  const results: Array<Predicate> = []

  for (const [key, predicate] of predicates) {
    if (key.startsWith(`${sourceType}-`)) {
      results.push(predicate)
    }
  }

  return results
}

/**
 * Filter attributes by data type
 * @since 1.0.0
 */
export const getAttributesByType = (
  attributes: Map<string, Attribute>,
  dataType: string
): Array<Attribute> => {
  return Array.from(attributes.values()).filter((attr) => attr.type.valueOf() === AttributeType.make(dataType))
}
