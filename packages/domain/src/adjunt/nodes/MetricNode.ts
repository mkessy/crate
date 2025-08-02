import type { Duration } from "effect/Duration"
import type { BaseNodeInterface } from "../core/BaseNode.js"
import { BaseNode } from "../core/BaseNode.js"

import type { Effect, Metric, MetricKeyType } from "effect"
import { Context } from "effect"

/**
 * An abstract node that is instrumented with a monadic metrics interface.
 */
export abstract class MetricNode<T extends BaseNodeInterface> extends BaseNode<T> implements Instrumented {
  // Holds the actual Metric objects. Protected so subclasses don't need to know about it.
  constructor(
    data: T,
    // It derives its metrics using the MetricsFactory service.
    metrics: IMetricsFactory
  ) {
    super()
    this.metrics = metrics.makeInstrumented(this)
  }

  readonly metrics: {
    readonly invocations: Metric.Metric<MetricKeyType.MetricKeyType.Counter<number>, number, number>
    readonly processingTime: Metric.Metric<MetricKeyType.MetricKeyType.Histogram, Duration, number>
  }
}

/**
 * A monadic interface for interacting with a node's core metrics.
 * It provides ready-to-use effects and aspects.
 */
export interface MonadicMetrics {
  /**
   * An Effect that, when run, increments this node's invocation counter.
   */
  readonly incrementInvocations: Effect.Effect<void>

  /**
   * An aspect that tracks the duration of an Effect, recording it
   * in this node's processingTime histogram.
   */
  readonly trackDuration: <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E, R>
}

// Base interface for any node that is instrumented.
export interface Instrumented {
  readonly metrics: {
    readonly invocations: Metric.Metric<MetricKeyType.MetricKeyType.Counter<number>, number, number>
    readonly processingTime: Metric.Metric<MetricKeyType.MetricKeyType.Histogram, Duration, number>
  }
}

// For nodes that load data from external sources.
export interface InstrumentedLoadable extends Instrumented {
  readonly loadMetrics: {
    readonly duration: Metric.Metric<MetricKeyType.MetricKeyType.Histogram, number, number>
    readonly itemsLoaded: Metric.Metric<MetricKeyType.MetricKeyType.Counter<number>, number, number>
    readonly bytesLoaded: Metric.Metric<MetricKeyType.MetricKeyType.Counter<number>, number, number>
  }
}

// For nodes that interact with LLMs.
export interface InstrumentedIntelligent extends Instrumented {
  readonly aiMetrics: {
    readonly transitionDuration: Metric.Metric<MetricKeyType.MetricKeyType.Histogram, number, number>
    readonly promptTokens: Metric.Metric<MetricKeyType.MetricKeyType.Counter<number>, number, number>
    readonly completionTokens: Metric.Metric<MetricKeyType.MetricKeyType.Counter<number>, number, number>
  }
}

// For nodes that have health checks.
export interface InstrumentedHealtheckable extends Instrumented {
  readonly healthMetrics: {
    readonly status: Metric.Metric<MetricKeyType.MetricKeyType.Gauge<number>, number, number>
    readonly latency: Metric.Metric<MetricKeyType.MetricKeyType.Gauge<number>, number, number>
  }
}

// The factory service interface.
export class MetricsFactory extends Context.Tag("MetricsFactory")<
  MetricsFactory,
  IMetricsFactory
>() {}

export interface IMetricsFactory {
  makeInstrumented: (node: BaseNode<any>) => Instrumented["metrics"]
  makeInstrumentedLoadable: (node: BaseNode<any>) => InstrumentedLoadable["loadMetrics"]
  makeInstrumentedIntelligent: (node: BaseNode<any>) => InstrumentedIntelligent["aiMetrics"]
  // ... other factory methods
}
