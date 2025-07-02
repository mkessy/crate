// Core resolution types building on your existing schemas
import { Schema } from "effect"
import type * as MB from "../knowledge_base/mb_entity/schemas.js"
import type * as Rel from "../knowledge_base/relationships/schemas.js"

// Resolution query that can come from various sources
export class ResolutionQuery extends Schema.Class<ResolutionQuery>("ResolutionQuery")(
  Schema.Struct({
    // Text fields from user input or KEXP data
    artist_text: Schema.optional(Schema.String),
    song_text: Schema.optional(Schema.String),
    album_text: Schema.optional(Schema.String),

    // Structured hints if available
    mb_hints: Schema.optional(Schema.Struct({
      artist_ids: Schema.Array(Schema.String),
      recording_id: Schema.optional(Schema.String),
      release_id: Schema.optional(Schema.String)
    })),

    // Context from KEXP or user session
    context: Schema.optional(Schema.Struct({
      airdate: Schema.optional(Schema.DateTime),
      genre_hints: Schema.optional(Schema.Array(Schema.String)),
      location: Schema.optional(Schema.String),
      kexp_play_id: Schema.optional(Schema.Number)
    })),

    // For audio-based matching (future)
    audio_features: Schema.optional(Schema.Struct({
      chromaprint: Schema.optional(Schema.String),
      duration_ms: Schema.optional(Schema.Number)
    }))
  })
) {}

// Enhanced match result with confidence scoring
export class EntityMatch extends Schema.Class<EntityMatch>("EntityMatch")(
  Schema.Struct({
    // The matched entity (using your existing types)
    entity_type: MB.EntityType,
    entity_id: Schema.String, // MB ID
    entity_name: Schema.String,

    // Detailed confidence scoring
    confidence: Schema.Number.pipe(Schema.between(0, 1)),
    confidence_breakdown: Schema.Struct({
      text_similarity: Schema.Number,
      phonetic_match: Schema.Number,
      semantic_similarity: Schema.Number,
      relationship_support: Schema.Number, // From graph context
      temporal_proximity: Schema.Number // For time-based hints
    }),

    // Match provenance
    match_source: Schema.Literal(
      "exact_id", // Direct MB ID match
      "exact_text", // Exact normalized text match
      "fuzzy_text", // Fuzzy string matching
      "phonetic", // Soundex/Metaphone match
      "semantic", // Embedding-based match
      "graph_inference", // Inferred from relationships
      "composite" // Multiple signals combined
    ),

    // Supporting evidence
    evidence: Schema.Array(Schema.Struct({
      type: Schema.String,
      description: Schema.String,
      weight: Schema.Number
    }))
  })
) {}
