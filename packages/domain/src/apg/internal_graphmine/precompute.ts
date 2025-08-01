import { Context, type Effect, type Option, type Stream } from "effect"
import type { NodeId } from "./algebraic_property.js"
import type { View } from "./view.js"

export interface PrecomputedStructures {
  readonly triangleCountsPerVertex: Option.Option<ReadonlyMap<NodeId, number>>
  readonly coreNumbers: Option.Option<ReadonlyMap<NodeId, number>>
  readonly twoHopNeighbors: Option.Option<ReadonlyMap<NodeId, ReadonlySet<NodeId>>>
}

export interface PrecomputedOrdering {
  readonly kind: OrderingKind
  readonly ordering: ReadonlyArray<NodeId>
  readonly precomputedStructures: PrecomputedStructures
}

export class Precompute extends Context.Tag("Precompute")<Precompute, {
  readonly precomputedStructures: PrecomputedStructures | undefined

  // Exact degeneracy ordering - O(n) iterations
  readonly degeneracyOrder: Stream.Stream<NodeId>

  // Approximate degeneracy - O(log n) iterations!
  readonly approximateDegeneracyOrder: (epsilon: number) => Stream.Stream<NodeId>

  // Simple degree ordering
  readonly degreeOrder: Stream.Stream<NodeId>

  // Triangle count ordering
  readonly triangleCountOrder: Stream.Stream<NodeId>

  // Apply ordering to create reordered view
  readonly getOrdering: (kind: OrderingKind) => Stream.Stream<NodeId>
  readonly applyOrdering: (ordering: Stream.Stream<NodeId>) => Effect.Effect<View<Node>>

  hasOrdering: (kind: OrderingKind) => boolean
}>() {}

export type OrderingKind = "DegeneracyOrder" | "DegreeOrder" | "TriangleCountOrder"

export interface ComputedIndex {
  readonly kind: OrderingKind
}
