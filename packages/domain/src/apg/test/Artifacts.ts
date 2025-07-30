/**
 * @since 1.0.0
 */
import { FileSystem, Path } from "@effect/platform"
import { Duration, Effect, Metric, Option, pipe } from "effect"
import { Measurement, type MeasurementResult } from "./Measurement.js"

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const ARTIFACTS_DIR = ".artifacts/benchmarks"

// -----------------------------------------------------------------------------
// Artifact Writers
// -----------------------------------------------------------------------------

/**
 * Saves a measurement result to a JSON file
 * @since 1.0.0
 * @category artifacts
 */
export const saveMeasurementResult = (
  result: MeasurementResult
) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${result.name.replace(/\s+/g, "_")}_${timestamp}.json`
    const filepath = path.join(ARTIFACTS_DIR, filename)

    // Ensure directory exists
    yield* fs.makeDirectory(ARTIFACTS_DIR, { recursive: true })

    // Convert to JSON-serializable format
    const data = yield* toSerializable(result)
    const json = JSON.stringify(data, null, 2)

    yield* fs.writeFileString(filepath, json)
    yield* Effect.logInfo(`Saved benchmark artifact to ${filepath}`)
  })

/**
 * Saves comparison results with additional analysis
 * @since 1.0.0
 * @category artifacts
 */
export const saveComparisonResult = (comparison: {
  readonly baseline: MeasurementResult
  readonly candidate: MeasurementResult
  readonly speedup: number
}) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `comparison_${timestamp}.json`
    const filepath = path.join(ARTIFACTS_DIR, filename)

    yield* fs.makeDirectory(ARTIFACTS_DIR, { recursive: true })

    const data = yield* Effect.all({
      timestamp: Effect.succeed(new Date().toISOString()),
      baseline: toSerializable(comparison.baseline),
      candidate: toSerializable(comparison.candidate),
      speedup: Effect.succeed(comparison.speedup),
      summary: Effect.succeed({
        baselineMean: durationToMillis(comparison.baseline.stats.mean),
        candidateMean: durationToMillis(comparison.candidate.stats.mean),
        improvement: `${((comparison.speedup - 1) * 100).toFixed(1)}%`
      })
    })

    const json = JSON.stringify(data, null, 2)
    yield* fs.writeFileString(filepath, json)
    yield* Effect.logInfo(`Saved comparison artifact to ${filepath}`)
  })

/**
 * Generate a CSV file for easy import into spreadsheet tools
 * @since 1.0.0
 * @category artifacts
 */
export const saveBenchmarkCSV = (
  results: ReadonlyArray<MeasurementResult>
) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filepath = path.join(ARTIFACTS_DIR, `results_${timestamp}.csv`)

    yield* fs.makeDirectory(ARTIFACTS_DIR, { recursive: true })

    const header = [
      "name",
      "samples",
      "mean_ms",
      "stddev_ms",
      "min_ms",
      "max_ms",
      "median_ms",
      "p95_ms",
      "p99_ms"
    ].join(",")

    const rows = results.map((result) =>
      [
        result.name,
        result.stats.samples,
        durationToMillis(result.stats.mean).toFixed(3),
        durationToMillis(result.stats.stdDev).toFixed(3),
        durationToMillis(result.stats.min).toFixed(3),
        durationToMillis(result.stats.max).toFixed(3),
        durationToMillis(result.stats.median).toFixed(3),
        durationToMillis(result.stats.p95).toFixed(3),
        durationToMillis(result.stats.p99).toFixed(3)
      ].join(",")
    )

    const csv = [header, ...rows].join("\n")
    yield* fs.writeFileString(filepath, csv)
    yield* Effect.logInfo(`Saved CSV artifact to ${filepath}`)
  })

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

const durationToMillis = (d: Duration.Duration): number => {
  const nanos = Duration.toNanos(d)
  return Option.match(nanos, {
    onNone: () => Infinity,
    onSome: (n) => Number(n) / 1_000_000
  })
}

const toSerializable = (result: MeasurementResult) =>
  Effect.gen(function*() {
    const histogramState = yield* Metric.value(result.histogram)
    return {
      name: result.name,
      stats: {
        samples: result.stats.samples,
        mean_ms: durationToMillis(result.stats.mean),
        variance_ms: durationToMillis(result.stats.variance),
        stdDev_ms: durationToMillis(result.stats.stdDev),
        min_ms: durationToMillis(result.stats.min),
        max_ms: durationToMillis(result.stats.max),
        median_ms: durationToMillis(result.stats.median),
        p95_ms: durationToMillis(result.stats.p95),
        p99_ms: durationToMillis(result.stats.p99)
      },
      timings_ms: result.timings.map(durationToMillis),
      histogram: {
        buckets: histogramState.buckets,
        count: histogramState.count,
        min: histogramState.min,
        max: histogramState.max,
        sum: histogramState.sum
      }
    }
  })

// -----------------------------------------------------------------------------
// Composition Helpers
// -----------------------------------------------------------------------------

/**
 * Run a measurement and automatically save artifacts
 * @since 1.0.0
 * @category composition
 */
export const measureWithArtifacts = <A, E>(
  label: string,
  effect: Effect.Effect<A, E, never>,
  options?: Parameters<Measurement.Service["measure"]>[2]
) =>
  Effect.flatMap(Measurement, (service) =>
    pipe(
      service.measure(label, effect, options),
      Effect.tap(saveMeasurementResult)
    ))

/**
 * Compare two implementations and save results
 * @since 1.0.0
 * @category composition
 */
export const compareWithArtifacts = <A, E>(
  baseline: { label: string; effect: Effect.Effect<A, E, never> },
  candidate: { label: string; effect: Effect.Effect<A, E, never> },
  options?: Parameters<Measurement.Service["compare"]>[2]
) =>
  Effect.flatMap(Measurement, (service) =>
    pipe(
      service.compare(baseline, candidate, options),
      Effect.tap(saveComparisonResult)
    ))
