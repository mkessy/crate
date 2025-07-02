// Location: packages/domain/src/Model/EntityResolution.ts
import { Data, Order, Schema } from "effect"

// --- Branded Primitives for Type Safety ---
export type EntityUri = Schema.Schema.Type<typeof EntityUri>
export const EntityUri = Schema.String.pipe(Schema.brand("EntityUri"))

export type SearchMethod = Schema.Schema.Type<typeof SearchMethod>
export const SearchMethod = Schema.Literal("fts", "semantic", "fuzzy", "llm")

// --- Core Immutable Data Structures ---

interface EntityMention {
  text: string
  sourceText: string
}

// A span of text identified as a potential entity.
// Data.Case gives us structural equality for free (mention1 === mention2).
const EntityMention = Data.case<EntityMention>()

interface Candidate {
  uri: EntityUri
  name: string
  confidence: number
  method: SearchMethod
}

// A potential match for a mention.
const Candidate = Data.case<Candidate>()

// An Order instance to allow sorting Candidates in data structures.
// This is a huge win for us. We can now use SortedSet.
export const OrderByConfidence = Order.mapInput(Order.reverse(Order.number), (c: Candidate) => c.confidence)
