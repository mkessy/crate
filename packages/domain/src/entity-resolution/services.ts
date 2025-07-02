import { Context, Effect, Option, Stream } from "effect"
import * as Types from "./types.js"

// =============================================
// Service Interfaces (contracts only, no implementation)
// =============================================

/**
 * Text normalization service for entity matching
 */
export class TextNormalizer extends Context.Tag("TextNormalizer")<
  TextNormalizer,
  {
    /**
     * Normalize text for matching (lowercase, remove punctuation, etc.)
     */
    readonly normalize: (text: string) => string
    
    /**
     * Convert text to phonetic representation
     */
    readonly toPhonetic: (text: string) => string
    
    /**
     * Generate n-grams for fuzzy matching
     */
    readonly toNGrams: (text: string, n: number) => ReadonlyArray<string>
    
    /**
     * Extract features from text for matching
     */
    readonly extractFeatures: (text: string) => {
      readonly tokens: ReadonlyArray<string>
      readonly hasYear: Option.Option<number>
      readonly hasFeaturing: Option.Option<string>
      readonly hasParenthetical: boolean
      readonly hasRemix: boolean
    }
  }
>() {}

/**
 * String similarity algorithms
 */
export class StringMatcher extends Context.Tag("StringMatcher")<
  StringMatcher,
  {
    /**
     * Calculate Levenshtein distance between two strings
     */
    readonly levenshteinDistance: (a: string, b: string) => number
    
    /**
     * Calculate Jaro-Winkler similarity (0-1)
     */
    readonly jaroWinklerSimilarity: (a: string, b: string) => number
    
    /**
     * Calculate n-gram similarity (0-1)
     */
    readonly ngramSimilarity: (a: string, b: string, n?: number) => number
    
    /**
     * Music-specific artist name matching
     */
    readonly matchArtistName: (query: string, candidate: string) => number
    
    /**
     * Music-specific track title matching
     */
    readonly matchTrackTitle: (query: string, candidate: string) => number
  }
>() {}

/**
 * Entity search service for database lookups
 */
export class EntitySearchService extends Context.Tag("EntitySearchService")<
  EntitySearchService,
  {
    /**
     * Find entity by exact ID
     */
    readonly findById: (
      id: string,
      type: Types.EntityType
    ) => Effect.Effect<Option.Option<unknown>, Error>
    
    /**
     * Search entities by normalized text
     */
    readonly searchByText: (
      text: string,
      type: Types.EntityType,
      limit: number
    ) => Stream.Stream<Types.EntityCandidate, Error>
    
    /**
     * Search entities by phonetic representation
     */
    readonly searchByPhonetic: (
      phonetic: string,
      type: Types.EntityType,
      limit: number
    ) => Stream.Stream<Types.EntityCandidate, Error>
    
    /**
     * Get entities related by specific relationship
     */
    readonly findRelated: (
      entityId: string,
      relationshipType: string,
      targetType: Types.EntityType
    ) => Effect.Effect<ReadonlyArray<Types.EntityCandidate>, Error>
  }
>() {}

/**
 * Semantic search using embeddings
 */
export class SemanticSearchService extends Context.Tag("SemanticSearchService")<
  SemanticSearchService,
  {
    /**
     * Generate embedding for text
     */
    readonly embed: (text: string) => Effect.Effect<Float32Array, Error>
    
    /**
     * Search by semantic similarity
     */
    readonly searchSimilar: (
      embedding: Float32Array,
      type: Types.EntityType,
      limit: number
    ) => Effect.Effect<ReadonlyArray<Types.EntityCandidate>, Error>
    
    /**
     * Calculate cosine similarity between embeddings
     */
    readonly cosineSimilarity: (a: Float32Array, b: Float32Array) => number
  }
>() {}

/**
 * Graph-based entity resolution
 */
export class GraphResolver extends Context.Tag("GraphResolver")<
  GraphResolver,
  {
    /**
     * Resolve entities through relationship paths
     */
    readonly resolveByPath: (
      startEntity: string,
      path: ReadonlyArray<{
        readonly predicate: string
        readonly targetType: Types.EntityType
      }>
    ) => Stream.Stream<Types.EntityCandidate, Error>
    
    /**
     * Find commonly co-occurring entities
     */
    readonly findCoOccurrences: (
      entityId: string,
      entityType: Types.EntityType,
      limit: number
    ) => Effect.Effect<
      ReadonlyArray<{
        readonly entity: Types.EntityCandidate
        readonly frequency: number
      }>,
      Error
    >
    
    /**
     * Enhance candidates with relationship evidence
     */
    readonly enrichWithRelationships: (
      candidates: ReadonlyArray<Types.EntityCandidate>,
      query: Types.EntityReference
    ) => Effect.Effect<ReadonlyArray<Types.EntityCandidate>, Error>
  }
>() {}

/**
 * Main entity resolution orchestrator
 */
export class EntityResolver extends Context.Tag("EntityResolver")<
  EntityResolver,
  {
    /**
     * Resolve a single entity reference
     */
    readonly resolve: (
      query: Types.EntityReference
    ) => Stream.Stream<Types.ResolutionResult, Error>
    
    /**
     * Resolve multiple entity references in batch
     */
    readonly resolveBatch: (
      queries: ReadonlyArray<Types.EntityReference>
    ) => Stream.Stream<Types.ResolutionResult, Error>
    
    /**
     * Record user feedback for a resolution
     */
    readonly recordFeedback: (
      feedback: Types.ResolutionFeedback
    ) => Effect.Effect<void, Error>
    
    /**
     * Get resolution history for analysis
     */
    readonly getResolutionHistory: (
      entityId: string
    ) => Effect.Effect<ReadonlyArray<Types.ResolutionResult>, Error>
  }
>() {}

/**
 * Resolution cache service
 */
export class ResolutionCache extends Context.Tag("ResolutionCache")<
  ResolutionCache,
  {
    /**
     * Get cached resolution result
     */
    readonly get: (
      query: Types.EntityReference
    ) => Effect.Effect<Option.Option<Types.ResolutionResult>, Error>
    
    /**
     * Cache a resolution result
     */
    readonly set: (
      query: Types.EntityReference,
      result: Types.ResolutionResult
    ) => Effect.Effect<void, Error>
    
    /**
     * Clear cache entries
     */
    readonly clear: (
      filter?: (query: Types.EntityReference) => boolean
    ) => Effect.Effect<number, Error>
  }
>() {}
