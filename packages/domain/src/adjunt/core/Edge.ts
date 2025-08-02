import { Schema as S } from "effect"
import { EdgeId, NodeId } from "./Brand"

// Edge labels define the type of relationship
export const EdgeLabel = S.Literal(
  // Structural relationships
  "HAS_CHILD",
  "HAS_PARENT",
  
  // Schema relationships
  "CONFORMS_TO_SCHEMA",
  "PRODUCES_SCHEMA",
  "REQUIRES_SCHEMA",
  
  // Strategy relationships
  "INPUT_TO",
  "OUTPUT_FROM",
  "APPLIED_STRATEGY",
  
  // Provenance relationships
  "DERIVED_FROM",
  "TRANSFORMED_BY",
  "GENERATED_BY",
  
  // Context relationships
  "USES_CONTEXT",
  "PROVIDES_CONTEXT",
  
  // Optimization relationships
  "OPTIMIZES",
  "ALTERNATIVE_TO"
)

export type EdgeLabel = S.Schema.Type<typeof EdgeLabel>

// Edge metadata
const EdgeMetadata = S.Struct({
  weight: S.optional(S.Number),
  confidence: S.optional(S.Number.pipe(S.between(0, 1))),
  timestamp: S.optional(S.DateTimeUtc),
  properties: S.optional(S.Record(S.String, S.Unknown))
})

// Encoded edge representation
const EncodedEdge = S.Struct({
  id: EdgeId,
  sourceId: NodeId,
  targetId: NodeId,
  label: EdgeLabel,
  metadata: S.optional(EdgeMetadata),
  createdAt: S.DateTimeUtc
})

// Live API class
export class Edge extends S.Class<Edge>("Edge")(EncodedEdge) {
  static make(params: {
    id: string
    sourceId: string
    targetId: string
    label: EdgeLabel
    weight?: number
    confidence?: number
    properties?: Record<string, unknown>
  }): Edge {
    return new Edge({
      id: EdgeId.make(params.id),
      sourceId: NodeId.make(params.sourceId),
      targetId: NodeId.make(params.targetId),
      label: params.label,
      metadata: (params.weight || params.confidence || params.properties) ? {
        weight: params.weight,
        confidence: params.confidence,
        properties: params.properties,
        timestamp: new Date()
      } : undefined,
      createdAt: new Date()
    })
  }
  
  // Helper to check if this edge represents a transformation
  get isTransformation(): boolean {
    return this.label === "TRANSFORMED_BY" || this.label === "APPLIED_STRATEGY"
  }
  
  // Helper to check if this edge represents provenance
  get isProvenance(): boolean {
    return this.label === "DERIVED_FROM" || 
           this.label === "TRANSFORMED_BY" || 
           this.label === "GENERATED_BY"
  }
}

// Edge type helpers
export const EdgeLabels = {
  // Structural
  HAS_CHILD: "HAS_CHILD" as const,
  HAS_PARENT: "HAS_PARENT" as const,
  
  // Schema
  CONFORMS_TO_SCHEMA: "CONFORMS_TO_SCHEMA" as const,
  PRODUCES_SCHEMA: "PRODUCES_SCHEMA" as const,
  REQUIRES_SCHEMA: "REQUIRES_SCHEMA" as const,
  
  // Strategy
  INPUT_TO: "INPUT_TO" as const,
  OUTPUT_FROM: "OUTPUT_FROM" as const,
  APPLIED_STRATEGY: "APPLIED_STRATEGY" as const,
  
  // Provenance
  DERIVED_FROM: "DERIVED_FROM" as const,
  TRANSFORMED_BY: "TRANSFORMED_BY" as const,
  GENERATED_BY: "GENERATED_BY" as const,
  
  // Context
  USES_CONTEXT: "USES_CONTEXT" as const,
  PROVIDES_CONTEXT: "PROVIDES_CONTEXT" as const,
  
  // Optimization
  OPTIMIZES: "OPTIMIZES" as const,
  ALTERNATIVE_TO: "ALTERNATIVE_TO" as const
} as const