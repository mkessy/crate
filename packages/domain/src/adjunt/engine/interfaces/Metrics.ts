import { Effect, Context, Duration, Metric } from "effect"
import type { CorrelationId, NodeId, StrategyId } from "../../core/Brand"
import type { RecursionScheme } from "../../core/RecursionScheme"

// ============================================================================
// Metrics Service Interface
// ============================================================================

export interface MetricsService extends Context.Tag.Service<MetricsService> {
  // Core metric operations
  readonly recordDuration: (
    metric: string,
    duration: Duration.Duration,
    labels?: MetricLabels
  ) => Effect.Effect<void>
  
  readonly incrementCounter: (
    metric: string,
    labels?: MetricLabels
  ) => Effect.Effect<void>
  
  readonly recordGauge: (
    metric: string,
    value: number,
    labels?: MetricLabels
  ) => Effect.Effect<void>
  
  readonly recordHistogram: (
    metric: string,
    value: number,
    labels?: MetricLabels
  ) => Effect.Effect<void>
  
  // Batch operations
  readonly recordBatch: (
    metrics: ReadonlyArray<MetricRecord>
  ) => Effect.Effect<void>
  
  // Query operations
  readonly getMetric: (
    metric: string,
    labels?: MetricLabels
  ) => Effect.Effect<MetricValue>
  
  readonly export: () => Effect.Effect<MetricsExport>
}

export class MetricsService extends Context.Tag("MetricsService")<MetricsService>() {}

// ============================================================================
// Metric Types
// ============================================================================

export interface MetricLabels {
  readonly [key: string]: string | number | boolean
}

export interface MetricRecord {
  readonly name: string
  readonly type: "counter" | "gauge" | "histogram" | "duration"
  readonly value: number
  readonly labels?: MetricLabels
  readonly timestamp?: Date
}

export interface MetricValue {
  readonly value: number
  readonly count: number
  readonly min?: number
  readonly max?: number
  readonly mean?: number
  readonly p50?: number
  readonly p90?: number
  readonly p95?: number
  readonly p99?: number
}

export interface MetricsExport {
  readonly timestamp: Date
  readonly metrics: ReadonlyMap<string, ReadonlyArray<MetricPoint>>
}

export interface MetricPoint {
  readonly value: MetricValue
  readonly labels: MetricLabels
  readonly timestamp: Date
}

// ============================================================================
// Built-in Metrics
// ============================================================================

export namespace EngineMetrics {
  // Execution metrics
  export const ENGINE_CALL_DURATION = "engine_call_duration_ms"
  export const STRATEGY_EXECUTION_DURATION = "strategy_execution_duration_ms"
  export const COMPILATION_DURATION = "compilation_duration_ms"
  export const VALIDATION_DURATION = "validation_duration_ms"
  
  // Throughput metrics
  export const NODES_PROCESSED = "nodes_processed_total"
  export const STRATEGIES_APPLIED = "strategies_applied_total"
  export const GRAPHS_MATERIALIZED = "graphs_materialized_total"
  
  // Cache metrics
  export const CACHE_HITS = "cache_hits_total"
  export const CACHE_MISSES = "cache_misses_total"
  export const CACHE_EVICTIONS = "cache_evictions_total"
  export const CACHE_SIZE = "cache_size_bytes"
  
  // Error metrics
  export const ERRORS = "errors_total"
  export const COMPILATION_ERRORS = "compilation_errors_total"
  export const EXECUTION_ERRORS = "execution_errors_total"
  export const VALIDATION_ERRORS = "validation_errors_total"
  
  // LLM metrics
  export const LLM_CALLS = "llm_calls_total"
  export const LLM_TOKENS_USED = "llm_tokens_used_total"
  export const LLM_GENERATION_DURATION = "llm_generation_duration_ms"
  export const LLM_GENERATION_SUCCESS = "llm_generation_success_total"
  export const LLM_GENERATION_FAILURE = "llm_generation_failure_total"
  
  // Resource metrics
  export const MEMORY_USAGE = "memory_usage_bytes"
  export const GRAPH_SIZE = "graph_size_nodes"
  export const EXECUTION_QUEUE_SIZE = "execution_queue_size"
  export const ACTIVE_EXECUTIONS = "active_executions"
}

// ============================================================================
// Metric Label Keys
// ============================================================================

export namespace MetricLabelKeys {
  export const CORRELATION_ID = "correlation_id"
  export const NODE_ID = "node_id"
  export const NODE_TYPE = "node_type"
  export const STRATEGY_ID = "strategy_id"
  export const RECURSION_SCHEME = "recursion_scheme"
  export const CACHE_TYPE = "cache_type"
  export const ERROR_TYPE = "error_type"
  export const LLM_MODEL = "llm_model"
  export const OPTIMIZATION_TYPE = "optimization_type"
}

// ============================================================================
// Effect Metric Integration
// ============================================================================

export interface EffectMetrics {
  // Pre-configured Effect metrics
  readonly engineCallDuration: Metric.Histogram<Duration.Duration>
  readonly strategyExecutions: Metric.Counter<number>
  readonly cacheHitRate: Metric.Gauge<number>
  readonly activeExecutions: Metric.Gauge<number>
  readonly errorRate: Metric.Frequency<string>
}

export const createEffectMetrics = (): EffectMetrics => ({
  engineCallDuration: Metric.histogram(
    EngineMetrics.ENGINE_CALL_DURATION,
    Metric.Histogram.Boundaries.exponential(1, 2, 10)
  ),
  
  strategyExecutions: Metric.counter(
    EngineMetrics.STRATEGIES_APPLIED
  ),
  
  cacheHitRate: Metric.gauge(
    "cache_hit_rate",
    {
      description: "Cache hit rate (0-1)"
    }
  ),
  
  activeExecutions: Metric.gauge(
    EngineMetrics.ACTIVE_EXECUTIONS,
    {
      description: "Number of active executions"
    }
  ),
  
  errorRate: Metric.frequency(
    "error_rate",
    {
      description: "Error rate by type"
    }
  )
})

// ============================================================================
// Observability Helpers
// ============================================================================

export const withMetrics = <R, E, A>(
  metricName: string,
  effect: Effect.Effect<A, E, R>,
  labels?: MetricLabels
): Effect.Effect<A, E, R | MetricsService> =>
  Effect.gen(function* () {
    const metrics = yield* MetricsService
    const start = Date.now()
    
    try {
      const result = yield* effect
      const duration = Date.now() - start
      
      yield* metrics.recordDuration(
        metricName,
        Duration.millis(duration),
        labels
      )
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      yield* Effect.all([
        metrics.recordDuration(
          metricName,
          Duration.millis(duration),
          { ...labels, error: true }
        ),
        metrics.incrementCounter(
          EngineMetrics.ERRORS,
          { ...labels, error_type: error.constructor.name }
        )
      ])
      
      throw error
    }
  })

export const trackExecution = <R, E, A>(
  strategyId: StrategyId,
  recursionScheme: RecursionScheme,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | MetricsService> =>
  withMetrics(
    EngineMetrics.STRATEGY_EXECUTION_DURATION,
    effect,
    {
      [MetricLabelKeys.STRATEGY_ID]: strategyId,
      [MetricLabelKeys.RECURSION_SCHEME]: recursionScheme
    }
  )