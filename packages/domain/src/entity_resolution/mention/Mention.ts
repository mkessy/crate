import { Data, Schema } from "effect"
import type { EntityType } from "../../knowledge_base/index.js"

export type MentionId = Schema.Schema.Type<typeof MentionId>
export const MentionId = Schema.String.pipe(Schema.brand("MentionId"))
// --- Span for text position tracking ---
// For non-generic TaggedEnum, pass union directly
export const { $is: $isSpan, $match: $matchSpan, Point, Range } = Data.taggedEnum<
  | { readonly _tag: "Point"; readonly offset: number }
  | { readonly _tag: "Range"; readonly start: number; readonly end: number }
>()

// Extract the type from the constructors
export type Span = ReturnType<typeof Point> | ReturnType<typeof Range>

export class Mention extends Data.Class<{
  readonly id: MentionId
  readonly text: string
  readonly normalizedText: string // normalized text
  readonly span: Span
  readonly srcText: string // source text
  readonly entityTypes?: ReadonlySet<EntityType>
  readonly hint?: EntityType
}> {}

// Example of using $is and $match from taggedEnum
export const isPointSpan = $isSpan("Point")
export const isRangeSpan = $isSpan("Range")

export const spanLength = $matchSpan({
  Point: () => 1,
  Range: ({ end, start }) => end - start
})

/**
 * A type brand for the source of a mention, ensuring we track its origin.
 */

/**
 * A RawMention is a transient, intermediate representation of a potential
 * entity mention before it is finalized into a full `Mention` object.
 */
export class RawMention extends Data.Class<{
  readonly text: string
  readonly span: Span
  readonly source: "quoted" | "proper-noun" | "pattern"
  readonly pattern?: string
  readonly hint?: EntityType
}> {}
