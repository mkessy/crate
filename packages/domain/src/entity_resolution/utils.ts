// Location: packages/client/src/utils/text.ts
/**
 * Text processing utilities for entity resolution.
 *
 * This module provides functions for normalizing text and generating n-grams
 * for efficient entity matching. All functions are pure and use Effect's
 * String and Array modules for functional composition.
 */
import { pipe, String } from "effect"

/**
 * Remove diacritics from a string.
 * Converts characters like á → a, ñ → n, etc.
 */
const removeDiacritics = (text: string): string =>
  pipe(
    text,
    String.normalize("NFD"),
    String.replace(/[\u0300-\u036f]/g, "")
  )

/**
 * Remove punctuation from a string.
 * Keeps alphanumeric characters and spaces.
 */
const removePunctuation = (text: string): string =>
  pipe(
    text,
    String.replace(/[^a-zA-Z0-9\s]/g, " ")
  )

/**
 * Normalize spacing by collapsing multiple spaces into single spaces
 * and trimming leading/trailing whitespace.
 */
const canonicalSpacing = (text: string): string =>
  pipe(
    text,
    String.replace(/\s+/g, " "),
    String.trim
  )

/**
 * Normalize text for entity matching.
 * This is the complete normalization pipeline that:
 * 1. Converts to lowercase
 * 2. Removes diacritics (á → a)
 * 3. Removes punctuation
 * 4. Normalizes spacing
 *
 * @param text - The raw text to normalize
 * @returns The normalized text suitable for entity matching
 *
 * @example
 * normalize("JOSÉ's Café") // "jose s cafe"
 * normalize("Smells Like Teen-Spirit") // "smells like teen spirit"
 */
export const normalize = (text: string): string =>
  pipe(
    text,
    String.toLowerCase,
    removeDiacritics,
    removePunctuation,
    canonicalSpacing
  )

/**
 * Generate all possible n-grams from a normalized text.
 * An n-gram is a contiguous sequence of n words.
 *
 * Example:
 * Input: "nirvana smells like teen spirit"
 * Output: [
 *   "nirvana",
 *   "nirvana smells",
 *   "nirvana smells like",
 *   "nirvana smells like teen",
 *   "nirvana smells like teen spirit",
 *   "smells",
 *   "smells like",
 *   "smells like teen",
 *   "smells like teen spirit",
 *   "like",
 *   "like teen",
 *   "like teen spirit",
 *   "teen",
 *   "teen spirit",
 *   "spirit"
 * ]
 */

/**
 * Convenience function that combines normalization and n-gram generation.
 * This is useful when you want to go directly from raw text to n-grams.
 */
