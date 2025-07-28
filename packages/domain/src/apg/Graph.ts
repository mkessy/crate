import { Schema } from "effect"
import type * as GraphEdge from "./Edge.js"
import type * as GraphVertex from "./Vertex.js"

// ============================================================================
// Graph ADT
// ============================================================================

export type Graph<V, E> =
  | { readonly _tag: "Empty" }
  | { readonly _tag: "Vertex"; readonly value: V }
  | {
    readonly _tag: "Overlay"
    readonly left: Graph<V, E>
    readonly right: Graph<V, E>
  }
  | {
    readonly _tag: "Connect"
    readonly left: Graph<V, E>
    readonly right: Graph<V, E>
    readonly edge: E
  }

export const GraphSchema = <V extends GraphVertex.Vertex<any, any>, E extends GraphEdge.Edge<any, any>>(
  vertexSchema: Schema.Schema<V>,
  edgeSchema: Schema.Schema<E>
): {
  graph: Schema.Schema<Graph<V, E>>
  Empty: Schema.Schema<Graph<V, E>>
  Vertex: Schema.Schema<Graph<V, E>>
  Overlay: Schema.Schema<Graph<V, E>>
  Connect: Schema.Schema<Graph<V, E>>
} => {
  const ConnectSchema = Schema.Struct({
    _tag: Schema.Literal("Connect"),
    left: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph),
    right: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph),
    edge: edgeSchema
  }).pipe(Schema.annotations({
    identifier: "Graph::Connect",
    title: "Connect",
    description: "An edge"
  }))

  const OverlaySchema = Schema.Struct({
    _tag: Schema.Literal("Overlay"),
    left: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph),
    right: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph)
  }).pipe(Schema.annotations({
    identifier: "Graph::Overlay",
    title: "Overlay",
    description: "An overlay of two graphs"
  }))

  const VertexSchema = Schema.Struct({
    _tag: Schema.Literal("Vertex"),
    value: vertexSchema
  }).pipe(Schema.annotations({
    identifier: "Graph::Vertex",
    title: "Vertex",
    description: "A vertex in the graph"
  }))

  const EmptySchema = Schema.Struct({
    _tag: Schema.Literal("Empty")
  }).pipe(Schema.annotations({
    identifier: "Graph::Empty",
    title: "Empty",
    description: "An empty graph"
  }))

  type GraphSchema = Schema.Schema.Type<typeof graph>
  const graph: Schema.Schema<Graph<V, E>> = Schema.Union(
    EmptySchema,
    VertexSchema,
    OverlaySchema,
    ConnectSchema
  ).annotations({
    identifier: "Graph",
    title: "Graph",
    description: "An algebraic property graph"
  })

  return {
    graph: graph as Schema.Schema<GraphSchema>,
    Empty: EmptySchema as Schema.Schema<GraphSchema>,
    Vertex: VertexSchema as Schema.Schema<GraphSchema>,
    Overlay: OverlaySchema as Schema.Schema<GraphSchema>,
    Connect: ConnectSchema as Schema.Schema<GraphSchema>
  }
}

// Helper constructors for Graph variants
export const Empty = (): Graph<never, never> => ({ _tag: "Empty" })
export const MakeVertex = <V>(value: V): Graph<V, never> => ({ _tag: "Vertex", value })
export const Overlay = <V1, E1, V2, E2>(
  left: Graph<V1, E1>,
  right: Graph<V2, E2>
): Graph<V1 | V2, E1 | E2> => ({
  _tag: "Overlay",
  left,
  right
})
export const Connect = <V1, E1, V2, E2, E3>(
  left: Graph<V1, E1>,
  right: Graph<V2, E2>,
  edge: E3
): Graph<V1 | V2, E1 | E2 | E3> => ({
  _tag: "Connect",
  left,
  right,
  edge
})
