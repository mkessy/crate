/**
 * Graph operations module.
 *
 * This module provides both intrinsic and parameterized operations for
 * algebraic graphs, following Effect's architectural patterns.
 *
 * @since 1.0.0
 * @module
 */

import { Equal, HashSet } from "effect"
import type { Equivalence } from "effect"
import { dual } from "effect/Function"

import type { Graph } from "./core.js"
import { toRelation } from "./relation.js"

// -----------------------------------------------------------------------------
// #region Intrinsic Operations (Using Graph's Equal Implementation)
// -----------------------------------------------------------------------------

/**
 * Checks if `self` is a subgraph of `that` using intrinsic equality.
 *
 * This function uses the graph's built-in Equal implementation, which
 * compares vertices using Equal.equals.
 *
 * @example
 * ```ts
 * import { Graph } from "@apg"
 *
 * const g1 = Graph.edge("A", "B")
 * const g2 = Graph.path(["A", "B", "C"])
 *
 * console.log(Graph.isSubgraphOf(g1, g2)) // true
 * ```
 *
 * @since 1.0.0
 * @category predicates
 */
export const isSubgraphOf: {
  <A>(that: Graph<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>): boolean
} = dual(2, (self, that) => {
  const selfRel = toRelation(self, Equal.equals)
  const thatRel = toRelation(that, Equal.equals)
  return (
    HashSet.isSubset(selfRel.vertices, thatRel.vertices) &&
    HashSet.isSubset(selfRel.edges, thatRel.edges)
  )
})

/**
 * Checks if two graphs are equal using intrinsic equality.
 *
 * @since 1.0.0
 * @category predicates
 */
export const equals: {
  <A>(that: Graph<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>): boolean
} = dual(2, Equal.equals)

// -----------------------------------------------------------------------------
// #region Parameterized Operations (Custom Equivalence)
// -----------------------------------------------------------------------------

/**
 * Checks if `self` is a subgraph of `that` using custom vertex equivalence.
 *
 * This function allows specifying custom equality for vertices, useful when
 * working with complex vertex types or domain-specific equality semantics.
 *
 * @example
 * ```ts
 * import { Graph, Equivalence } from "@apg"
 *
 * interface Person { id: number; name: string }
 *
 * const personEq: Equivalence<Person> = (a, b) => a.id === b.id
 *
 * const g1 = Graph.vertex({ id: 1, name: "Alice" })
 * const g2 = Graph.edge(
 *   { id: 1, name: "Alice" },
 *   { id: 2, name: "Bob" }
 * )
 *
 * console.log(Graph.isSubgraphOfWith(g1, g2, personEq)) // true
 * ```
 *
 * @since 1.0.0
 * @category predicates
 */
export const isSubgraphOfWith: {
  <A>(that: Graph<A>, E: Equivalence.Equivalence<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>, E: Equivalence.Equivalence<A>): boolean
} = dual(3, (self, that, E) => {
  const selfRel = toRelation(self, E)
  const thatRel = toRelation(that, E)
  return (
    HashSet.isSubset(selfRel.vertices, thatRel.vertices) &&
    HashSet.isSubset(selfRel.edges, thatRel.edges)
  )
})

/**
 * Checks if two graphs are equal using custom vertex equivalence.
 *
 * @since 1.0.0
 * @category predicates
 */
export const equalsWith: {
  <A>(that: Graph<A>, E: Equivalence.Equivalence<A>): (self: Graph<A>) => boolean
  <A>(self: Graph<A>, that: Graph<A>, E: Equivalence.Equivalence<A>): boolean
} = dual(3, (self, that, E) => {
  const selfRel = toRelation(self, E)
  const thatRel = toRelation(that, E)
  return (
    Equal.equals(selfRel.vertices, thatRel.vertices) &&
    Equal.equals(selfRel.edges, thatRel.edges)
  )
})
