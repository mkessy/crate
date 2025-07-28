import type { Schema } from "effect"
import type { Edge, EdgeLabel } from "./Edge.js"
import type { Graph, GraphSchema } from "./Graph.js"
import type { Vertex, VertexLabel } from "./Vertex.js"

// ============================================================================
// Type-Level Schema Registry
// ============================================================================

// This interface will accumulate type information as we build
export interface SchemaRegistry {
  vertices: Record<string, Schema.Schema<any, any, any>>
  edges: Record<string, Schema.Schema<any, any, any>>
}

// Extract the "Type" from a vertex value schema
export type ExtractVertexValue<S> = S extends Schema.Schema<infer A, any, any> ? A : never

// Extract the "Type" from an edge value schema
export type ExtractEdgeValue<S> = S extends Schema.Schema<infer A, any, any> ? A : never

// ============================================================================
// Final API
// ============================================================================

// The final API interface with typed constructors
export interface APGApi<
  Registry extends SchemaRegistry = {
    vertices: Record<string, Schema.Schema<any, any, any>>
    edges: Record<string, Schema.Schema<any, any, any>>
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
  readonly connect: <V1, E1, V2, E2, E3>(
    left: Graph<V1, E1>,
    right: Graph<V2, E2>,
    edge: E3
  ) => Graph<V1 | V2, E1 | E2 | E3>

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
