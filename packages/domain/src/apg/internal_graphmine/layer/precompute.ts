import type { NodeId } from "./algebraic_property.js"

export interface PrecomputedStructures {
  readonly triangleCountsPerVertex: ReadonlyMap<NodeId, number>
  readonly degeneracyOrdering: ReadonlyArray<NodeId>
  readonly coreNumbers: ReadonlyMap<NodeId, number>
  readonly twoHopNeighbors: ReadonlyMap<NodeId, ReadonlySet<NodeId>>
}

export interface PrecomputedIndices {
  readonly degeneracyOrder: ReadonlyArray<NodeId>
  readonly nodesByDegree: ReadonlyMap<number, ReadonlySet<NodeId>>
  readonly triangleCounts: ReadonlyMap<NodeId, number>
}
