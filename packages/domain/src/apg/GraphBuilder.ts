import type { Data } from "effect"
import { Brand, HashMap, ParseResult, pipe, Schema, SchemaAST } from "effect"
import type { NonEmptyReadonlyArray } from "effect/Array"

// ============================================================================
// Type IDs and Brands
// ============================================================================

const VertexTypeId = Symbol.for("@apg/Vertex")
type VertexTypeId = typeof VertexTypeId

const EdgeTypeId = Symbol.for("@apg/Edge")
type EdgeTypeId = typeof EdgeTypeId

const VertexLabel = Schema.NonEmptyTrimmedString.pipe(Schema.brand("VertexLabel"))
type VertexLabel = Schema.Schema.Type<typeof VertexLabel>

const EdgeLabel = Schema.NonEmptyTrimmedString.pipe(Schema.brand("EdgeLabel"))
type EdgeLabel = Schema.Schema.Type<typeof EdgeLabel>

// ============================================================================
// Vertex Type Constructor using Schema.declare
// ============================================================================

interface Vertex<V> extends Schema.Schema.Type<typeof VertexSchema> {
  readonly label: VertexLabel
  readonly value: V
}

class VertexSchema extends Schema.TaggedClass<VertexSchema>("Vertex")("Vertex", {
  label: Schema.propertySignature(VertexLabel).pipe(Schema.fromKey("label")),
  value: Schema.Any
}, {
  identifier: `Vertex`,
  title: `Vertex`,
  description: `A vertex in the algebraic property graph with a value`
}) {
  readonly [VertexTypeId]: VertexTypeId = VertexTypeId
}

export type VertexType<A, I, R> = Schema.Schema.Type<typeof VertexTypeSchema<A, I, R>>

export const VertexTypeSchema = <A, I, R>(
  label: VertexLabel,
  vertexValueSchema: Schema.Schema<A, I, R>
): Schema.Schema<Vertex<A>, Vertex<I>, R> =>
  Schema.declare(
    [vertexValueSchema],
    {
      decode: (vertexValueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(VertexSchema)(input) && input._tag === "Vertex") {
          const value = ParseResult.decodeUnknown(vertexValueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) => VertexSchema.make({ label, value }) as Vertex<A>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      },
      encode: (valueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(VertexSchema)(input) && input._tag === "Vertex") {
          const value = ParseResult.encodeUnknown(valueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) => VertexSchema.make({ label, value }) as Vertex<I>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      }
    },
    {
      identifier: `Vertex<${label}>`,
      title: `Vertex<${label}>`,
      description: `Vertex<${Schema.format(vertexValueSchema)}>`
    }
  )

// ============================================================================
// Edge Type Constructor using Schema.declare
// ============================================================================

export interface Edge<V> extends Schema.Schema.Type<typeof EdgeSchema> {
  readonly label: EdgeLabel
  readonly from: VertexLabel
  readonly to: VertexLabel
  readonly value: V
}

class EdgeSchema extends Schema.TaggedClass<EdgeSchema>("Edge")("Edge", {
  label: Schema.propertySignature(EdgeLabel).pipe(Schema.fromKey("label")),
  from: VertexLabel,
  to: VertexLabel,
  value: Schema.Any
}, {
  identifier: `Edge`,
  title: `Edge`,
  description: `An edge in the algebraic property graph with a value`
}) {
  readonly [EdgeTypeId]: EdgeTypeId = EdgeTypeId
}

export const EdgeTypeSchema = <A, I, R>(
  label: EdgeLabel,
  valueSchema: Schema.Schema<A, I, R>,
  from: VertexLabel,
  to: VertexLabel
): Schema.Schema<Edge<A>, Edge<I>, R> =>
  Schema.declare(
    [valueSchema],
    {
      decode: (valueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(EdgeSchema)(input) && input._tag === "Edge") {
          const value = ParseResult.decodeUnknown(valueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) =>
              EdgeSchema.make({
                label,
                from,
                to,
                value: value as A
              }) as Edge<A>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      },
      encode: (valueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(EdgeSchema)(input) && input._tag === "Edge") {
          const value = ParseResult.encodeUnknown(valueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) =>
              EdgeSchema.make({
                label,
                from,
                to,
                value: value as I
              }) as Edge<I>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      }
    },
    {
      identifier: `Edge<${label}>`,
      title: `Edge<${label}>`,
      description: `Edge<${Schema.format(valueSchema)}> from ${from} to ${to}`
    }
  )

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

