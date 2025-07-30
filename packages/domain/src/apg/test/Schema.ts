/**
 * @since 1.0.0
 */
import type { Effect } from "effect"
import { Data } from "effect"
import type * as Graph from "../Graph.js"

/**
 * A discriminated union of specifications for generating different graph structures.
 * @since 1.0.0
 * @category schemas
 */
export type GraphSpec = PathSpec | CliqueSpec | StarSpec

/**
 * @since 1.0.0
 * @category schemas
 */
export class PathSpec extends Data.TaggedClass("PathSpec")<{
  readonly size: number
}> {}

/**
 * @since 1.0.0
 * @category schemas
 */
export class CliqueSpec extends Data.TaggedClass("CliqueSpec")<{
  readonly size: number
}> {}

/**
 * @since 1.0.0
 * @category schemas
 */
export class StarSpec extends Data.TaggedClass("StarSpec")<{
  readonly center: number
  readonly leaves: number
}> {}

/**
 * A declarative representation of a single benchmark.
 * It contains a `label`, a `spec` for data generation, and the `operation` to measure.
 * @since 1.0.0
 * @category schemas
 */
export class Benchmark<A, E, R> extends Data.Class<{
  readonly label: string
  readonly spec: GraphSpec
  readonly operation: (graph: Graph.Graph<A>) => Effect.Effect<unknown, E, R>
}> {}

/**
 * A suite of benchmarks that can be run together.
 * @since 1.0.0
 * @category schemas
 */
export class BenchmarkSuite<A, E, R> extends Data.Class<{
  readonly name: string
  readonly benchmarks: ReadonlyArray<Benchmark<A, E, R>>
}> {}
