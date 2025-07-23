import type { Chunk, HashMap, Option, Trie } from "effect"
import { Effect } from "effect"
import type { Candidate } from "./Candidate.js"
import type { Entity, EntityUri } from "./Entity.js"

/**
 * Type alias for the Trie structure used in the resolution cache.
 * Maps normalized entity names and aliases to arrays of EntityUris.
 */
export type EntityTrie = Trie.Trie<Chunk.Chunk<EntityUri>>

/**
 * Type alias for the candidates HashMap used in the resolution cache.
 * Maps EntityUris to their full Candidate metadata.
 */
export type EntityMap = HashMap.HashMap<EntityUri, Entity>

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
     * @returns An `Option<Chunk.Chunk<Candidate>>` containing all candidates that exactly match the term.
     */
    readonly lookupExact: (
      term: string
    ) => Option.Option<Chunk.Chunk<Candidate>>

    /**
     * The primary search function for finding all potential candidates for a raw query string.
     * It handles normalization and n-gram generation internally.
     * @returns A `Chunk.Chunk<Candidate>` containing a deduplicated list of all candidates found for any n-gram in the query.
     */
    readonly search: (query: string) => Chunk.Chunk<Candidate>

    /**
     * Provides auto-complete suggestions for a given search prefix.
     * @returns A `Chunk.Chunk<Candidate>` of all entities whose names start with the normalized prefix, limited to `limit`.
     */
    readonly suggest: (
      prefix: string,
      limit?: number
    ) => Chunk.Chunk<Candidate>

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
    readonly findByType: (type: string) => Chunk.Chunk<Candidate>
  }
>() {}
