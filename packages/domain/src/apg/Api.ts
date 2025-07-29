import type { Schema } from "effect"
import type { Edge, EdgeLabel } from "./Edge.js"
import type { Graph, GraphSchema } from "./Graph.js"
import type { Vertex, VertexLabel } from "./Vertex.js"

export interface EdgeRule {
  from: VertexLabel
  to: VertexLabel
}

export interface SchemaRegistry {
  vertices: Record<string, Schema.Schema<any, any, any>>
  edges: Record<string, {
    schema: Schema.Schema<any, any, any>
    rule: EdgeRule
  }>
}

export type ExtractVertexValue<S> = S extends Schema.Schema<infer A, any, any> ? A : never

export type ExtractEdgeValue<S> = S extends { schema: Schema.Schema<infer A, any, any> } ? A : never

export interface APGApi<
  Registry extends SchemaRegistry = {
    vertices: Record<string, Schema.Schema<any, any, any>>
    edges: Record<string, { schema: Schema.Schema<any, any, any>; rule: EdgeRule }>
  }
> {
  // Schemas
  readonly VertexSchema: Schema.Schema<Vertex<any, any>>
  readonly EdgeSchema: Schema.Schema<Edge<any, any>>
  readonly graph: ReturnType<typeof GraphSchema>

  // Core constructors
  readonly empty: () => Graph<never, never>
  readonly vertex: <V extends Vertex<any, any>>(v: V) => Graph<V, never>
  readonly overlay: <V1, E1, V2, E2>(
    left: Graph<V1, E1>,
    right: Graph<V2, E2>
  ) => Graph<V1 | V2, E1 | E2>
  readonly connect: <
    L extends keyof Registry["edges"] & EdgeLabel,
    V,
    E extends Edge<V, L>,
    VL extends Vertex<any, Registry["edges"][L]["rule"]["from"] & VertexLabel>,
    EL,
    VR extends Vertex<any, Registry["edges"][L]["rule"]["to"] & VertexLabel>,
    ER
  >(
    left: Graph<VL, EL>,
    right: Graph<VR, ER>,
    edge: E
  ) => Graph<VL | VR, EL | ER | E>

  // Typed vertex constructors
  readonly vertices: {
    [K in keyof Registry["vertices"]]: (
      value: ExtractVertexValue<Registry["vertices"][K]>
    ) => Vertex<ExtractVertexValue<Registry["vertices"][K]>, K & VertexLabel>
  }

  // Typed edge constructors
  readonly edges: {
    [K in keyof Registry["edges"]]: (
      value: ExtractEdgeValue<Registry["edges"][K]>
    ) => Edge<ExtractEdgeValue<Registry["edges"][K]>, K & EdgeLabel>
  }
}
