import type { Option } from "effect"
import { Context } from "effect"

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
