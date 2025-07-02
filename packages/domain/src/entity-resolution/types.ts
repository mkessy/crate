import { Schema } from "effect"

// =============================================
// Core Entity Types (shared across the system)
// =============================================

// Import EntityType from knowledge-base to ensure consistency
import { EntityType } from "../knowledge-base/types.js"

// Import branded IDs from knowledge-base to ensure consistency
import {
  MbAreaId,
  MbArtistId,
  MbGenreId,
  MbLabelId,
  MbRecordingId,
  MbReleaseGroupId,
  MbReleaseId,
  MbWorkId
} from "../knowledge-base/types.js"

export { EntityType }

export { MbAreaId, MbArtistId, MbGenreId, MbLabelId, MbRecordingId, MbReleaseGroupId, MbReleaseId, MbWorkId }

// =============================================
// Entity Resolution Types
// =============================================

// Input for entity resolution
export class EntityReference extends Schema.Class<EntityReference>("EntityReference")(
  Schema.Struct({
    // Raw text that needs resolution
    text: Schema.String,
    // Optional type hint
    type: Schema.optional(EntityType),
    // Contextual information to aid resolution
    context: Schema.optional(Schema.Struct({
      // Source of the reference
      source: Schema.optional(Schema.Literal("kexp", "user", "import", "api")),
      // Temporal context
      timestamp: Schema.optional(Schema.DateTime),
      // Related entities that might help
      related: Schema.optional(Schema.Array(Schema.Struct({
        type: EntityType,
        text: Schema.String,
        id: Schema.optional(Schema.String)
      }))),
      // Additional metadata
      metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
    }))
  })
) {}

// Confidence scoring breakdown
export class ConfidenceScore extends Schema.Class<ConfidenceScore>("ConfidenceScore")(
  Schema.Struct({
    // Overall confidence (0-1)
    overall: Schema.Number.pipe(Schema.between(0, 1)),
    // Component scores
    components: Schema.Struct({
      textExact: Schema.Number.pipe(Schema.between(0, 1)),
      textFuzzy: Schema.Number.pipe(Schema.between(0, 1)),
      textPhonetic: Schema.Number.pipe(Schema.between(0, 1)),
      semantic: Schema.Number.pipe(Schema.between(0, 1)),
      contextual: Schema.Number.pipe(Schema.between(0, 1)),
      relational: Schema.Number.pipe(Schema.between(0, 1))
    })
  })
) {}

// Evidence for a match
export const EvidenceType = Schema.Literal(
  "exact_match",
  "normalized_match",
  "fuzzy_match",
  "phonetic_match",
  "alias_match",
  "semantic_match",
  "relationship_inference",
  "contextual_inference",
  "temporal_proximity",
  "co_occurrence"
)

export class Evidence extends Schema.Class<Evidence>("Evidence")(
  Schema.Struct({
    type: EvidenceType,
    description: Schema.String,
    strength: Schema.Number.pipe(Schema.between(0, 1)),
    // Source of the evidence
    source: Schema.optional(Schema.String)
  })
) {}

// A candidate entity match
export class EntityCandidate extends Schema.Class<EntityCandidate>("EntityCandidate")(
  Schema.Struct({
    // Entity identification
    entityId: Schema.String,
    entityType: EntityType,
    entityName: Schema.String,
    // Optional disambiguation info
    disambiguation: Schema.optional(Schema.String),
    // Confidence scoring
    confidence: ConfidenceScore,
    // Supporting evidence
    evidence: Schema.Array(Evidence),
    // Additional entity metadata
    metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
  })
) {}

// Resolution status
export const ResolutionStatus = Schema.Literal(
  "resolved", // High confidence single match
  "ambiguous", // Multiple plausible matches
  "unresolved", // No matches found
  "needs_review", // Flagged for human review
  "deferred" // Resolution deferred for later
)

// Result of entity resolution
export class ResolutionResult extends Schema.Class<ResolutionResult>("ResolutionResult")(
  Schema.Struct({
    // Original query
    query: EntityReference,
    // Resolution status
    status: ResolutionStatus,
    // Candidate matches (sorted by confidence)
    candidates: Schema.Array(EntityCandidate),
    // Unique ID for this resolution attempt
    resolutionId: Schema.String,
    // Timestamp of resolution
    timestamp: Schema.DateTime,
    // Optional reason for status
    statusReason: Schema.optional(Schema.String)
  })
) {}

// =============================================
// Resolution Configuration
// =============================================

export class ResolutionConfig extends Schema.Class<ResolutionConfig>("ResolutionConfig")(
  Schema.Struct({
    // Confidence thresholds
    thresholds: Schema.Struct({
      autoResolve: Schema.Number.pipe(Schema.between(0, 1)), // Min confidence for auto-resolution
      ambiguous: Schema.Number.pipe(Schema.between(0, 1)), // Max confidence gap for ambiguity
      minimum: Schema.Number.pipe(Schema.between(0, 1)) // Min confidence to include
    }),
    // Processing limits
    limits: Schema.Struct({
      maxCandidates: Schema.Number.pipe(Schema.positive()),
      searchTimeout: Schema.Number.pipe(Schema.positive()), // milliseconds
      maxSearchResults: Schema.Number.pipe(Schema.positive())
    }),
    // Feature flags
    features: Schema.Struct({
      usePhonetic: Schema.Boolean,
      useSemantic: Schema.Boolean,
      useRelational: Schema.Boolean,
      useContextual: Schema.Boolean
    })
  })
) {
  static readonly default = new ResolutionConfig({
    thresholds: {
      autoResolve: 0.9,
      ambiguous: 0.15,
      minimum: 0.3
    },
    limits: {
      maxCandidates: 10,
      searchTimeout: 5000,
      maxSearchResults: 50
    },
    features: {
      usePhonetic: true,
      useSemantic: true,
      useRelational: true,
      useContextual: true
    }
  })
}

// =============================================
// User Feedback Types
// =============================================

export class ResolutionFeedback extends Schema.Class<ResolutionFeedback>("ResolutionFeedback")(
  Schema.Struct({
    resolutionId: Schema.String,
    selectedEntityId: Schema.optional(Schema.String),
    rejectedEntityIds: Schema.Array(Schema.String),
    feedback: Schema.optional(Schema.Literal("correct", "incorrect", "unsure")),
    userId: Schema.optional(Schema.String),
    timestamp: Schema.DateTime
  })
) {}

// =============================================
// Type aliases for convenience
// =============================================

export type EntityReference = Schema.Schema.Type<typeof EntityReference>
export type ConfidenceScore = Schema.Schema.Type<typeof ConfidenceScore>
export type Evidence = Schema.Schema.Type<typeof Evidence>
export type EntityCandidate = Schema.Schema.Type<typeof EntityCandidate>
export type ResolutionResult = Schema.Schema.Type<typeof ResolutionResult>
export type ResolutionConfig = Schema.Schema.Type<typeof ResolutionConfig>
export type ResolutionFeedback = Schema.Schema.Type<typeof ResolutionFeedback>
export type ResolutionStatus = Schema.Schema.Type<typeof ResolutionStatus>
export type EvidenceType = Schema.Schema.Type<typeof EvidenceType>
