/**
 * @since 1.0.0
 */
import { Effect, Match } from "effect"
import * as Graph from "../Graph.js"
import type * as Schema from "./Schema.js"

const generateNumbers = (n: number) => Array.from({ length: n }, (_, i) => i)

/**
 * Generates a `Graph.Graph<number>` from a `GraphSpec`.
 * This function is effectful to allow for potential async or complex generation logic.
 * @since 1.0.0
 * @category generators
 */
export const fromSpec = (spec: Schema.GraphSpec): Effect.Effect<Graph.Graph<number>> =>
  Effect.sync(() =>
    Match.value(spec).pipe(
      Match.tag("PathSpec", ({ size }) => Graph.path(generateNumbers(size))),
      Match.tag("CliqueSpec", ({ size }) => Graph.clique(generateNumbers(size))),
      Match.tag("StarSpec", ({ center, leaves }) => Graph.star(center, generateNumbers(leaves - 1).map((i) => i + 1))),
      Match.exhaustive
    )
  )
