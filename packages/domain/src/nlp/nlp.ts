import { Data, Hash } from "effect"
import type { RawMention } from "../entity_resolution/index.js"

export const { $is: $isSpan, $match: $matchSpan, Point, Range } = Data.taggedEnum<
  | { readonly _tag: "Point"; readonly offset: number }
  | { readonly _tag: "Range"; readonly start: number; readonly end: number }
>()

export const isPointSpan = $isSpan("Point")
export const isRangeSpan = $isSpan("Range")

export const spanLength = $matchSpan({
  Point: () => 1,
  Range: ({ end, start }) => end - start
})

export type Span = ReturnType<typeof Point> | ReturnType<typeof Range>

export class Token extends Data.Class<{
  readonly text: string
  readonly start: number // Start offset in the source text
  readonly end: number // End offset in the source text
  readonly sentence: number // The sentence index it belongs to
  readonly isSentenceStart: boolean
}> {}

export class Sentence extends Data.Class<{
  readonly text: string
  readonly span: Span
  readonly tokens: ReadonlyArray<Token>
  readonly index: number
}> {}

export class AnalyzedText extends Data.Class<{
  readonly id: string
  readonly rawText: string
  readonly sentences: ReadonlyArray<Sentence>
  readonly mentions: ReadonlyArray<RawMention>
}> {
  [Hash.symbol](): number {
    return Hash.hash(this.rawText)
  }
}
