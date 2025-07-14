import { Data, Hash } from "effect"
import type { TupleOf } from "effect/Types"
import type { Mention } from "../entity_resolution/index.js"

export type Span = TupleOf<2, number>

export const Span = (start: number, end: number) => Data.tuple(start, end) as Span

export class Token extends Data.Class<{
  readonly text: string
  readonly span: Span
  readonly sentenceIndex: number
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
  readonly mentions: ReadonlyArray<Mention>
}> {
  [Hash.symbol](): number {
    return Hash.hash(this.rawText)
  }
}
