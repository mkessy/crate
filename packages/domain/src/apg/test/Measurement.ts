/**
 * @since 1.0.0
 */
import { Chunk, Context, Data, Duration, Effect, Layer, Metric, MetricBoundaries, Option, pipe, Stream } from "effect"

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------

/**
 * Statistical summary of measurement timings
 * @since 1.0.0
 * @category models
 */
export class MeasurementStats extends Data.Class<{
  readonly samples: number
  readonly mean: Duration.Duration
  readonly variance: Duration.Duration
  readonly stdDev: Duration.Duration
  readonly min: Duration.Duration
  readonly max: Duration.Duration
  readonly median: Duration.Duration
  readonly p95: Duration.Duration
  readonly p99: Duration.Duration
}> {}

/**
 * Complete measurement result including raw timings
 * @since 1.0.0
 * @category models
 */
export class MeasurementResult extends Data.Class<{
  readonly name: string
  readonly stats: MeasurementStats
  readonly timings: ReadonlyArray<Duration.Duration>
  readonly histogram: Metric.Metric.Histogram<any>
}> {}

/**
 * Configuration options for measuring
 * @since 1.0.0
 * @category models
 */
export interface MeasurementOptions {
  readonly samples?: number
  readonly warmupSamples?: number
  readonly maxDuration?: Duration.Duration
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category models
 */
export namespace Measurement {
  /**
   * @since 1.0.0
   * @category models
   */
  export interface Service {
    readonly measure: <A, E>(
      label: string,
      effect: Effect.Effect<A, E, never>,
      options?: MeasurementOptions
    ) => Effect.Effect<MeasurementResult, E, never>

