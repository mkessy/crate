import { Array, Effect, HashMap, Option, pipe, Trie } from "effect"
import type { Candidate, EntityUri } from "./schemas.js"
import { normalize, normalizeAndGenerateNGrams } from "./utils.js"

/**
 * Type alias for the Trie structure used in the resolution cache.
 * Maps normalized entity names and aliases to arrays of EntityUris.
 */
export type EntityTrie = Trie.Trie<ReadonlyArray<EntityUri>>

/**
 * Type alias for the candidates HashMap used in the resolution cache.
 * Maps EntityUris to their full Candidate metadata.
 */
export type CandidatesMap = HashMap.HashMap<EntityUri, Candidate>

/**
 * ResolutionCache service interface.
 *
 * Provides an in-memory, high-performance cache for the client containing
 * a "hot set" of the most relevant musical entities. This enables sub-50ms
 * lookup and candidate generation directly in the browser.
 */
export class ResolutionCache extends Effect.Tag("EntityResolution/ResolutionCache")<
  ResolutionCache,
  {
    /**
     * Performs an exact lookup for a single, pre-normalized term in the Trie.
     * This is the low-level building block for more complex searches.
     * @returns An `Option<ReadonlyArray<Candidate>>` containing all candidates that exactly match the term.
     */
    readonly lookupExact: (
      term: string
    ) => Option.Option<ReadonlyArray<Candidate>>

    /**
     * The primary search function for finding all potential candidates for a raw query string.
     * It handles normalization and n-gram generation internally.
     * @returns A `ReadonlyArray<Candidate>` containing a deduplicated list of all candidates found for any n-gram in the query.
     */
    readonly search: (query: string) => ReadonlyArray<Candidate>

    /**
     * Provides auto-complete suggestions for a given search prefix.
     * @returns A `ReadonlyArray<Candidate>` of all entities whose names start with the normalized prefix, limited to `limit`.
     */
    readonly suggest: (
      prefix: string,
      limit?: number
    ) => ReadonlyArray<Candidate>

    /**
     * Retrieves a single, full Candidate object directly by its URI.
     * @returns An `Option<Candidate>` if the URI exists in the cache.
     */
    readonly get: (uri: EntityUri) => Option.Option<Candidate>

    /**
     * Get statistics about the cache contents.
     * Useful for debugging and monitoring.
     */
    readonly getStats: () => {
      readonly trieKeys: number
      readonly candidates: number
      readonly averageUrisPerKey: number
    }

    /**
     * Find all candidates for a specific entity type.
     * Useful for filtering results by type (e.g., only artists or only recordings).
     */
    readonly findByType: (type: string) => ReadonlyArray<Candidate>
  }
>() {}

/// concrete layer agnostic implementations for basic resolution cache operations

/**
 * Performs an exact lookup for a single, pre-normalized term in the Trie.
 * This is the low-level building block for more complex searches.
 *
 * @param cache - The ResolutionCache instance
 * @param term - The normalized term to look up
 * @returns An Option containing all candidates that exactly match the term
 */
export const _internal_lookupExact = (
  trie: EntityTrie,
  candidates: CandidatesMap,
  term: string
): Option.Option<ReadonlyArray<Candidate>> =>
  pipe(
    // Look up the term in the Trie to get entity URIs
    Trie.get(trie, term),
    // If found, map the URIs to full Candidate objects
    Option.map((uris) =>
      pipe(
        uris,
        // Look up each URI in the candidates HashMap
        Array.map((uri) => HashMap.get(candidates, uri)),
        // Filter out any missing candidates (should not happen in practice)
        Array.getSomes
      )
    )
  )

/**
 * The primary search function for finding all potential candidates for a raw query string.
 * It handles normalization and n-gram generation internally.
 *
 * @param trie - The Trie data structure
 * @param candidates - The HashMap storing the full metadata for each entity
 * @param query - The raw query string
 * @returns A deduplicated array of all candidates found for any n-gram in the query
 */
export const _internal_search = (
  trie: EntityTrie,
  candidates: CandidatesMap,
  query: string
): ReadonlyArray<Candidate> =>
  pipe(
    // Generate all n-grams from the normalized query
    normalizeAndGenerateNGrams(query),
    // Look up each n-gram
    Array.flatMap((ngram) =>
      pipe(
        _internal_lookupExact(trie, candidates, ngram),
        // Convert Option<ReadonlyArray<Candidate>> to ReadonlyArray<Candidate>
        Option.getOrElse(() => [] as ReadonlyArray<Candidate>)
      )
    ),
    // Remove duplicates based on structural equality (via Data.case)
    Array.dedupe
  )

