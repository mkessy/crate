// Location: packages/domain/src/entity_resolution/transformations.ts
/**
 * Transformation utilities for converting wire format data to domain objects.
 * These functions ensure proper Data.case construction for structural equality.
 */

import type { CandidatePayload } from "./hydration_payload.js"
import type { MentionId } from "./schemas.js"
import { Candidate } from "./schemas.js"

/**
 * Transform a CandidatePayload (wire format) into a proper Candidate object.
 * This ensures we get the structural equality benefits from Data.case.
 */
export const transformCandidate = (payload: CandidatePayload): Candidate =>
  Candidate({
    uri: payload.uri,
    name: payload.name,
    type: payload.type,
    score: payload.score,
    method: payload.method,
    mentionId: payload.mentionId as MentionId, // Cast the branded type
    meta: payload.meta, // Already a valid Metadata tagged enum
    alts: payload.alts, // Already an array of AltName tagged enums
    ts: payload.ts
  })
