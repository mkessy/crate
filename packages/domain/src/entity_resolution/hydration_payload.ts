// Location: packages/domain/src/entity_resolution/HydrationPayload.ts

import { Schema } from "effect"
import { DateTimeUtc } from "effect/Schema"
import { EntityType } from "../knowledge_base/index.js"
import { EntityUri, Method } from "./schemas.js"

/**
 * Wire format for Candidate data in the HydrationPayload.
 * This represents the serialized form of candidates sent from the server.
 *
 * The actual Candidate objects will be constructed on the client side
 * using the Data.case constructor to ensure proper structural equality.
 */
const CandidatePayload = Schema.Struct({
  uri: EntityUri,
  name: Schema.String,
  type: EntityType,
  score: Schema.Number,
  method: Method,
  mentionId: Schema.String, // Wire format for MentionId
  // For complex nested types, we'll validate their presence but not their structure
  // The server is responsible for sending valid data
  meta: Schema.Any, // Metadata tagged enum
  alts: Schema.Array(Schema.Any), // Array of AltName tagged enums
  ts: DateTimeUtc // DateTime in wire format
})

/**
 * Server response payload for hydrating the client-side ResolutionCache.
 *
 * The server sends this optimized payload that contains:
 * - trieData: Key-value pairs for building the Trie (normalized names -> entity URIs)
 * - candidateData: Candidate objects in wire format
 */
export const HydrationPayload = Schema.Struct({
  /**
   * Array of [key, value] pairs for Trie construction.
   * Each key is a normalized entity name or alias.
   * Each value is an array of EntityUris that map to that name.
   *
   * Example: [
   *   ["nirvana", ["crate://artist/mbid-1", "crate://artist/mbid-2"]],
   *   ["panda bear", ["crate://artist/panda-bear-mbid"]]
   * ]
   */
  trieData: Schema.Array(
    Schema.Tuple(
      Schema.String, // Normalized name key
      Schema.Array(EntityUri) // Array of entity URIs
    )
  ),

  /**
   * Array of candidate data in wire format.
   * These will be transformed into proper Candidate objects
   * using Data.case on the client side.
   */
  candidateData: Schema.Array(CandidatePayload)
})

/**
 * TypeScript type extracted from the schema
 */
export type HydrationPayload = Schema.Schema.Type<typeof HydrationPayload>

/**
 * Wire format type for candidate data
 */
export type CandidatePayload = Schema.Schema.Type<typeof CandidatePayload>
