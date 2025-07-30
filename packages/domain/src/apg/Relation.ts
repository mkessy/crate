/**
 * Relation API for algebraic graphs.
 *
 * This module exposes the relational interpretation of algebraic graphs,
 * enabling direct access to vertex and edge sets for advanced algorithms
 * and mathematical analysis.
 *
 * @since 1.0.0
 * @module
 */

import type { Inspectable, Pipeable } from "effect"
import { Equal, Hash, HashSet, pipe } from "effect"
import type { Graph } from "./Graph.js"
import type { GraphImpl } from "./internal/core.js"
import * as Edge from "./internal/edge.js"
import * as relation from "./internal/relation.js"

// -----------------------------------------------------------------------------
// #region Type Definitions

// -----------------------------------------------------------------------------
export const TypeId: unique symbol = relation.RelationTypeId

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
export interface Relation<out A> extends Equal.Equal, Pipeable.Pipeable, Inspectable.Inspectable, Iterable<A> {
  readonly [TypeId]: TypeId
  readonly vertices: HashSet.HashSet<A>
  readonly edges: HashSet.HashSet<Edge.Edge<A>>
  [Equal.symbol](this: Relation<any>, that: Relation<any>): boolean
  [Hash.symbol](this: Relation<any>): number
  [Symbol.iterator]<A>(this: Relation<A>): Iterator<A>
  //  pipe(): this
  toString(): string
  toJSON<A>(this: Relation<A>): {
    _id: string
    vertices: Array<A>
    edges: Array<Edge.Edge<A>>
  }
}

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
export const toRelation = <A>(graph: Graph<A>): Relation<A> => relation.toRelation(graph as GraphImpl<A>)

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
export const edges = <A>(graph: Graph<A>): HashSet.HashSet<Edge.Edge<A>> => toRelation(graph).edges

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
  return HashSet.has(edgeSet, Edge.make(from, to))
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
export const successors = <A>(graph: Graph<A>, vertex: A): HashSet.HashSet<A> => {
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
export const predecessors = <A>(graph: Graph<A>, vertex: A): HashSet.HashSet<A> => {
  const edgeSet = edges(graph)
  return pipe(
    edgeSet,
    HashSet.filter((edge) => edge.to === vertex),
    HashSet.map((edge) => edge.from)
  )
}
