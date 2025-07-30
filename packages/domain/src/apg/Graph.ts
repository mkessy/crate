/**
 * Algebraic Graph implementation for Effect.
 *
 * This module provides a purely functional implementation of algebraic graphs
 * based on Andrey Mokhov's algebraic approach to graph theory.
 *
 * @since 1.0.0
 * @module
 */

import type { Equivalence } from "effect"
import { Equal, Hash, HashSet, pipe } from "effect"
import { dual } from "effect/Function"
import type { TypeLambda } from "effect/HKT"
import type * as Types from "effect/Types"
import * as internal from "./internal/index.js"

// -----------------------------------------------------------------------------
// #region Type Definitions
// -----------------------------------------------------------------------------

const TypeId: unique symbol = internal.GraphTypeId as TypeId

/**
 * @since 1.0.0
 * @category symbols
 */
export type TypeId = typeof TypeId

/**
 * The fundamental type representing an algebraic graph with vertices of type `A`.
 *
 * A `Graph<A>` is an immutable data structure that represents a collection of
 * vertices and the directed edges connecting them, based on Mokhov's algebraic
 * approach to graph theory.
 *
 * @since 1.0.0
 * @category models
 */
export interface Graph<out A> extends internal.Graph<A> {
  readonly [TypeId]: {
    readonly _A: Types.Covariant<A>
    readonly kind: internal.GraphKind
  }
}

/**
 * @since 1.0.0
 * @category type-level
 */
export type VertexOf<G> = G extends Graph<infer A> ? A : never

// -----------------------------------------------------------------------------
// #region Re-exports
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// #region HKT
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category models
 */
export interface GraphTypeLambda extends TypeLambda {
  readonly type: Graph<this["Target"]>
}

// -----------------------------------------------------------------------------
// #region Branded Types
// -----------------------------------------------------------------------------

/**
 * A `DirectedGraph` is a graph whose edges have a direction.
 *
 * @since 1.0.0
 * @category models
 */
export interface DirectedGraph<A> extends Graph<A> {
  readonly _kind: "directed"
}

/**
 * An `UndirectedGraph` is a graph whose edges have no direction.
 *
 * In undirected graphs, if there is an edge from vertex A to vertex B,
 * there is also an edge from B to A.
 *
 * @since 1.0.0
 * @category models
 */
export interface UndirectedGraph<A> extends Graph<A> {
  readonly _kind: "undirected"
}

// -----------------------------------------------------------------------------
// #region Constructors
// -----------------------------------------------------------------------------

export const kind = <A>(graph: Graph<A>): internal.GraphKind => (graph as internal.GraphImpl<A>).kind

/**
 * The empty graph.
 *
 * The empty graph has no vertices and no edges.
 * Mathematically: V = ∅, E = ∅
 *
 * @since 1.0.0
 * @category constructors
 */
export const empty: <A = never>() => Graph<A> = () => internal.makeGraph({ _tag: "Empty" })

/**
 * A graph with a single vertex.
 *
 * Mathematically: V = {value}, E = ∅
 *
 * @since 1.0.0
 * @category constructors
 */
export const vertex: <A>(value: A) => Graph<A> = (value) => internal.makeGraph({ _tag: "Vertex", value })

/**
 * Creates an undirected graph from a directed graph.
 *
 * This applies the symmetric closure to the edge set.
 *
 * @since 1.0.0
 * @category constructors
 */
export const undirected = <A>(graph: Graph<A>): UndirectedGraph<A> => {
  const impl = graph as unknown as internal.GraphImpl<A>
  return internal.makeGraph(impl.backing, "undirected") as unknown as UndirectedGraph<A>
}

/**
 * Converts a graph to an undirected graph.
 *
 * @since 1.0.0
 * @category constructors
 */
export const toUndirected = <A>(
  graph: Graph<A>
): UndirectedGraph<A> => undirected(graph)

/**
 * Creates a directed graph (identity operation for already directed graphs).
 *
 * @since 1.0.0
 * @category constructors
 */
export const directed = <A>(graph: Graph<A>): DirectedGraph<A> => {
  const impl = graph as internal.GraphImpl<A>
  return internal.makeGraph(impl.backing, "directed") as unknown as DirectedGraph<A>
}

/**
 * Converts a graph to a directed graph.
 *
 * @since 1.0.0
 * @category constructors
 */