/**
 * Provides auto-complete suggestions for a given search prefix.
 *
 * @param trie - The Trie data structure
 * @param candidates - The HashMap storing the full metadata for each entity
 * @param prefix - The search prefix
 * @param limit - Maximum number of suggestions to return (default: 10)
 * @returns An array of candidates whose names start with the normalized prefix
 */
export const _internal_suggest = (
  trie: EntityTrie,
  candidates: CandidatesMap,
  prefix: string,
  limit: number = 10
): ReadonlyArray<Candidate> => {
  const normalizedPrefix = normalize(prefix)

  // Get all values with the given prefix
  const entriesIterator = Trie.valuesWithPrefix(trie, normalizedPrefix)

  // Collect all matching URIs (flattened from arrays of URIs)
  const allUris: Array<EntityUri> = []
  for (const uriArray of entriesIterator) {
    for (const uri of uriArray) {
      allUris.push(uri)
      // Stop collecting if we have enough
      if (allUris.length >= limit) break
    }
    if (allUris.length >= limit) break
  }

  // Take only the requested limit and look up full candidates
  return pipe(
    allUris.slice(0, limit),
    Array.map((uri) => HashMap.get(candidates, uri)),
    Array.getSomes
  )
}

/**
 * Retrieves a single, full Candidate object directly by its URI.
 *
 * @param candidates - The HashMap storing the full metadata for each entity
 * @param uri - The entity URI to look up
 * @returns An Option containing the Candidate if found
 */
export const _internal_get = (
  candidates: CandidatesMap,
  uri: EntityUri
): Option.Option<Candidate> => HashMap.get(candidates, uri)

/**
 * Enhanced suggestion function that returns candidates sorted by relevance.
 * This version uses the key-value pairs to prefer exact matches over partial matches.
 *
 * @param trie - The Trie data structure
 * @param candidates - The HashMap storing the full metadata for each entity
 * @param prefix - The search prefix
 * @param limit - Maximum number of suggestions to return (default: 10)
 * @returns An array of candidates sorted by relevance (exact matches first)
 */
export const _internal_suggestWithRanking = (
  trie: EntityTrie,
  candidates: CandidatesMap,
  prefix: string,
  limit: number = 10
): ReadonlyArray<Candidate> => {
  const normalizedPrefix = normalize(prefix)

  // Get all entries (key-value pairs) with the given prefix
  const entriesIterator = Trie.entriesWithPrefix(trie, normalizedPrefix)

  // Separate exact matches from prefix matches
  const exactMatches: Array<Candidate> = []
  const prefixMatches: Array<Candidate> = []

  for (const [key, uriArray] of entriesIterator) {
    const isExactMatch = key === normalizedPrefix

    for (const uri of uriArray) {
      const candidate = HashMap.get(candidates, uri)
      if (Option.isSome(candidate)) {
        if (isExactMatch) {
          exactMatches.push(candidate.value)
        } else {
          prefixMatches.push(candidate.value)
        }
      }
    }

    // Stop if we have enough results
    if (exactMatches.length + prefixMatches.length >= limit) break
  }

  // Combine results: exact matches first, then prefix matches
  return [...exactMatches, ...prefixMatches].slice(0, limit)
}

/**
 * Get statistics about the cache contents.
 * Useful for debugging and monitoring.
 *
 * @param cache - The ResolutionCache instance
 * @returns Statistics about the cache
 */
export const _internal_getStats = (
  trie: EntityTrie,
  candidates: CandidatesMap
): {
  readonly trieKeys: number
  readonly candidates: number
  readonly averageUrisPerKey: number
} => {
  const trieSize = Trie.size(trie)
  const candidatesSize = HashMap.size(candidates)

  // Calculate average URIs per key
  let totalUris = 0
  for (const uris of Trie.values(trie)) {
    totalUris += uris.length
  }

  return {
    trieKeys: trieSize,
    candidates: candidatesSize,
    averageUrisPerKey: trieSize > 0 ? totalUris / trieSize : 0
  }
}

/**
 * Find all candidates for a specific entity type.
 * Useful for filtering results by type (e.g., only artists or only recordings).
 *
 * @param candidates - The HashMap storing the full metadata for each entity
 * @param type - The entity type to filter by
 * @returns An array of candidates of the specified type
 */
export const _internal_findByType = (
  candidates: CandidatesMap,
  type: string
): ReadonlyArray<Candidate> =>
  pipe(
    HashMap.values(candidates),
    Array.fromIterable,
    Array.filter((candidate) => candidate.type === type)
  )
