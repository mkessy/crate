// CSV utilities
export * from "./csv/parseLines.js"

// KEXP types and schemas
export * as Kexp from "./kexp/schemas.js"

// Entity resolution
export * as EntityResolution from "./entity-resolution/index.js"

// Re-export specific commonly used types for convenience
export type {
  EntityType,
  EntityReference,
  EntityCandidate,
  ResolutionResult,
  ResolutionStatus
} from "./entity-resolution/types.js"

export {
  TextNormalizer,
  StringMatcher,
  EntitySearchService,
  SemanticSearchService,
  GraphResolver,
  EntityResolver,
  ResolutionCache
} from "./entity-resolution/services.js"