export const GraphSchema = <V extends Vertex<any>, E extends Edge<any>>(
  vertexSchema: Schema.Schema<V>,
  edgeSchema: Schema.Schema<E>
): Schema.Schema<Graph<V, E>> => {
  const graph: Schema.Schema<Graph<V, E>> = Schema.Union(
    // Empty variant
    Schema.Struct({
      _tag: Schema.Literal("Empty")
    }).pipe(Schema.annotations({
      identifier: "Graph::Empty",
      title: "Empty",
      description: "An empty graph"
    })),
    // Vertex variant
    Schema.Struct({
      _tag: Schema.Literal("Vertex"),
      value: vertexSchema
    }).pipe(Schema.annotations({
      identifier: "Graph::Vertex",
      title: "Vertex",
      description: "A vertex in the graph"
    })),
    // Overlay variant
    Schema.Struct({
      _tag: Schema.Literal("Overlay"),
      left: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph),
      right: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph)
    }).pipe(Schema.annotations({
      identifier: "Graph::Overlay",
      title: "Overlay",
      description: "An overlay of two graphs"
    })),
    // Connect variant
    Schema.Struct({
      _tag: Schema.Literal("Connect"),
      left: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph),
      right: Schema.suspend((): Schema.Schema<Graph<V, E>> => graph),
      edge: edgeSchema
    }).pipe(Schema.annotations({
      identifier: "Graph::Connect",
      title: "Connect",
      description: "A connect of two graphs"
    }))
  ).annotations({
    identifier: "Graph",
    title: "Graph",
    description: "An algebraic property graph"
  })

  return graph
}

// Helper constructors for Graph variants
export const Empty = (): Graph<any, any> => ({ _tag: "Empty" })
export const Vertex = <V>(value: V): Graph<V, any> => ({ _tag: "Vertex", value })
export const Overlay = <V, E>(left: Graph<V, E>, right: Graph<V, E>): Graph<V, E> => ({
  _tag: "Overlay",
  left,
  right
})
export const Connect = <V, E>(left: Graph<V, E>, right: Graph<V, E>, edge: E): Graph<V, E> => ({
  _tag: "Connect",
  left,
  right,
  edge
})

// ============================================================================
// APG Builder
// ============================================================================

const APGBuilderTypeId = Symbol.for("@apg/APGBuilder")
type APGBuilderTypeId = typeof APGBuilderTypeId

// Track vertex and edge info with labels
interface VertexInfo {
  label: string
  schema: Schema.Schema<Vertex<any>>
}

interface EdgeInfo {
  label: string
  from: string
  to: string
  schema: Schema.Schema<Edge<any>>
}

export interface APGBuilder<Labels extends string = never> {
  readonly [APGBuilderTypeId]: APGBuilderTypeId

  // Add a vertex schema
  readonly addVertex: <A, I, R, L extends string>(
    label: L,
    schema: Schema.Schema<A, I, R>
  ) => APGBuilder<Labels | L>

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
  ) => APGBuilder<Labels | L>

  // Build the final API
  readonly build: () => APGApi<Labels>
}

// The final API interface
export interface APGApi<Labels extends string = never> {
  // Schemas
  readonly VertexSchema: Schema.Schema<Vertex<any>>
  readonly EdgeSchema: Schema.Schema<Edge<any>>
  readonly GraphSchema: Schema.Schema<Graph<Vertex<any>, Edge<any>>>

  // Core constructors
  readonly empty: () => Graph<any, any>
  readonly vertex: <V extends Vertex<any>>(v: V) => Graph<V, any>
  readonly overlay: <V, E>(left: Graph<V, E>, right: Graph<V, E>) => Graph<V, E>
  readonly connect: <V, E>(left: Graph<V, E>, right: Graph<V, E>, edge: E) => Graph<V, E>

  // Typed vertex constructors
  readonly vertices: {
    [K in Labels]: (value: any) => Vertex<any>
  }

  // Typed edge constructors
  readonly edges: {
    [K in Labels]: (value: any) => Edge<any>
  }
}

// ============================================================================
// Implementation
// ============================================================================

interface BuilderState {
  vertices: Array<VertexInfo>
  edges: Array<EdgeInfo>
  labels: Set<string>
}

class APGBuilderImpl<Labels extends string = never> implements APGBuilder<Labels> {
  readonly [APGBuilderTypeId]: APGBuilderTypeId = APGBuilderTypeId

  constructor(
    private readonly state: BuilderState = {
      vertices: [],
      edges: [],
      labels: new Set()
    }
  ) {}

