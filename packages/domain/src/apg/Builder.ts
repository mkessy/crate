import { Array, HashMap, HashSet, pipe, Schema } from "effect"
import type { APGApi, EdgeRule, SchemaRegistry } from "./Api.js"
import { type Edge, type EdgeLabel, EdgeSchema, EdgeTypeSchema } from "./Edge.js"
import { Connect, Empty, GraphSchema, MakeVertex as GraphVertex, Overlay } from "./Graph.js"
import { type Vertex, type VertexLabel, VertexSchema, VertexTypeSchema } from "./Vertex.js"

// ============================================================================
// APG Builder with Type-Level Registry
// ============================================================================

const APGBuilderTypeId = Symbol.for("@apg/APGBuilder")
type APGBuilderTypeId = typeof APGBuilderTypeId

// Track vertex and edge info with labels AND schemas at type level
interface VertexInfo<A, I, R, L extends string> {
  label: L
  schema: Schema.Schema<Vertex<A, L & VertexLabel>, Vertex<I, L & VertexLabel>, R>
  valueSchema: Schema.Schema<A, I, R>
}

interface EdgeInfo<A, I, R, L extends string> {
  label: L
  from: string
  to: string
  schema: Schema.Schema<Edge<A, L & EdgeLabel>, Edge<I, L & EdgeLabel>, R>
  valueSchema: Schema.Schema<A, I, R>
}

export interface APGBuilder<
  Labels extends string = never,
  Registry extends SchemaRegistry = {
    vertices: Record<string, Schema.Schema<any, any, any>>
    edges: Record<string, { schema: Schema.Schema<any, any, any>; rule: EdgeRule }>
  }
> {
  readonly [APGBuilderTypeId]: APGBuilderTypeId

  // Add a vertex schema
  readonly addVertex: <A, I, R, L extends string>(
    label: L,
    schema: Schema.Schema<A, I, R>
  ) => APGBuilder<
    Labels | L,
    {
      vertices: Registry["vertices"] & { [K in L]: typeof schema }
      edges: Registry["edges"]
    }
  >

  // Add an edge schema with vertex constraints
  readonly addEdge: <
    A,
    I,
    R,
    L extends string,
    From extends Labels,
    To extends Labels
  >(
    label: L,
    schema: Schema.Schema<A, I, R>,
    from: From,
    to: To
  ) => APGBuilder<
    Labels | L,
    {
      vertices: Registry["vertices"]
      edges: Registry["edges"] & { [K in L]: { schema: typeof schema; rule: { from: From; to: To } } }
    }
  >

  // Build the final API
  readonly build: () => APGApi<Registry>
}

// ============================================================================
// Implementation
// ============================================================================

interface BuilderState {
  vertices: HashMap.HashMap<string, VertexInfo<any, any, any, any>>
  edges: HashMap.HashMap<string, EdgeInfo<any, any, any, any>>
  labels: HashSet.HashSet<string>
}

class APGBuilderImpl<
  Labels extends string = never,
  Registry extends SchemaRegistry = {
    vertices: Record<string, Schema.Schema<any, any, any>>
    edges: Record<string, { schema: Schema.Schema<any, any, any>; rule: EdgeRule }>
  }