export const toDirected = <A>(
  graph: Graph<A>
): DirectedGraph<A> => directed(graph)

/**
 * Creates a reflexive graph.
 *
 * A reflexive graph has self-loops for all vertices.
 * Mathematically: ∀v ∈ V, (v,v) ∈ E
 *
 * @since 1.0.0
 * @category constructors
 */
export const reflexive = <A>(graph: Graph<A>): Graph<A> => {
  const impl = graph as unknown as internal.GraphImpl<A>
  return internal.makeGraph(impl.backing, "reflexive") as unknown as Graph<A>
}

/**
 * Creates a transitive graph.
 *
 * A transitive graph satisfies: if (a,b) ∈ E and (b,c) ∈ E then (a,c) ∈ E
 * This computes the transitive closure of the graph.
 *
 * Time Complexity: O(V³) where V is the number of vertices
 *
 * @since 1.0.0
 * @category constructors
 */
export const transitive = <A>(graph: Graph<A>): Graph<A> => {
  const impl = graph as unknown as internal.GraphImpl<A>
  return internal.makeGraph(impl.backing, "transitive") as unknown as Graph<A>
}

// -----------------------------------------------------------------------------
// #region Core Algebraic Operations
// -----------------------------------------------------------------------------

/**
 * The overlay of two graphs.
 *
 * Overlay is the disjoint union of two graphs.
 * Mathematically: V = V₁ ∪ V₂, E = E₁ ∪ E₂
 *
 * @since 1.0.0
 * @category core
 */
export const overlay: {
  <A>(that: Graph<A>): (self: Graph<A>) => Graph<A>
  <A>(self: Graph<A>, that: Graph<A>): Graph<A>
} = dual(2, internal.makeOverlay)

/**
 * The connection of two graphs.
 *
 * Connect adds all possible edges from vertices in the first graph
 * to vertices in the second graph.
 * Mathematically: V = V₁ ∪ V₂, E = E₁ ∪ E₂ ∪ (V₁ × V₂)
 *
 * @since 1.0.0
 * @category core
 */
export const connect: {
  <A>(that: Graph<A>): (self: Graph<A>) => Graph<A>
  <A>(self: Graph<A>, that: Graph<A>): Graph<A>
} = dual(2, internal.makeConnect)

// -----------------------------------------------------------------------------
// #region Derived Constructors
// -----------------------------------------------------------------------------

/**
 * A graph with a single edge.
 *
 * @since 1.0.0
 * @category constructors
 */
export const edge = <A>(from: A, to: A): Graph<A> => connect(vertex(from), vertex(to))

/**
 * A graph from a list of vertices.
 *
 * @since 1.0.0
 * @category constructors
 */
export const fromVertices = <A>(values: Iterable<A>): Graph<A> => {
  const vs = Array.from(values).map(vertex)
  return vs.length > 0 ? vs.reduce(overlay) : empty()
}

/**
 * A graph from a list of edges.
 *
 * @since 1.0.0
 * @category constructors
 */
export const fromEdges = <A>(pairs: Iterable<readonly [A, A]>): Graph<A> => {
  const es = Array.from(pairs).map(([from, to]) => edge(from, to))
  return es.length > 0 ? es.reduce(overlay) : empty()
}

/**
 * A path of vertices.
 *
 * Creates a graph where vertices are connected in sequence.
 * For [a, b, c], creates edges a→b and b→c.
 *
 * @since 1.0.0
 * @category constructors
 */
export const path = <A>(values: Iterable<A>): Graph<A> => {
  const vs = Array.from(values).map(vertex)
  return vs.length > 0 ? vs.reduce(connect) : empty()
}

/**
 * A clique of vertices.
 *
 * Creates a complete graph where every vertex is connected to every other vertex
 * (including self-loops).
 *
 * @since 1.0.0
 * @category constructors
 */
export const clique = <A>(values: Iterable<A>): Graph<A> => {
  const vs = fromVertices(values)
  return connect(vs, vs)
}

/**
 * A star graph.
 *
 * Connects a center vertex to a list of leaf vertices.
 *
 * @since 1.0.0
 * @category constructors
 */
export const star = <A>(center: A, leaves: Iterable<A>): Graph<A> => {
  return connect(vertex(center), fromVertices(leaves))
}

