import { Hash, Schema } from "effect"
import { ParsedTextId, Span } from "../nlp/nlp.js"

const genMentionHash = (text: string, span: Span, textId: ParsedTextId): number => {
  return Hash.structure({ text, span, textId })
}

export type MentionId = Schema.Schema.Type<typeof MentionId>
export const MentionId = Schema.String.pipe(Schema.brand("MentionId"))

// Helper function to generate MentionId from text and span
export const makeMentionId = (text: string, span: Span, textId: ParsedTextId): MentionId => {
  const hash = genMentionHash(text, span, textId)
  return MentionId.make(`mention-${hash}`)
}
// --- Span for text position tracking ---
// For non-generic TaggedEnum, pass union directly

export class Mention extends Schema.TaggedClass<Mention>()("Mention", {
  id: MentionId,
  textId: ParsedTextId,
  text: Schema.String,
  span: Span
}) {
}
