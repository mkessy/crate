import type { Brand, Effect } from "effect"
import { Context } from "effect"
import type { RawMention } from "../entity_resolution/mention/Mention.js"
import type { Token } from "./nlp.js"

// THIS IS THE CORRECTION:
// WinkDoc is now a branded `unknown`, making it a truly opaque type.
// The domain does not know its shape, only that it exists.
export type WinkDoc = Brand.Branded<unknown, "WinkDoc">

/**
 * NlpService provides a clean, Effect-native interface to the underlying NLP engine.
 * It is responsible for both processing text and extracting structured data from the result.
 */
export class Nlp extends Context.Tag("NLP")<
  Nlp,
  {
    /** Processes raw text into an opaque, annotated document. */
    readonly processText: (text: string) => Effect.Effect<WinkDoc>

    /** Extracts `Token` objects from the opaque document. */
    readonly extractTokens: (doc: WinkDoc) => Effect.Effect<ReadonlyArray<Token>>

    /** Extracts `RawMention` objects from the opaque document's entity recognition. */
    readonly extractEntities: (doc: WinkDoc) => Effect.Effect<ReadonlyArray<RawMention>>
  }
>() {}
