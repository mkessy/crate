import { Schema as S } from "effect"
import { OptimizerNodeId, StrategyId } from "../core/Brand.js"

// Metric types for optimization
const MetricType = S.Literal(
  "execution_time",
  "memory_usage",
  "accuracy",
  "throughput",
  "cost",
  "custom"
)

// Optimization strategy
const OptimizationStrategy = S.Literal(
  "min", // Minimize the metric
  "max", // Maximize the metric
  "threshold", // Must meet a threshold
  "pareto" // Multi-objective optimization
)

// Encoded representation
const EncodedOptimizerNode = S.Struct({
  _tag: S.Literal("OptimizerNode"),
  id: OptimizerNodeId,
  name: S.String,
  description: S.optional(S.String),
  // Candidate strategies to evaluate
  candidateStrategyIds: S.NonEmptyArray(StrategyId),
  // Metrics configuration
  metrics: S.NonEmptyArray(
    S.Struct({
      type: MetricType,
      weight: S.Number.pipe(S.positive()),
      strategy: OptimizationStrategy,
      threshold: S.optional(S.Number),
      customMetricId: S.optional(S.String)
    })
  ),
  // Selected strategy after optimization (if any)
  selectedStrategyId: S.optional(StrategyId),
  // Optimization results
  results: S.optional(
    S.Record(
      StrategyId,
      S.Record(S.String, S.Number) // metricType -> score
    )
  ),
  createdAt: S.DateTimeUtc
})

// Live API class
export class OptimizerNode extends S.Class<OptimizerNode>("OptimizerNode")(
  EncodedOptimizerNode
) {
  static make(params: {
    id: string
    name: string
    candidateStrategyIds: [string, ...Array<string>]
    metrics: Array<{
      type: S.Schema.Type<typeof MetricType>
      weight: number
      strategy: S.Schema.Type<typeof OptimizationStrategy>
      threshold?: number
      customMetricId?: string
    }>
    description?: string
  }): OptimizerNode {
    return new OptimizerNode({
      _tag: "OptimizerNode",
      id: OptimizerNodeId.make(params.id),
      name: params.name,
      description: params.description,
      candidateStrategyIds: params.candidateStrategyIds.map(StrategyId.make) as [
        S.Schema.Type<typeof StrategyId>,
        ...Array<S.Schema.Type<typeof StrategyId>>
      ],
      metrics: params.metrics as S.Schema.Type<
        typeof EncodedOptimizerNode
      >["metrics"],
      selectedStrategyId: undefined,
      results: undefined,
      createdAt: new Date()
    })
  }

  // Record optimization results
  recordResults(
    results: Record<string, Record<string, number>>,
    selectedStrategyId: string
  ): OptimizerNode {
    return new OptimizerNode({
      ...this,
      results: Object.fromEntries(
        Object.entries(results).map(([strategyId, scores]) => [
          StrategyId.make(strategyId),
          scores
        ])
      ),
      selectedStrategyId: StrategyId.make(selectedStrategyId)
    })
  }

  // Check if optimization has been performed
  get isOptimized(): boolean {
    return this.selectedStrategyId !== undefined
  }
}
