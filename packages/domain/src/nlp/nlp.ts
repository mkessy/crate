import { Schema } from "effect"
import type { TupleOf } from "effect/Types"

export type Span = TupleOf<2, number>

export const Span = Schema.TaggedClass<Span>()("Span", {
  start: Schema.Number,
  end: Schema.Number
})

export class Token extends Schema.TaggedClass<Token>()("Token", {
  text: Schema.String,
  span: Span,
  sentenceIndex: Schema.Number
}) {
}

export class Sentence extends Schema.TaggedClass<Sentence>()("Sentence", {
  text: Schema.String,
  span: Span,
  tokens: Schema.Array(Token),
  index: Schema.Number
}) {
}

export type ParsedTextId = Schema.Schema.Type<typeof ParsedTextId>
export const ParsedTextId = Schema.Number.pipe(Schema.brand("ParsedTextId"))

export class ParsedText extends Schema.TaggedClass<ParsedText>()("ParsedText", {
  id: ParsedTextId,
  text: Schema.String,
  sents: Schema.Array(Sentence)
}) {
}
