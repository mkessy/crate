import {
  artistRelationsPredicates,
  authorshipPredicates,
  performancePredicates,
  productionPredicates,
  structuralPredicates
} from "./Predicate.js"

// Helper to extract predicate IDs for easier mapping
const getPredicateIds = (group: typeof performancePredicates) => group.predicates.map((p) => p.id)

const performanceIds = getPredicateIds(performancePredicates)
const productionIds = getPredicateIds(productionPredicates)
const authorshipIds = getPredicateIds(authorshipPredicates)
const artistRelationsIds = getPredicateIds(artistRelationsPredicates)
const structuralIds = getPredicateIds(structuralPredicates)

/**
 * A comprehensive map defining valid predicate relationships between entity types.
 * Structure: { [subjectType]: { [objectType]: ReadonlyArray<PredicateURI> } }
 */
export const entityPredicateCompatibility = {
  artist: {
    artist: artistRelationsIds,
    recording: [...performanceIds, ...productionIds],
    release: [
      ...productionIds.filter((p) => p === "mb:mastering-engineer") // Only mastering is Artist -> Release
    ],
    work: authorshipIds,
    label: [
      "mb:published-by" // Simplified from artist-label relations
    ]
  },
  recording: {
    work: [
      "mb:performance"
    ],
    release: [
      "mb:appears-on"
    ],
    recording: [
      "mb:remix-of",
      "mb:samples"
    ]
  },
  release: {
    release_group: [
      "mb:part-of-release-group"
    ]
  },
  work: {
    work: [
      "mb:based-on"
    ]
  }
} as const

/**
 * A higher-level map using predicate groupings for semantic validation.
 */
export const entityGroupCompatibility = {
  artist: {
    artist: [artistRelationsPredicates],
    recording: [performancePredicates, productionPredicates],
    release: [productionPredicates],
    work: [authorshipPredicates]
  },
  recording: {
    work: [structuralPredicates],
    release: [structuralPredicates],
    recording: [structuralPredicates]
  },
  release: {
    release_group: [structuralPredicates]
  },
  work: {
    work: [structuralPredicates]
  }
} as const

/**
 * Type-safe function to check if a relationship is valid between two entity types.
 * @param subjectType The type of the subject entity.
 * @param objectType The type of the object entity.
 * @param predicateId The ID of the predicate.
 * @returns boolean indicating if the relationship is valid.
 */
export function isValidRelationship(
  subjectType: string,
  objectType: string,
  predicateId: string
): boolean {
  const validObjectTypes = (entityPredicateCompatibility as any)[subjectType]
  if (!validObjectTypes) {
    return false
  }
  const validPredicates = validObjectTypes[objectType]
  if (!validPredicates) {
    return false
  }
  return validPredicates.includes(predicateId)
}
