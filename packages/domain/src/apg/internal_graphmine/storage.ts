import type { Effect, MutableHashMap, Stream } from "effect"
import type { Edge } from "../internal/edge.js"
import type { EdgeId, EdgeLabel, VertexId, VertexLabel } from "./layer/storage.js"

export interface GraphStorage<A> {
  readonly update: (f: (storage: GraphStorage<A>) => GraphStorage<A>) => Effect.Effect<void>
  readonly vertices: MutableHashMap.MutableHashMap<VertexId, A>
  readonly outgoingEdges: MutableHashMap.MutableHashMap<VertexId, Edge<A>>
  readonly incomingEdges: MutableHashMap.MutableHashMap<VertexId, Edge<A>>
  readonly edges: MutableHashMap.MutableHashMap<EdgeId, Edge<A>>

  readonly verticesByLabel: MutableHashMap.MutableHashMap<VertexLabel, VertexId>
  readonly edgesByLabel: MutableHashMap.MutableHashMap<EdgeLabel, Edge<A>>
  readonly propertyIndex: MutableHashMap.MutableHashMap<string, VertexId>

  streamVertices: (predicate?: (vertex: A) => boolean) => Stream.Stream<A>
  streamEdges: (predicate?: (edge: Edge<A>) => boolean) => Stream.Stream<Edge<A>>
}