// -----------------------------------------------------------------------------
// #region Predicates
// -----------------------------------------------------------------------------

/**
 * Checks if `self` is a subgraph of `that`.
 *
 * Uses the intrinsic Equal implementation for vertex comparison.
 *
 * @since 1.0.0
 * @category predicates
 */
export const isSubgraphOf: {
  <A>(that: Graph<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>): boolean
} = dual(2, (self, that) => {
  const selfRel = internal.toRelation(self)
  const thatRel = internal.toRelation(that)
  return (
    HashSet.isSubset(selfRel.vertices, thatRel.vertices) &&
    HashSet.isSubset(selfRel.edges, thatRel.edges)
  )
})

/**
 * Checks if `self` is a subgraph of `that` using custom vertex equivalence.
 *
 * @since 1.0.0
 * @category predicates
 * @notImplemented
 */
export const isSubgraphOfWith: {
  <A>(that: Graph<A>, E: Equivalence.Equivalence<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>, E: Equivalence.Equivalence<A>): boolean
} = dual(3, (_self, _that, _E) => {
  throw new Error("isSubgraphOfWith: Not implemented")
})

/**
 * Checks if two graphs are equal.
 *
 * Uses the intrinsic Equal implementation for comparison.
 *
 * @since 1.0.0
 * @category predicates
 */
export const equals: {
  <A>(that: Graph<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>): boolean
} = dual(2, Equal.equals)

/**
 * Checks if two graphs are equal using custom vertex equivalence.
 *
 * @since 1.0.0
 * @category predicates
 * @notImplemented
 */
export const _equalsWith: {
  <A>(that: Graph<A>, E: Equivalence.Equivalence<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>, E: Equivalence.Equivalence<A>): boolean
} = dual(3, (_self, _that, _E) => {
  throw new Error("_equalsWith: Not implemented")
})

/**
 * Computes the hash of a graph.
 *
 * @since 1.0.0
 * @category hashing
 */
export const hash = <A>(self: Graph<A>): number => Hash.hash(self)

// -----------------------------------------------------------------------------
// #region Folds and Maps
// -----------------------------------------------------------------------------

/**
 * The universal catamorphism for the `Graph` type.
 *
 * Deconstructs a `Graph` by providing functions for each of its constructors.
 * This is the primary method for reading data out of a graph in a structured way.
 *
 * @since 1.0.0
 * @category folding
 */
export const fold: {
  <A, B>(handler: internal.Fold<A, B>): (self: Graph<A>) => B
  <A, B>(self: Graph<A>, handler: internal.Fold<A, B>): B
} = dual(2, (self, handler) => {
  return internal.foldBacking((self as internal.GraphImpl<any>).backing, handler)
})

/**
 * Maps the vertices of a graph to a new type.
 *
 * This is the `Functor` instance for `Graph`, allowing you to transform the
 * values contained within vertices without altering the graph's structure.
 *
 * @since 1.0.0
 * @category mapping
 */
export const map: {
  <A, B>(f: (a: A) => B): (self: Graph<A>) => Graph<B>
  <A, B>(self: Graph<A>, f: (a: A) => B): Graph<B>
} = dual(2, (self, f) => {
  const impl = self as internal.GraphImpl<any>
  return internal.makeGraph(internal.mapBacking(impl.backing, f), impl.kind)
})

/**
 * Reverses the direction of all edges in a graph.
 *
 * **Properties**:
 * - Involution: `transpose(transpose(g)) == g`
 *
 * @since 1.0.0
 * @category transformations
 */
export const transpose = <A>(graph: Graph<A>): Graph<A> =>
  internal.makeGraph(
    internal.transposeBacking((graph as internal.GraphImpl<A>).backing),
    (graph as internal.GraphImpl<A>).kind
  )

// -----------------------------------------------------------------------------
// #region Type Guards
// -----------------------------------------------------------------------------

/**
 * Type guard for Graph.
 *
 * @since 1.0.0
 * @category guards
 */
export const isGraph = (u: unknown): u is Graph<unknown> => internal.isGraph(u)

