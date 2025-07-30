/**
 * Core type definitions for algebraic graphs.
 *
 * This module defines the fundamental types and interfaces for the algebraic
 * graph implementation, following Mokhov's algebraic approach to graph theory.
 *
 * @since 1.0.0
 * @module
 */

import type { Equal } from "effect"
import type { HashSet } from "effect/HashSet"
import type { Inspectable } from "effect/Inspectable"
import type { Pipeable } from "effect/Pipeable"
import type * as Types from "effect/Types"
import type * as Edge from "./edge.js"

// -----------------------------------------------------------------------------
// #region Core Type Definitions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category symbols
 */
export const GraphTypeId = Symbol.for("@apg/Graph")

/**
 * @since 1.0.0
 * @category symbols
 */
export type GraphTypeId = typeof GraphTypeId

/**
 * A `Graph<A>` is a data structure that represents a collection of vertices of
 * type `A` and the directed edges connecting them, based on the algebraic
 * graph theory formulation by Mokhov.
 *
 * @since 1.0.0
 * @category models
 */
export interface Graph<out A> extends Equal.Equal, Pipeable, Inspectable, Iterable<A> {
  readonly [GraphTypeId]: GraphTypeId
  readonly _A: Types.Covariant<A>
}

/**
 * The internal implementation of a `Graph`.
 *
 * @since 1.0.0
 * @category models
 * @internal
 */
export interface GraphImpl<out A> extends Graph<A> {
  readonly kind: GraphKind
  readonly backing: GraphBacking<A>
  _relation: Relation<A> | undefined // Mutable for memoization
}

/**
 * Represents the different kinds of graphs supported by the implementation.
 *
 * @since 1.0.0
 * @category models
 */
export type GraphKind =
  | "directed" // Standard directed graph
  | "undirected" // Symmetric closure applied
  | "reflexive" // Self-loops added for all vertices
  | "transitive" // Transitive closure applied

/**
 * The backing data structure for a `Graph`, representing its algebraic
 * construction following Mokhov's formulation.
 *
 * @since 1.0.0
 * @category models
 */
export type GraphBacking<A> =
  | IEmpty
  | IVertex<A>
  | IOverlay<A>
  | IConnect<A>
  | IRelation<A>

/**
 * Represents the `empty` graph constructor.
 *
 * The empty graph has no vertices and no edges.
 *
 * @since 1.0.0
 * @category models
 */
export interface IEmpty {
  readonly _tag: "Empty"
}

/**
 * Represents the `vertex` graph constructor.
 *
 * A single vertex with no edges.
 *
 * @since 1.0.0
 * @category models
 */
export interface IVertex<A> {
  readonly _tag: "Vertex"
  readonly value: A
}

/**
 * Represents the `overlay` graph constructor.
 *
 * The overlay of two graphs is their disjoint union.
 * Vertices: V(g1) ∪ V(g2)
 * Edges: E(g1) ∪ E(g2)
 *
 * @since 1.0.0
 * @category models
 */
export interface IOverlay<A> {
  readonly _tag: "Overlay"
  readonly left: GraphImpl<A>
  readonly right: GraphImpl<A>
}

/**
 * Represents the `connect` graph constructor.
 *
 * The connection of two graphs adds all edges from vertices in the
 * first graph to vertices in the second graph.
 * Vertices: V(g1) ∪ V(g2)
 * Edges: E(g1) ∪ E(g2) ∪ (V(g1) × V(g2))
 *
 * @since 1.0.0
 * @category models
 */
export interface IConnect<A> {
  readonly _tag: "Connect"
  readonly left: GraphImpl<A>
  readonly right: GraphImpl<A>
}

/**
 * Represents a `Graph` that has been canonicalized into a `Relation`.
 *
 * This allows direct construction from a vertex and edge set.
 *
 * @since 1.0.0
 * @category models
 */
export interface IRelation<A> {
  readonly _tag: "Relation"
  readonly relation: Relation<A>
}

/**
 * The canonical representation of a `Graph` as a set of vertices and a set of
 * edges. This is the normalized form used for analysis and operations.
 *
 * @since 1.0.0
 * @category models
 */
export interface Relation<A> {
  readonly vertices: HashSet<A>
  readonly edges: HashSet<Edge.Edge<A>>
}

// -----------------------------------------------------------------------------
// #region Type Utilities
// -----------------------------------------------------------------------------

/**
 * Extracts the vertex type from a Graph.
 *
 * @since 1.0.0
 * @category type-level
 */
export type VertexOf<G> = G extends Graph<infer A> ? A : never

/**
 * Type guard for Graph implementations.
 *
 * @since 1.0.0
 * @category guards
 * @internal
 */
export const isGraphImpl = <A>(u: Graph<A>): u is GraphImpl<A> => "_relation" in u && "backing" in u && "kind" in u