    readonly compare: <A, E>(
      baseline: { label: string; effect: Effect.Effect<A, E, never> },
      candidate: { label: string; effect: Effect.Effect<A, E, never> },
      options?: MeasurementOptions
    ) => Effect.Effect<
      {
        readonly baseline: MeasurementResult
        readonly candidate: MeasurementResult
        readonly speedup: number
      },
      E,
      never | Measurement.Service
    >
  }
}

/**
 * @since 1.0.0
 * @category tags
 */
export const Measurement = Context.GenericTag<Measurement.Service>("@apg/test/Measurement")

// -----------------------------------------------------------------------------
// Constructors
// -----------------------------------------------------------------------------

/**
 * Default measurement service implementation
 * @since 1.0.0
 * @category constructors
 */
export const MeasurementLive = Layer.succeed(
  Measurement,
  Measurement.of({
    measure: (label, effect, options = {}) =>
      Effect.gen(function*() {
        const samples = options.samples ?? 100
        const warmupSamples = options.warmupSamples ?? Math.min(10, Math.floor(samples * 0.1))
        const maxDuration = options.maxDuration ?? Duration.minutes(1)

        // Create histogram for timing distribution
        const histogram = Metric.histogram(
          `${label}_histogram`,
          MetricBoundaries.exponential({ start: 0.1, factor: 2, count: 15 })
        )

        // Warmup phase
        yield* Effect.logDebug(`Warming up ${label} with ${warmupSamples} samples`)
        yield* pipe(
          Stream.repeatEffect(Effect.timed(effect)),
          Stream.take(warmupSamples),
          Stream.runDrain
        )

        // Measurement phase
        yield* Effect.logDebug(`Measuring ${label} with ${samples} samples`)

        const startTime = yield* Effect.clock.pipe(Effect.flatMap((_) => _.currentTimeMillis))

        // Collect timings using Stream
        const timings = yield* pipe(
          Stream.repeatEffect(
            Effect.timed(effect).pipe(
              Effect.tap(([duration]) => histogram(Effect.succeed(Duration.toMillis(duration))))
            )
          ),
          Stream.map(([duration]) => duration),
          Stream.take(samples),
          Stream.timeout(maxDuration),
          Stream.runCollect
        )

        const endTime = yield* Effect.clock.pipe(Effect.flatMap((_) => _.currentTimeMillis))
        const totalTime = Duration.millis(endTime - startTime)

        // Calculate statistics
        const stats = yield* calculateStats(timings)
        const histogramState = yield* Metric.value(histogram)

        yield* Effect.logInfo(`Completed ${label}`).pipe(
          Effect.annotateLogs({
            samples,
            mean: Duration.toMillis(stats.mean),
            stdDev: Duration.toMillis(stats.stdDev),
            totalTime: Duration.toMillis(totalTime)
          })
        )

        return new MeasurementResult({
          name: label,
          stats,
          timings: Array.from(timings),
          histogram: histogramState as unknown as Metric.Metric.Histogram<any>
        })
      }),

    compare: (baseline, candidate, options) =>
      Effect.gen(function*() {
        const self = yield* Measurement
        const baselineResult = yield* self.measure(baseline.label, baseline.effect, options)
        const candidateResult = yield* self.measure(candidate.label, candidate.effect, options)

        const speedup = pipe(
          Option.zipWith(
            Option.map(Duration.toNanos(baselineResult.stats.mean), (n) => n ?? 0n),
            Option.map(Duration.toNanos(candidateResult.stats.mean), (n) => n ?? 0n),
            (baselineNanos, candidateNanos) =>
              candidateNanos === 0n ? Infinity : Number(baselineNanos) / Number(candidateNanos)
          ),
          Option.getOrElse(() => 1) // Default to 1x speedup if durations are infinite
        )

        yield* Effect.logInfo("Comparison complete").pipe(
          Effect.annotateLogs({
            baseline: baseline.label,
            candidate: candidate.label,
            speedup: speedup.toFixed(2) + "x"
          })
        )

        return { baseline: baselineResult, candidate: candidateResult, speedup }
      })
  })
)

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

const calculateStats = (
  timings: Chunk.Chunk<Duration.Duration>
): Effect.Effect<MeasurementStats, never, never> =>
  Effect.sync(() => {
    const sorted = [...timings].sort((a, b) => {
      const aNanos = Duration.toNanos(a)
      const bNanos = Duration.toNanos(b)
      // Handle infinite durations by sorting them to the end
      if (Option.isNone(aNanos)) return 1
      if (Option.isNone(bNanos)) return -1
      // Handle finite durations
      const diff = aNanos.value - bNanos.value
      return diff > 0n ? 1 : diff < 0n ? -1 : 0
    })

    const finiteTimings = Chunk.fromIterable(sorted.filter((d) => Duration.toNanos(d)._tag === "Some"))
    const n = finiteTimings.length
    if (n === 0) {
      return new MeasurementStats({
        samples: 0,
        mean: Duration.zero,
        variance: Duration.zero,
        stdDev: Duration.zero,
        min: Duration.zero,
        max: Duration.zero,
        median: Duration.zero,
        p95: Duration.zero,
        p99: Duration.zero
      })
    }

    const totalNanos = Chunk.reduce(finiteTimings, 0n, (acc, d) =>
      acc + Duration.toNanos(d).pipe(Option.getOrElse(() =>
        0n
      )))
    const meanNanos = totalNanos / BigInt(n)
    const mean = Duration.nanos(meanNanos)

    // Calculate variance in nanoseconds
    const varianceNanos = Chunk.reduce(finiteTimings, 0n, (acc, d) => {
      const diff = Duration.toNanos(d).pipe(Option.getOrElse(() => 0n)) - meanNanos
      return acc + diff * diff
    }) / BigInt(n)

    const stdDevNanos = BigInt(Math.floor(Math.sqrt(Number(varianceNanos))))
    const stdDev = Duration.nanos(stdDevNanos)

    const min = sorted[0]
    const max = sorted[n - 1]
    const median = sorted[Math.floor(n / 2)]
    const p95 = sorted[Math.floor(n * 0.95)]
    const p99 = sorted[Math.floor(n * 0.99)]

    return new MeasurementStats({
      samples: n,
      mean,
      variance: Duration.nanos(varianceNanos),
      stdDev,
      min,
      max,
      median,
      p95,
      p99
    })
  })
