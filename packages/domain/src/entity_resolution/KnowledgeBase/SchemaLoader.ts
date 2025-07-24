import { Effect } from "effect"
import { parseSchema, parseMultipleSchemas, type SchemaJSON } from "./SchemaTransform.js"
import mbSchemaJson from "./mb_schema.json"
import kexpSchemaJson from "./kexp_schema.json"

/**
 * Load and parse MusicBrainz schema
 * @since 1.0.0
 */
export const loadMBSchema = () => 
  Effect.try(() => parseSchema(mbSchemaJson as SchemaJSON))

/**
 * Load and parse KEXP schema  
 * @since 1.0.0
 */
export const loadKEXPSchema = () =>
  Effect.try(() => parseSchema(kexpSchemaJson as SchemaJSON))

/**
 * Load and merge both schemas
 * @since 1.0.0
 */
export const loadCombinedSchemas = () =>
  Effect.try(() => parseMultipleSchemas(
    mbSchemaJson as SchemaJSON,
    kexpSchemaJson as SchemaJSON
  ))

/**
 * Get all available entity types from combined schemas
 * @since 1.0.0
 */
export const getAllEntityTypes = () =>
  Effect.map(loadCombinedSchemas(), (schemas) => 
    Array.from(schemas.entities.keys())
  )

/**
 * Get all predicates for algebraic operations
 * @since 1.0.0
 */
export const getAllPredicates = () =>
  Effect.map(loadCombinedSchemas(), (schemas) =>
    Array.from(schemas.predicates.values())
  )

/**
 * Get all attributes for type-safe operations
 * @since 1.0.0
 */
export const getAllAttributes = () =>
  Effect.map(loadCombinedSchemas(), (schemas) =>
    Array.from(schemas.attributes.values())
  )

/**
 * Create a knowledge base context from schemas
 * @since 1.0.0
 */
export const createKnowledgeBaseContext = () =>
  Effect.map(loadCombinedSchemas(), (schemas) => ({
    entities: schemas.entities,
    predicates: schemas.predicates,
    attributes: schemas.attributes,
    getEntityPredicates: (entityType: string) =>
      Array.from(schemas.predicates.values()).filter(p => 
        Array.from(schemas.predicates.keys()).some(key => 
          key.startsWith(`${entityType}-`)
        )
      ),
    getEntityAttributes: (entityType: string) => {
      const entity = schemas.entities.get(entityType)
      if (!entity) return []
      return entity.primaryAttributes.map(attrName => 
        schemas.attributes.get(attrName)
      ).filter(Boolean)
    },
    // Algebraic operations support
    findRelatedEntities: (sourceType: string, targetType: string) =>
      Array.from(schemas.predicates.entries())
        .filter(([key]) => key.startsWith(`${sourceType}-${targetType}-`))
        .map(([, predicate]) => predicate),
    // Type-safe entity navigation
    getCanonicalEntities: () =>
      Array.from(schemas.entities.values()).filter(entity =>
        ['artist', 'recording', 'release', 'release_group', 'label', 'work'].includes(entity.type)
      ),
    getKEXPEntities: () =>
      Array.from(schemas.entities.values()).filter(entity =>
        ['play', 'comment'].includes(entity.type)
      )
  }))

/**
 * Validate schema compatibility
 * @since 1.0.0
 */
export const validateSchemaCompatibility = () =>
  Effect.gen(function* (_) {
    const mbSchema = yield* _(loadMBSchema())
    const kexpSchema = yield* _(loadKEXPSchema())
    
    // Check that KEXP entities reference valid MB entities
    const mbEntityTypes = Array.from(mbSchema.entities.keys())
    const kexpPredicateKeys = Array.from(kexpSchema.predicates.keys())
    
    const invalidReferences = kexpPredicateKeys.filter(key => {
      const parts = key.split('-')
      if (parts.length >= 2) {
        const targetType = parts[1]
        return !mbEntityTypes.includes(targetType) && !['play', 'comment'].includes(targetType)
      }
      return false
    })
    
    if (invalidReferences.length > 0) {
      return Effect.fail(new Error(`Invalid entity references: ${invalidReferences.join(', ')}`))
    }
    
    return { compatible: true, mbEntityCount: mbSchema.entities.size, kexpEntityCount: kexpSchema.entities.size }
  })