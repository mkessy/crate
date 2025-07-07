import { Chunk, DateTime, Effect, Layer, Stream } from "effect"
import { CandidateFinder, CandidateFinderBase, type CandidateFinderConfig } from "./Method.js"
import { ResolutionCache, type EntityTrie, type CandidatesMap } from "./resolution_cache.js"
import { Candidate, type Mention, type MentionId } from "./schemas.js"
import { normalizeAndGenerateNGrams } from "./utils.js"

/**
 * Configuration for the Trie-based candidate finder
 */
export interface TrieFinderConfig extends CandidateFinderConfig {
  /**
   * Whether to search for partial matches (prefixes)
   */
  readonly allowPartialMatches?: boolean
  
  /**
   * Maximum n-gram size to generate
   */
  readonly maxNGramSize?: number
}

/**
 * Trie-based candidate finder implementation
 * 
 * This finder uses the pre-built trie from ResolutionCache to find
 * exact and n-gram matches for entity mentions. It's the fastest
 * finder for common entities that are in the cache.
 */
export const TrieCandidateFinderLive = (
  config: TrieFinderConfig = {}
) => Layer.effect(
  CandidateFinder,
  Effect.gen(function* () {
    // Get the resolution cache to access the trie
    const cache = yield* ResolutionCache
    
    // Stats tracking
    const stats = CandidateFinderBase.createStatsTracker()
    
    // Default configuration
    const finderConfig: Required<TrieFinderConfig> = {
      maxCandidates: config.maxCandidates ?? 20,
      minConfidence: config.minConfidence ?? 0.0,
      priority: config.priority ?? 10, // High priority for fast local search
      allowPartialMatches: config.allowPartialMatches ?? false,
      maxNGramSize: config.maxNGramSize ?? 5
    }
    
    return CandidateFinder.of({
      method: "trie", // Note: extending the Method type to include "trie"
      
      find: (mention: Mention) => 
        Stream.fromEffect(
          Effect.gen(function* () {
            const startTime = Date.now()
            
            // Use the cache's search function which handles n-grams
            const candidates = cache.search(mention.text)
            
            // Convert to properly scored candidates for this mention
            const scoredCandidates = candidates
              .map(c => 
                Candidate({
                  ...c,
                  mentionId: mention.id,
                  score: calculateInitialScore(c, mention),
                  method: "trie",
                  ts: yield* DateTime.now
                })
              )
              .filter(c => c.score >= finderConfig.minConfidence)
              .slice(0, finderConfig.maxCandidates)
            
            // Record stats
            stats.recordSearch(Date.now() - startTime, scoredCandidates.length)
            
            return Chunk.fromIterable(scoredCandidates)
          })
        ).pipe(
          Stream.flattenChunks
        ),
        
      findBatch: (mentions) => 
        CandidateFinderBase.findBatch(
          { find: (m) => 
              Stream.fromEffect(
                Effect.sync(() => {
                  const candidates = cache.search(m.text)
                  return candidates.map(c =>
                    Candidate({
                      ...c,
                      mentionId: m.id,
                      score: calculateInitialScore(c, m),
                      method: "trie",
                      ts: DateTime.unsafeNow()
                    })
                  )
                })
              ).pipe(Stream.flattenIterables),
            method: "trie"
          },
          mentions
        ),
        
      getConfig: () => finderConfig,
      
      getStats: () => Effect.succeed({
        ...stats.getStats(),
        cacheHitRate: undefined // Could track this if needed
      })
    })
  })
)

/**
 * Calculate initial score for a trie-based match
 * 
 * This is a simple scoring function that considers:
 * - Exact match vs n-gram match
 * - Length of the match relative to the mention
 * - Case sensitivity
 */
function calculateInitialScore(
  candidate: { name: string; type: string },
  mention: Mention
): number {
  const mentionLower = mention.text.toLowerCase()
  const candidateLower = candidate.name.toLowerCase()
  
  // Exact match (case-insensitive)
  if (mentionLower === candidateLower) {
    return 0.95
  }
  
  // Exact match (case-sensitive)
  if (mention.text === candidate.name) {
    return 0.98
  }
  
  // Check if mention contains candidate or vice versa
  if (mentionLower.includes(candidateLower)) {
    // Penalize based on how much extra text there is
    const lengthRatio = candidateLower.length / mentionLower.length
    return 0.7 * lengthRatio
  }
  
  if (candidateLower.includes(mentionLower)) {
    // Mention is a substring of candidate (e.g., "Beatles" in "The Beatles")
    const lengthRatio = mentionLower.length / candidateLower.length
    return 0.8 * lengthRatio
  }
  
  // For n-gram matches, use a lower base score
  // This would be refined by other scorers (popularity, context, etc.)
  return 0.5
}

/**
 * Create a Trie-based finder with custom configuration
 */
export const makeTrieFinder = (config?: TrieFinderConfig) =>
  TrieCandidateFinderLive(config)

/**
 * Default Trie finder with standard configuration
 */
export const TrieFinderDefault = TrieCandidateFinderLive()
