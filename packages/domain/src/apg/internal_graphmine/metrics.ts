import type { Effect, Metric } from "effect"
import type { MetricHook } from "effect/MetricHook"

export interface GraphMetrics {
  // Algorithmic efficiency (GMS's innovation)
  readonly patternsPerSecond: Metric.Metric.Counter<number>
  readonly preprocessingTime: Metric.Metric.Histogram<number>
  readonly algorithmTime: Metric.Metric.Histogram<number>

  // Machine efficiency
  readonly cacheHitRate: Metric.Metric.Gauge<number>
  readonly memoryUsage: Metric.Metric.Gauge<number>
  readonly cpuUtilization: Metric.Metric.Gauge<number>

  readonly register: (metric: MetricHook<any, any>) => Effect.Effect<void>

  // Custom metrics
  readonly track: <A>(name: string, value: A) => Effect.Effect<void>
}

export interface QueryMetrics {
  readonly queryTime: Metric.Metric.Histogram<number>
  readonly queryCount: Metric.Metric.Counter<number>
}