  addVertex<A, I, R, L extends string>(
    label: L,
    schema: Schema.Schema<A, I, R>
  ): APGBuilder<Labels | L> {
    const vertexLabel = VertexLabel.make(label)
    const vertexSchema = VertexTypeSchema(vertexLabel, schema) as Schema.Schema<Vertex<any>>

    return new APGBuilderImpl<Labels | L>({
      ...this.state,
      vertices: [
        ...this.state.vertices,
        Schema.decodeUnknownSync(vertexSchema)({ label: vertexLabel, value: schema }) as any
      ],
      labels: new Set([...this.state.labels, label])
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
  ): APGBuilder<Labels | L> {
    const edgeLabel = EdgeLabel.make(label)
    const fromLabel = VertexLabel.make(from)
    const toLabel = VertexLabel.make(to)
    const edgeSchema = EdgeTypeSchema(edgeLabel, schema, fromLabel, toLabel)

    return new APGBuilderImpl<Labels | L>({
      ...this.state,
      edges: [
        ...this.state.edges,
        EdgeSchema.make({ label: edgeLabel, from: fromLabel, to: toLabel, value: edgeSchema }) as any
      ],
      labels: new Set([...this.state.labels, label])
    })
  }

  build(): APGApi<Labels> {
    // Create vertex union schema
    const vertexSchemas = this.state.vertices.map((v) => v.schema)
    const VertexSchema = vertexSchemas.length === 0
      ? Schema.Never
      : vertexSchemas.length === 1
      ? vertexSchemas[0]
      : Schema.Union(...vertexSchemas as [Schema.Schema<Vertex<any>>, ...Array<Schema.Schema<Vertex<any>>>])

    // Create edge union schema
    const edgeSchemas = this.state.edges.map((e) => e.schema)
    const EdgeSchema = edgeSchemas.length === 0
      ? Schema.Never
      : edgeSchemas.length === 1
      ? edgeSchemas[0]
      : Schema.Union(...edgeSchemas as [Schema.Schema<any>, Schema.Schema<any>, ...Array<Schema.Schema<any>>])

    // Create the recursive graph schema
    const graphSchema = GraphSchema(VertexSchema as any, EdgeSchema as any)

    // Create vertex constructors
    const vertices: Record<string, (value: any) => Vertex<any>> = {}
    for (const vertexInfo of this.state.vertices) {
      const label = VertexLabel.make(vertexInfo.label)
      vertices[vertexInfo.label] = (value: any) => Schema.decodeSync(VertexSchema)({ label, value }) as Vertex<any>
    }

    // Create edge constructors
    const edges: Record<string, (value: any) => Edge<any>> = {}
    for (const edgeInfo of this.state.edges) {
      const label = EdgeLabel.make(edgeInfo.label)
      const from = VertexLabel.make(edgeInfo.from)
      const to = VertexLabel.make(edgeInfo.to)
      edges[edgeInfo.label] = (value: any) => Schema.decodeSync(EdgeSchema)({ label, from, to, value }) as Edge<any>
    }

    return {
      VertexSchema,
      EdgeSchema,
      GraphSchema: graphSchema,
      empty: Empty,
      vertex: Vertex,
      overlay: Overlay,
      connect: Connect,
      vertices: vertices as any,
      edges: edges as any
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

export const APGBuilder = {
  make: (): APGBuilder<never> => new APGBuilderImpl()
}

// ============================================================================
// Usage Example
// ============================================================================

// Build incrementally
const apg = pipe(
  APGBuilder.make(),
  (_) =>
    _.addVertex(
      "Person",
      Schema.Struct({
        name: Schema.String,
        age: Schema.Number
      })
    ),
  (_) =>
    _.addVertex(
      "Company",
      Schema.Struct({
        name: Schema.String,
        employees: Schema.Number
      })
    ),
  (_) =>
    _.addVertex(
      "Project",
      Schema.Struct({
        name: Schema.String,
        budget: Schema.Number
      })
    ),
  (_) =>
    _.addEdge(
      "WorksFor",
      Schema.Struct({
        since: Schema.Number,
        role: Schema.String
      }),
      "Person",
      "Company"
    ),
  (_) =>
    _.addEdge(
      "Manages",
      Schema.Struct({
        since: Schema.Number
      }),
      "Person",
      "Project"
    ),
  (_) =>
    _.addEdge(
      "Funds",
      Schema.Struct({
        amount: Schema.Number
      }),
      "Company",
      "Project"
    ),
  (_) => _.build()
)

// Use the constructed API
const alice = apg.vertices.Person({ name: "Alice", age: 30 })
const acme = apg.vertices.Company({ name: "Acme Corp", employees: 100 })
const website = apg.vertices.Project({ name: "Website", budget: 50000 })

const worksFor = apg.edges.WorksFor({ since: 2020, role: "Engineer" })
const manages = apg.edges.Manages({ since: 2021 })
const funds = apg.edges.Funds({ amount: 50000 })

// Build graphs
const graph1 = apg.connect(
  apg.vertex(alice),
  apg.vertex(acme),
  worksFor
)

const graph2 = apg.connect(
  apg.vertex(alice),
  apg.vertex(website),
  manages
)

const graph3 = apg.connect(
  apg.vertex(acme),
  apg.vertex(website),
  funds
)

// Combine graphs
const fullGraph = apg.overlay(graph1, apg.overlay(graph2, graph3))

// Validate and serialize
// const encoded = Schema.encodeSync(apg.GraphSchema)(fullGraph)
// const decoded = Schema.decodeSync(apg.GraphSchema)(encoded)

// The schemas have proper identifiers and descriptions
console.log(Schema.format(apg.VertexSchema)) // Shows union of Vertex<Person>, Vertex<Company>, etc.
console.log(Schema.format(apg.EdgeSchema)) // Shows union of Edge<WorksFor>, Edge<Manages>, etc.
