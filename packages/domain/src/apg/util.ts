import type { Edge } from "./Edge.js"
import type { Graph } from "./Graph.js"
import type { Vertex } from "./Vertex.js"

// ============================================================================
// Label Extraction Utility Types
// ============================================================================

export type GetVertexLabels<G extends Graph<any, any>> = G extends Graph<infer V, any> ?
  V extends Vertex<any, infer L> ? L
  : never
  : never

export type GetEdgeLabels<G extends Graph<any, any>> = G extends Graph<any, infer E> ? E extends Edge<any, infer L> ? L
  : never
  : never