> implements APGBuilder<Labels, Registry> {
  readonly [APGBuilderTypeId]: APGBuilderTypeId = APGBuilderTypeId

  constructor(
    private readonly state: BuilderState = {
      vertices: HashMap.empty(),
      edges: HashMap.empty(),
      labels: HashSet.empty()
    }
  ) {}

  addVertex<A, I, R, L extends string>(
    label: L,
    schema: Schema.Schema<A, I, R>
  ): APGBuilder<
    Labels | L,
    {
      vertices: Registry["vertices"] & { [K in L]: typeof schema }
      edges: Registry["edges"]
    }
  > {
    const vertexLabel = label as (L & VertexLabel)
    const vertexSchema = VertexTypeSchema(vertexLabel, schema)

    const vertexInfo: VertexInfo<A, I, R, L> = {
      label,
      schema: vertexSchema,
      valueSchema: schema
    }

    return new APGBuilderImpl<Labels | L, {
      vertices: Registry["vertices"] & { [K in L]: typeof schema }
      edges: Registry["edges"]
    }>({
      vertices: HashMap.set(this.state.vertices, label, vertexInfo),
      edges: this.state.edges,
      labels: HashSet.add(this.state.labels, label)
    })
  }

  addEdge<
    A,
    I,
    R,
    L extends string,
    From extends Labels,
    To extends Labels
  >(
    label: L,
    schema: Schema.Schema<A, I, R>,
    from: From,
    to: To
  ): APGBuilder<
    Labels | L,
    {
      vertices: Registry["vertices"]
      edges: Registry["edges"] & { [K in L]: { schema: typeof schema; rule: { from: From; to: To } } }
    }
  > {
    const edgeLabel = label as (L & EdgeLabel)
    const fromLabel = from as unknown as VertexLabel
    const toLabel = to as unknown as VertexLabel
    const edgeSchema = EdgeTypeSchema(edgeLabel, schema, fromLabel, toLabel)

    const edgeInfo: EdgeInfo<A, I, R, L> = {
      label,
      from,
      to,
      schema: edgeSchema,
      valueSchema: schema
    }

    return new APGBuilderImpl<Labels | L, {
      vertices: Registry["vertices"]
      edges: Registry["edges"] & { [K in L]: { schema: typeof schema; rule: { from: From; to: To } } }
    }>({
      vertices: this.state.vertices,
      edges: HashMap.set(this.state.edges, label, edgeInfo),
      labels: HashSet.add(this.state.labels, label)
    })
  }

  build(): APGApi<Registry> {
    // Extract schemas from HashMaps
    const vertexSchemas = Array.fromIterable(HashMap.values(this.state.vertices)).map((v) => v.schema)
    const edgeSchemas = Array.fromIterable(HashMap.values(this.state.edges)).map((e) => e.schema)

    // Create union schemas
    const VertexUnion = Schema.Union(...vertexSchemas) as Schema.Union<ReadonlyArray<Schema.Schema<Vertex<any, any>>>>
    const EdgeUnion = Schema.Union(...edgeSchemas) as Schema.Union<ReadonlyArray<Schema.Schema<Edge<any, any>>>>

    // Create the recursive graph schema
    const graphSchema = GraphSchema(VertexUnion, EdgeUnion)

    // Create vertex constructors with proper typing
    const vertices = pipe(
      this.state.vertices,
      HashMap.reduce({} as any, (acc, vertexInfo, key) => {
        const label = vertexInfo.label as VertexLabel
        acc[key] = (value: any) => VertexSchema.make({ label, value })
        return acc
      })
    )

    // Create edge constructors with proper typing
    const edges = pipe(
      this.state.edges,
      HashMap.reduce({} as any, (acc, edgeInfo, key) => {
        const label = edgeInfo.label as EdgeLabel
        const from = edgeInfo.from as VertexLabel
        const to = edgeInfo.to as VertexLabel
        acc[key] = (value: any) => EdgeSchema.make({ label, from, to, value })
        return acc
      })
    )

    return {
      VertexSchema: VertexUnion,
      EdgeSchema: EdgeUnion,
      graph: graphSchema,
      empty: Empty,
      vertex: GraphVertex,
      overlay: Overlay,
      connect: Connect as any,
      vertices,
      edges
    }
  }

  pipe<B>(f: (a: this) => B): B {
    return f(this)
  }
}

// ============================================================================
// Public API
// ============================================================================

export const APGBuilder = {
  make: (): APGBuilder<
    never,
    {
      vertices: Record<string, Schema.Schema<any, any, any>>
      edges: Record<string, { schema: Schema.Schema<any, any, any>; rule: EdgeRule }>
    }
  > => new APGBuilderImpl()
}
