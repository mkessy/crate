import type { Brand, HashMap } from "effect"
import type { Edge } from "../../internal/edge.js"

export type VertexId = number & Brand.Brand<"VertexId">
export type VertexLabel = string & Brand.Brand<"VertexLabel">

export type EdgeId = number & Brand.Brand<"EdgeId">
export type EdgeLabel = string & Brand.Brand<"EdgeLabel">

export interface ReadonlyGraphStorage<A> {
  vertices: HashMap.HashMap<VertexId, A>
  outgoingEdges: HashMap.HashMap<VertexId, Edge<A>>
  incomingEdges: HashMap.HashMap<VertexId, Edge<A>>
  edges: HashMap.HashMap<EdgeId, Edge<A>>
  verticesByLabel: HashMap.HashMap<VertexLabel, VertexId>
  edgesByType: HashMap.HashMap<EdgeLabel, Edge<A>>
  propertyIndex: HashMap.HashMap<string, VertexId>

  // storage stats metrics
  // solid usage metrics ? Metric
}
