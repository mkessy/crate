import { Context, type Effect, type HashMap, type Option, type Stream } from "effect"
import type { Edge } from "../internal/edge.js"
import type { NodeId } from "./algebraic_property.js"

export interface BKConfig {
  readonly maxCliqueSize: number
  readonly minCliqueSize: number
}

export interface BKClique<A> {
  readonly nodes: ReadonlySet<NodeId>
  readonly edges: ReadonlySet<Edge<A>>
}

export interface Path {
  readonly nodes: ReadonlySet<NodeId>
  readonly edges: ReadonlySet<Edge<any>>
}

export class GraphAlgorithms extends Context.Tag("GraphAlgorithms")<GraphAlgorithms, {
  // Pattern matching

  readonly star: (node: NodeId) => Effect.Effect<BKClique<any>>

  readonly bronKerbosch: (config?: BKConfig) => Stream.Stream<BKClique<any>>
  readonly kCliqueListing: (k: number) => Stream.Stream<BKClique<any>>
  readonly triangleCounting: () => Effect.Effect<number>

  // Graph traversal (stack-safe via Effect.loop)
  readonly bfs: (start: NodeId) => Stream.Stream<Node>
  readonly dfs: (start: NodeId) => Stream.Stream<Node>
  readonly shortestPath: (from: NodeId, to: NodeId) => Effect.Effect<Option.Option<Path>>

  // Analysis
  readonly pageRank: (iterations: number) => Effect.Effect<HashMap.HashMap<NodeId, number>>
  readonly degreeDistributiona: Effect.Effect<HashMap.HashMap<number, number>>
}>() {}
