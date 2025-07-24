import { Context, Data, Effect, HashMap, Layer, Option } from "effect"
import type { Attribute, AttributeId } from "./Entity.js"
import { Entity, EntityType, EntityUri, WithMetadata } from "./Entity.js"
import { PredicateSignature } from "./Predicate.js"
import type { Predicate, PredicateUri } from "./Predicate.js"
import type { ParsedSchema, SourceSchema } from "./SchemaTransform.js"
import { parseMultipleSchemas } from "./SchemaTransform.js"

// ============================================================================
// Domain Errors
// ============================================================================

export class UnknownEntityTypeError extends Data.TaggedError("UnknownEntityTypeError")<{
  readonly entityType: string
}> {}

export class UnknownPredicateError extends Data.TaggedError("UnknownPredicateError")<{
  readonly predicateId: string
}> {}

// ============================================================================
// Ontology Service
// ============================================================================

// Represents the formal structure of our knowledge base with live implementation
export class Ontology extends Context.Tag("Ontology")<
  Ontology,
  {
    readonly entityFactories: HashMap.HashMap<string, (id: string) => Entity | WithMetadata<any>>
    readonly entityWithMetadataFactories: HashMap.HashMap<string, <A>(id: string, value: A) => WithMetadata<A>>
    readonly predicates: HashMap.HashMap<string, Predicate>
    readonly attributes: HashMap.HashMap<string, Attribute>
    readonly predicateHierarchy: HashMap.HashMap<PredicateUri, ReadonlySet<PredicateUri>>
    readonly predicatesBySourceEntity: HashMap.HashMap<string, ReadonlyArray<Predicate>>
    readonly predicatesByTargetEntity: HashMap.HashMap<string, ReadonlyArray<Predicate>>

    // Formal ontology functions from O = (T, P, A, δ, π, ≺)
    readonly predicateSignatures: HashMap.HashMap<PredicateUri, PredicateSignature> // δ function
    readonly predicateAttributes: HashMap.HashMap<PredicateUri, ReadonlySet<AttributeId>> // π function

    // Helper methods
    readonly getPredicateDescendants: (predicateId: PredicateUri) => ReadonlySet<PredicateUri> // ≺ hierarchy
    readonly createEntity: <T extends EntityType>(type: T, id: string) => Effect.Effect<Entity, UnknownEntityTypeError>
    readonly createEntityWithMetadata: <T extends EntityType, A>(
      type: T,
      id: string,
      value: A
    ) => Effect.Effect<WithMetadata<A>, UnknownEntityTypeError>
    readonly getPredicatesForEntityPair: (sourceType: string, targetType: string) => ReadonlyArray<Predicate>

    // Formal ontology query functions
    readonly getPredicateSignature: (predicateId: PredicateUri) => Option.Option<PredicateSignature> // δ(p)
    readonly getPredicateAttributes: (predicateId: PredicateUri) => ReadonlySet<AttributeId> // π(p)
  }
>() {}

/**
 * Build ontology implementation from parsed schema using functional operations
 */
