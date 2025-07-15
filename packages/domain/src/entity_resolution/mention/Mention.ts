import { Data, Hash, Schema } from "effect"
import type { Span } from "../../nlp/nlp.js"
import type { EntityUri, Method, Score } from "../index.js"

const genMentionHash = (text: string, span: Span): number => {
  return Hash.structure({ text, span })
}

export type MentionId = Schema.Schema.Type<typeof MentionId>
export const MentionId = Schema.String.pipe(Schema.brand("MentionId"))

// Schema transformation to decode MentionId from mention hash
export const MentionIdFromHash = Schema.transform(
  Schema.Number,
  MentionId,
  {
    strict: true,
    decode: (hash) => hash.toString(),
    encode: (mentionId) => parseInt(mentionId, 10)
  }
)

// Composable schema for converting hash to MentionId
export const HashToMentionId = Schema.asSchema(
  Schema.compose(Schema.NumberFromString, MentionIdFromHash)
)

// Helper function to generate MentionId from text and span
export const makeMentionId = (text: string, span: Span): MentionId => {
  const hash = genMentionHash(text, span)
  return Schema.decodeSync(MentionIdFromHash)(hash)
}
// --- Span for text position tracking ---
// For non-generic TaggedEnum, pass union directly

export type ResolutionStatus = Data.TaggedEnum<{
  Pending: { readonly method: Method }
  Resolved: { readonly entity: EntityUri; readonly score: Score }
  Failed: { readonly reason: "not-found" | "ambiguous" } // Represents both "not found" and "too ambiguous" for now
}>

export const ResolutionStatus = Data.taggedEnum<ResolutionStatus>()

export class Mention extends Data.Class<{
  readonly id: MentionId
  readonly text: string
  readonly span: Span
  readonly status: ResolutionStatus
  readonly parentId?: MentionId
}> {}