/**
 * Converts an algebraic graph to its relational representation.
 *
 * This function interprets the algebraic structure as a concrete set of
 * vertices and edges, applying any graph kind transformations (undirected,
 * reflexive, transitive) as specified by the graph's kind.
 *
 * Time Complexity: O(|V| + |E|) for basic graphs, up to O(|V|³) for transitive graphs
 *
 * @example
 * ```ts
 * import { Graph } from "@apg"
 *
 * const g = Graph.path(["a", "b", "c"])
 * const rel = Graph.toRelation(g)
 *
 * console.log(HashSet.size(rel.vertices)) // 3
 * console.log(HashSet.size(rel.edges))    // 2
 * ```
 *
 * @since 1.0.0
 * @category conversions
 */
export const toRelation = <A>(graph: Graph<A>): internal.Relation<A> =>
  internal.toRelation(graph as internal.GraphImpl<A>)

/**
 * Extracts the vertex set from a graph.
 *
 * @example
 * ```ts
 * const g = Graph.clique(["a", "b", "c"])
 * const vertices = Graph.vertices(g)
 * console.log(Array.from(vertices)) // ["a", "b", "c"]
 * ```
 *
 * @since 1.0.0
 * @category accessors
 */
export const vertices = <A>(graph: Graph<A>): HashSet.HashSet<A> => toRelation(graph).vertices

/**
 * Extracts the edge set from a graph.
 *
 * Note: The edge set respects the graph's kind. Undirected graphs
 * will include both directions for each edge.
 *
 * @example
 * ```ts
 * const g = Graph.edge("a", "b")
 * const edges = Graph.edges(g)
 *
 * for (const edge of edges) {
 *   console.log(`${edge.from} -> ${edge.to}`)
 * }
 * ```
 *
 * @since 1.0.0
 * @category accessors
 */
export const edges = <A>(
  graph: Graph<A>
): HashSet.HashSet<internal.E.Edge<A>> => toRelation(graph).edges

/**
 * Checks if a graph contains a specific vertex.
 *
 * @since 1.0.0
 * @category predicates
 */
export const hasVertex = <A>(graph: Graph<A>, vertex: A): boolean => HashSet.has(vertices(graph), vertex)

/**
 * Checks if a graph contains a specific edge.
 *
 * @since 1.0.0
 * @category predicates
 */
export const hasEdge = <A>(graph: Graph<A>, from: A, to: A): boolean => {
  const edgeSet = edges(graph)
  return HashSet.has(edgeSet, internal.E.make(from, to))
}

/**
 * Counts the number of vertices in a graph.
 *
 * @since 1.0.0
 * @category accessors
 */
export const vertexCount = <A>(graph: Graph<A>): number => HashSet.size(vertices(graph))

/**
 * Counts the number of edges in a graph.
 *
 * Note: For undirected graphs, this counts both directions as separate edges.
 *
 * @since 1.0.0
 * @category accessors
 */
export const edgeCount = <A>(graph: Graph<A>): number => HashSet.size(edges(graph))

/**
 * Computes the out-degree of a vertex (number of outgoing edges).
 *
 * @since 1.0.0
 * @category analysis
 */
export const outDegree = <A>(graph: Graph<A>, vertex: A): number => {
  const edgeSet = edges(graph)
  return HashSet.filter(edgeSet, (edge) => edge.from === vertex).pipe(HashSet.size)
}

/**
 * Computes the in-degree of a vertex (number of incoming edges).
 *
 * @since 1.0.0
 * @category analysis
 */
export const inDegree = <A>(graph: Graph<A>, vertex: A): number => {
  const edgeSet = edges(graph)
  return HashSet.filter(edgeSet, (edge) => edge.to === vertex).pipe(HashSet.size)
}

/**
 * Returns the successors of a vertex (vertices reachable by outgoing edges).
 *
 * @since 1.0.0
 * @category analysis
 */
export const successors = <A>(
  graph: Graph<A>,
  vertex: A
): HashSet.HashSet<A> => {
  const edgeSet = edges(graph)
  return pipe(
    edgeSet,
    HashSet.filter((edge) => edge.from === vertex),
    HashSet.map((edge) => edge.to)
  )
}

/**
 * Returns the predecessors of a vertex (vertices with edges to this vertex).
 *
 * @since 1.0.0
 * @category analysis
 */
export const predecessors = <A>(
  graph: Graph<A>,
  vertex: A
): HashSet.HashSet<A> => {
  const edgeSet = edges(graph)
  return pipe(
    edgeSet,
    HashSet.filter((edge) => edge.to === vertex),
    HashSet.map((edge) => edge.from)
  )
}
