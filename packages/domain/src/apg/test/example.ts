/**
 * Example usage of the benchmarking utilities
 * @since 1.0.0
 */
import { BunFileSystem, BunPath, BunRuntime } from "@effect/platform-bun"
import { Effect, Layer, pipe } from "effect"
import * as Graph from "../Graph.js"
import { saveBenchmarkCSV } from "./Artifacts.js"
import { BenchmarkRunner, BenchmarkRunnerLive } from "./BenchmarkRunner.js"
import { MeasurementLive } from "./Measurement.js"
import { Benchmark, BenchmarkSuite, CliqueSpec, PathSpec } from "./Schema.js"

// -----------------------------------------------------------------------------
// Benchmark Definitions
// -----------------------------------------------------------------------------

// A suite for benchmarking different graph construction algorithms.
const constructionSuite = new BenchmarkSuite({
  name: "Graph Construction Benchmarks",
  benchmarks: [
    new Benchmark({
      label: "Path (N=100)",
      spec: new PathSpec({ size: 100 }),
      // The operation is a simple identity since data generation is what's being measured.
      operation: (graph) => Effect.succeed(graph)
    }),
    new Benchmark({
      label: "Clique (N=100)",
      spec: new CliqueSpec({ size: 100 }),
      operation: (graph) => Effect.succeed(graph)
    })
  ]
})

// A suite for benchmarking graph analysis functions.
const analysisSuite = new BenchmarkSuite({
  name: "Graph Analysis Benchmarks",
  benchmarks: [
    new Benchmark({
      label: "Vertex Count on Clique (N=200)",
      spec: new CliqueSpec({ size: 400000 }),
      operation: (graph) => Effect.sync(() => Graph.vertexCount(graph))
    }),
    new Benchmark({
      label: "Transitive Closure on Clique (N=200)",
      spec: new CliqueSpec({ size: 400000 }),
      operation: (graph) => Effect.sync(() => Graph.transitive(graph as any))
    })
  ]
})

// -----------------------------------------------------------------------------
// Main Program
// -----------------------------------------------------------------------------

const program = Effect.gen(function*() {
  yield* Effect.logInfo("Starting Graph Algorithm Benchmarks")
  const runner = yield* BenchmarkRunner

  const constructionResults = yield* runner.runSuite(constructionSuite)
  const analysisResults = yield* runner.runSuite(analysisSuite)

  const allResults = [...constructionResults, ...analysisResults]

  yield* Effect.log("All benchmarks completed. Saving results to CSV...")
  yield* saveBenchmarkCSV(allResults)

  return allResults
})

// -----------------------------------------------------------------------------
// Layer Definition
// -----------------------------------------------------------------------------

const AppLayer = Layer.provide(
  BenchmarkRunnerLive,
  Layer.merge(MeasurementLive, BunFileSystem.layer)
)

// -----------------------------------------------------------------------------
// Execution
// -----------------------------------------------------------------------------

const runnable = pipe(
  program,
  Effect.provide(
    [
      AppLayer,
      BunPath.layer,
      BunFileSystem.layer,
      MeasurementLive
    ]
  )
)

if (import.meta.url.startsWith("file://") && import.meta.url.endsWith("example.ts")) {
  BunRuntime.runMain(runnable)
}
