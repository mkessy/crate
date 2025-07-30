/**
 * @since 1.0.0
 */
import { Context, Effect, Layer } from "effect"
import * as Generator from "./Generator.js"
import { Measurement, type MeasurementResult } from "./Measurement.js"
import type * as Schema from "./Schema.js"

/**
 * The interface for our new runner service
 * @since 1.0.0
 * @category services
 */
export interface BenchmarkRunner {
  readonly runSuite: <A, E>(
    suite: Schema.BenchmarkSuite<A, E, never>
  ) => Effect.Effect<ReadonlyArray<MeasurementResult>, E, never | Measurement.Service>
}

/**
 * @since 1.0.0
 * @category tags
 */
export const BenchmarkRunner = Context.GenericTag<BenchmarkRunner>(
  "@apg/test/BenchmarkRunner"
)

/**
 * The live implementation of the runner
 * @since 1.0.0
 * @category layers
 */
export const BenchmarkRunnerLive = Layer.succeed(
  BenchmarkRunner,
  BenchmarkRunner.of({
    runSuite: <A, E>(suite: Schema.BenchmarkSuite<A, E, never>) =>
      Effect.gen(function*() {
        yield* Effect.logInfo(`Running benchmark suite: ${suite.name}`)

        const measurementService = yield* Measurement

        // Use Effect.forEach for declarative, concurrent execution
        const results = yield* Effect.forEach(
          suite.benchmarks,
          (benchmark) =>
            Effect.gen(function*() {
              yield* Effect.log(`Generating data for: ${benchmark.label}`)
              const graph = yield* Generator.fromSpec(benchmark.spec)

              // The common interface: measure the provided operation
              return yield* measurementService.measure(
                benchmark.label,
                benchmark.operation(graph as any), // Apply the operation to the generated graph
                { samples: 100, warmupSamples: 10 }
              )
            }),
          { concurrency: "inherit" } // or a fixed number e.g., { concurrency: 4 }
        )

        yield* Effect.logInfo(`Finished suite: ${suite.name}`)
        return results
      })
  })
)
