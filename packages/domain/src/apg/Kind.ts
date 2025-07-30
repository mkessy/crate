/**
 * Graph kind type system following Effect patterns.
 *
 * This module implements graph kinds using Effect's proper variance annotations,
 * branded types, and constraint application patterns.
 *
 * @since 1.0.0
 * @module
 */

import { Equivalence } from "effect"
import type { Types } from "effect"
import type { Graph, GraphKind } from "./internal/core.js"
import { isGraphImpl } from "./internal/core.js"

// -----------------------------------------------------------------------------
// #region Graph Kind Type System
// -----------------------------------------------------------------------------

/**
 * Type symbol for directed graphs.
 * @since 1.0.0
 * @category symbols
 */
export const DirectedGraphTypeId: unique symbol = Symbol.for("@apg/DirectedGraph")

/**
 * Type symbol for undirected graphs.
 * @since 1.0.0
 * @category symbols
 */
export const UndirectedGraphTypeId: unique symbol = Symbol.for("@apg/UndirectedGraph")

/**
 * Type symbol for reflexive graphs.
 * @since 1.0.0
 * @category symbols
 */
export const ReflexiveGraphTypeId: unique symbol = Symbol.for("@apg/ReflexiveGraph")

/**
 * Type symbol for transitive graphs.
 * @since 1.0.0
 * @category symbols
 */
export const TransitiveGraphTypeId: unique symbol = Symbol.for("@apg/TransitiveGraph")

/**
 * Directed graph interface following Effect patterns.
 * @since 1.0.0
 * @category models
 */
export interface DirectedGraph<out A> extends Graph<A> {
  readonly [DirectedGraphTypeId]: {
    readonly _A: Types.Covariant<A>
    readonly _kind: "directed"
  }
}

/**
 * Undirected graph interface following Effect patterns.
 * @since 1.0.0
 * @category models
 */
export interface UndirectedGraph<out A> extends Graph<A> {
  readonly [UndirectedGraphTypeId]: {
    readonly _A: Types.Covariant<A>
    readonly _kind: "undirected"
  }
}

/**
 * Reflexive graph interface following Effect patterns.
 * @since 1.0.0
 * @category models
 */
export interface ReflexiveGraph<out A> extends Graph<A> {
  readonly [ReflexiveGraphTypeId]: {
    readonly _A: Types.Covariant<A>
    readonly _kind: "reflexive"
  }
}

/**
 * Transitive graph interface following Effect patterns.
 * @since 1.0.0
 * @category models
 */
export interface TransitiveGraph<out A> extends Graph<A> {
  readonly [TransitiveGraphTypeId]: {
    readonly _A: Types.Covariant<A>
    readonly _kind: "transitive"
  }
}

// -----------------------------------------------------------------------------
// #region Type Guards
// -----------------------------------------------------------------------------

/**
 * Type guard for directed graphs.
 * @since 1.0.0
 * @category guards
 */
export const isDirected = <A>(graph: Graph<A>): graph is DirectedGraph<A> => {
  if (!isGraphImpl(graph)) return false
  return graph.kind === "directed"
}

/**
 * Type guard for undirected graphs.
 * @since 1.0.0
 * @category guards
 */
export const isUndirected = <A>(graph: Graph<A>): graph is UndirectedGraph<A> => {
  if (!isGraphImpl(graph)) return false
  return graph.kind === "undirected"
}

/**
 * Type guard for reflexive graphs.
 * @since 1.0.0
 * @category guards
 */
export const isReflexive = <A>(graph: Graph<A>): graph is ReflexiveGraph<A> => {
  if (!isGraphImpl(graph)) return false
  return graph.kind === "reflexive"
}

/**
 * Type guard for transitive graphs.
 * @since 1.0.0
 * @category guards
 */
export const isTransitive = <A>(graph: Graph<A>): graph is TransitiveGraph<A> => {
  if (!isGraphImpl(graph)) return false
  return graph.kind === "transitive"
}

// -----------------------------------------------------------------------------
// #region Kind Validation
// -----------------------------------------------------------------------------

/**
 * Gets the kind of a graph safely.
 * @since 1.0.0
 * @category accessors
 */
export const getKind = <A>(graph: Graph<A>): GraphKind | undefined => {
  if (!isGraphImpl(graph)) return undefined
  return graph.kind
}

/**
 * Validates that a graph has the expected kind.
 * @since 1.0.0
 * @category validation
 */
export const validateKind = <A>(graph: Graph<A>, expectedKind: GraphKind): boolean => {
  const actualKind = getKind(graph)
  return actualKind === expectedKind
}

// -----------------------------------------------------------------------------
// #region Graph Kind Equivalences Namespace
// -----------------------------------------------------------------------------

/**
 * Namespace for graph kind equivalences and related utilities.
 * @since 1.0.0
 * @namespace
 */
export namespace GraphKindEquivalences {
  export const Directed: Equivalence.Equivalence<GraphKind> = Equivalence.make((k1, k2) =>
    k1 === "directed" && k2 === "directed"
  )
  export const Reflexive: Equivalence.Equivalence<GraphKind> = Equivalence.make((k1, k2) =>
    k1 === "reflexive" && k2 === "reflexive"
  )
  export const Transitive: Equivalence.Equivalence<GraphKind> = Equivalence.make((k1, k2) =>
    k1 === "transitive" && k2 === "transitive"
  )
  export const Undirected: Equivalence.Equivalence<GraphKind> = Equivalence.make((k1, k2) =>
    k1 === "undirected" && k2 === "undirected"
  )

  /**
   * Equivalence for GraphKind values.
   * @since 1.0.0
   * @category equivalences
   */
  export const Basic: Equivalence.Equivalence<GraphKind> = Equivalence.string

  /**
   * Compatibility equivalence for graph kinds in operations.
   * Two kinds are compatible if they can be combined in overlay/connect operations.
   * @since 1.0.0
   * @category equivalences
   */
  export const Compatibility: Equivalence.Equivalence<GraphKind> = Equivalence.make((k1, k2) => {
    // Same kinds are always compatible
    if (Basic(k1, k2)) return true

    // Mixed directed/undirected is compatible (results in undirected)
    return (k1 === "directed" && k2 === "undirected") ||
      (k1 === "undirected" && k2 === "directed")
  })
}

/**
 * Checks if two graphs have compatible kinds for operations using derived equivalence.
 * @since 1.0.0
 * @category validation
 */
export const areKindsCompatible = <A>(g1: Graph<A>, g2: Graph<A>): boolean => {
  const k1 = getKind(g1)
  const k2 = getKind(g2)

  if (k1 === undefined || k2 === undefined) return false

  return GraphKindEquivalences.Compatibility(k1, k2)
}

// -----------------------------------------------------------------------------
// #region Export Types
// -----------------------------------------------------------------------------