const buildOntologyFromParsed = (parsed: ParsedSchema) => {
  // Create entity factory functions using map
  const entityFactories = HashMap.map(parsed.entities, (entity) => Entity.MakeClass(entity.type))

  // Create entity with metadata factory functions using map
  const entityWithMetadataFactories = HashMap.map(
    parsed.entities,
    (entity) => <A>(id: string, value: A) =>
      WithMetadata.make({
        id: EntityUri.make(`crate://${entity.type}/${id}`),
        type: entity.type,
        value
      })
  )

  // Build predicate hierarchy using reduce
  const predicateHierarchy = HashMap.reduce(
    parsed.predicates,
    HashMap.empty<PredicateUri, ReadonlySet<PredicateUri>>(),
    (acc, predicate, _key) => {
      if (Option.isSome(predicate.parent)) {
        const parentId = predicate.parent.value
        const existing = HashMap.get(acc, parentId)
        const childrenSet = Option.isSome(existing)
          ? new Set([...existing.value, predicate.id])
          : new Set([predicate.id])
        return HashMap.set(acc, parentId, childrenSet)
      }
      return acc
    }
  )

  // Index predicates by source entity using reduce
  const predicatesBySourceEntity = HashMap.reduce(
    parsed.predicates,
    HashMap.empty<string, ReadonlyArray<Predicate>>(),
    (acc, predicate, key) => {
      const [sourceType] = key.split("-")
      if (sourceType) {
        const existing = HashMap.get(acc, sourceType)
        const predicates = Option.isSome(existing)
          ? [...existing.value, predicate]
          : [predicate]
        return HashMap.set(acc, sourceType, predicates)
      }
      return acc
    }
  )

  // Index predicates by target entity using reduce
  const predicatesByTargetEntity = HashMap.reduce(
    parsed.predicates,
    HashMap.empty<string, ReadonlyArray<Predicate>>(),
    (acc, predicate, key) => {
      const [, targetType] = key.split("-")
      if (targetType) {
        const existing = HashMap.get(acc, targetType)
        const predicates = Option.isSome(existing)
          ? [...existing.value, predicate]
          : [predicate]
        return HashMap.set(acc, targetType, predicates)
      }
      return acc
    }
  )

  // Build predicate signatures (δ function) using reduce
  const predicateSignatures = HashMap.reduce(
    parsed.predicates,
    HashMap.empty<PredicateUri, PredicateSignature>(),
    (acc, predicate, key) => {
      // Extract subject and object types from the predicate key (format: subject-object-type)
      const [subjectType, objectType] = key.split("-")
      if (subjectType && objectType) {
        const signature = PredicateSignature.make({
          subject: EntityType.make(subjectType),
          object: EntityType.make(objectType)
        })
        return HashMap.set(acc, predicate.id, signature)
      }
      return acc
    }
  )

  // Build predicate attributes (π function) using reduce
  const predicateAttributes = HashMap.reduce(
    parsed.predicates,
    HashMap.empty<PredicateUri, ReadonlySet<AttributeId>>(),
    (acc, predicate, _key) => {
      return HashMap.set(acc, predicate.id, predicate.attributes)
    }
  )

  const getPredicateDescendants = (_predicateId: PredicateUri): ReadonlySet<PredicateUri> => {
    // Recursive traversal of hierarchy - placeholder for now
    return new Set()
  }

  const getPredicateSignature = (predicateId: PredicateUri): Option.Option<PredicateSignature> => {
    return HashMap.get(predicateSignatures, predicateId)
  }

  const getPredicateAttributes = (predicateId: PredicateUri): ReadonlySet<AttributeId> => {
    return HashMap.get(predicateAttributes, predicateId).pipe(
      Option.getOrElse(() => new Set<AttributeId>())
    )
  }

  const createEntity = <T extends string>(type: T, id: string): Effect.Effect<Entity, UnknownEntityTypeError> => {
    const factory = HashMap.get(entityFactories, type)
    return Option.isSome(factory)
      ? Effect.succeed(factory.value(id))
      : Effect.fail(new UnknownEntityTypeError({ entityType: type }))
  }

  const createEntityWithMetadata = <T extends string, A>(
    type: T,
    id: string,
    value: A
  ): Effect.Effect<WithMetadata<A>, UnknownEntityTypeError> => {
    const factory = HashMap.get(entityWithMetadataFactories, type)
    return Option.isSome(factory)
      ? Effect.succeed(factory.value<A>(id, value) as WithMetadata<A>)
      : Effect.fail(new UnknownEntityTypeError({ entityType: type }))
  }

  const getPredicatesForEntityPair = (sourceType: string, targetType: string): ReadonlyArray<Predicate> => {
    return Array.from(
      HashMap.filter(parsed.predicates, (_predicate, key) => key.startsWith(`${sourceType}-${targetType}-`)).pipe(
        HashMap.values
      )
    )
  }

  return {
    entityFactories,
    entityWithMetadataFactories,
    predicates: parsed.predicates,
    attributes: parsed.attributes,
    predicateHierarchy,
    predicatesBySourceEntity,
    predicatesByTargetEntity,
    predicateSignatures,
    predicateAttributes,
    getPredicateDescendants,
    createEntity,
    createEntityWithMetadata,
    getPredicatesForEntityPair,
    getPredicateSignature,
    getPredicateAttributes
  }
}

/**
 * Static make function to create ontology from source schemas
 */
export const Make = (schemas: ReadonlyArray<SourceSchema>): Layer.Layer<Ontology> => {
  const parsed = parseMultipleSchemas(schemas)
  return Layer.effect(
    Ontology,
    Effect.sync(() => {
      const {
        attributes: attributesMap,
        entityFactories: entityFactoriesMap,
        entityWithMetadataFactories: entityWithMetadataFactoriesMap,
        getPredicateAttributes,
        getPredicateSignature,
        predicateAttributes: predicateAttributesMap,
        predicateHierarchy: predicateHierarchyMap,
        predicateSignatures: predicateSignaturesMap,
        predicates: predicatesMap,
        predicatesBySourceEntity: predicatesBySourceEntityMap,
        predicatesByTargetEntity: predicatesByTargetEntityMap
      } = buildOntologyFromParsed(parsed)
      return Ontology.of({
        attributes: attributesMap,
        entityFactories: entityFactoriesMap,
        entityWithMetadataFactories: entityWithMetadataFactoriesMap as HashMap.HashMap<
          string,
          <A>(id: string, value: A) => WithMetadata<A>
        >,
        predicateHierarchy: predicateHierarchyMap,
        predicates: predicatesMap,
        predicatesBySourceEntity: predicatesBySourceEntityMap,
        predicatesByTargetEntity: predicatesByTargetEntityMap,
        predicateAttributes: predicateAttributesMap,
        predicateSignatures: predicateSignaturesMap,
        getPredicateDescendants: (predicateId: PredicateUri) => {
          return HashMap.get(predicateHierarchyMap, predicateId).pipe(
            Option.getOrElse(() => new Set()),
            (set) => new Set(Array.from(set)) as ReadonlySet<PredicateUri>
          )
        },
        createEntity: <T extends string>(type: T, id: string): Effect.Effect<Entity, UnknownEntityTypeError> => {
          const factory = HashMap.get(entityFactoriesMap, type)
          return Option.isSome(factory)
            ? Effect.succeed(factory.value(id))
            : Effect.fail(new UnknownEntityTypeError({ entityType: type }))
        },
        createEntityWithMetadata: <T extends EntityType, A>(
          type: T,
          id: string,
          value: A
        ): Effect.Effect<WithMetadata<A>, UnknownEntityTypeError> => {
          const factory = HashMap.get(entityWithMetadataFactoriesMap, type)
          return Option.isSome(factory)
            ? Effect.succeed(factory.value<A>(id, value) as WithMetadata<A>)
            : Effect.fail(new UnknownEntityTypeError({ entityType: type }))
        },
        getPredicatesForEntityPair: (sourceType: string, targetType: string) => {
          return Array.from(
            HashMap.filter(predicatesMap, (_predicate, key) => key.startsWith(`${sourceType}-${targetType}-`)).pipe(
              HashMap.values
            )
          )
        },
        getPredicateSignature,
        getPredicateAttributes
      })
    })
  )
}
