import { Schema as S } from "effect"
import { NodeId, StrategyId, CorrelationId } from "../core/Brand"

// Provenance tracking for strategy applications
const EncodedStrategyApplicationNode = S.Struct({
  _tag: S.Literal("StrategyApplicationNode"),
  id: NodeId,
  // The strategy that was applied
  strategyId: StrategyId,
  // Input nodes consumed
  inputNodeIds: S.Array(NodeId),
  // Output nodes produced
  outputNodeIds: S.Array(NodeId),
  // Execution metadata
  execution: S.Struct({
    correlationId: CorrelationId,
    startedAt: S.DateTimeUtc,
    completedAt: S.DateTimeUtc,
    durationMs: S.Number,
    success: S.Boolean,
    error: S.optional(S.String),
    // Metrics collected during execution
    metrics: S.optional(
      S.Record(
        S.String,
        S.Union(S.Number, S.String, S.Boolean)
      )
    ),
  }),
  // Context used (for histomorphisms, etc.)
  contextNodeIds: S.optional(S.Array(NodeId)),
  createdAt: S.DateTimeUtc,
})

// Live API class for provenance tracking
export class StrategyApplicationNode extends S.Class<StrategyApplicationNode>(
  "StrategyApplicationNode"
)(EncodedStrategyApplicationNode) {
  static make(params: {
    id: string
    strategyId: string
    inputNodeIds: string[]
    outputNodeIds: string[]
    correlationId: string
    startedAt: Date
    completedAt: Date
    success: boolean
    error?: string
    contextNodeIds?: string[]
    metrics?: Record<string, number | string | boolean>
  }): StrategyApplicationNode {
    return new StrategyApplicationNode({
      _tag: "StrategyApplicationNode",
      id: NodeId.make(params.id),
      strategyId: StrategyId.make(params.strategyId),
      inputNodeIds: params.inputNodeIds.map(NodeId.make),
      outputNodeIds: params.outputNodeIds.map(NodeId.make),
      execution: {
        correlationId: CorrelationId.make(params.correlationId),
        startedAt: params.startedAt,
        completedAt: params.completedAt,
        durationMs: params.completedAt.getTime() - params.startedAt.getTime(),
        success: params.success,
        error: params.error,
        metrics: params.metrics,
      },
      contextNodeIds: params.contextNodeIds?.map(NodeId.make),
      createdAt: new Date(),
    })
  }

  // Helper to check if this was a successful application
  get wasSuccessful(): boolean {
    return this.execution.success
  }

  // Helper to get execution duration
  get executionDurationMs(): number {
    return this.execution.durationMs
  }
}