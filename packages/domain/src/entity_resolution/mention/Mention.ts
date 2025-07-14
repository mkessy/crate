import { Data, Schema } from "effect"
import type { Span } from "../../nlp/nlp.js"
import type { EntityUri, Method, Score } from "../index.js"

export type MentionId = Schema.Schema.Type<typeof MentionId>
export const MentionId = Schema.String.pipe(Schema.brand("MentionId"))
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
