import { Data } from "effect"

/**
 * A Token represents a single word or punctuation mark from the source text,
 * preserving its exact position.
 */
export class Token extends Data.Class<{
  readonly text: string
  readonly start: number // Start offset in the source text
  readonly end: number // End offset in the source text
  readonly sentence: number // The sentence index it belongs to
  readonly isSentenceStart: boolean
}> {}
