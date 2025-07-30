import { Brand, dual, Equivalence, Equal, Hash, HashSet, pipe } from "effect"
import type { TypeLambda } from "effect/HKT"
import * as internal from "./internal/algebraic.js"
import type { Graph, GraphImpl } from "./internal/core.js"
import { toRelation } from "./internal/relation.js"

// -----------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------

export type { Graph } from "./internal/core.js"
export { GraphTypeId } from "./internal/core.js"
export { isGraph } from "./internal/algebraic.js"

// -----------------------------------------------------------------------------
// #endregion
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
// #endregion
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// #region Branded Types
// -----------------------------------------------------------------------------

/**
 * A `DirectedGraph` is a graph whose edges have a direction.
 *
 * @since 1.0.0
 * @category models
 */
export interface DirectedGraph<A>
  extends Graph<A>, Brand.Brand<"DirectedGraph"> {}

/**
 * An `UndirectedGraph` is a graph whose edges have no direction.
 *
 * @since 1.0.0
 * @category models
 */
export interface UndirectedGraph<A>
  extends Graph<A>, Brand.Brand<"UndirectedGraph"> {}

// -----------------------------------------------------------------------------
// #endregion
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// #region Constructors
// -----------------------------------------------------------------------------

/**
 * The empty graph.
 *
 * @since 1.0.0
 * @category constructors
 */
export const empty: <A = never>() => Graph<A> = () => internal.makeGraph({ _tag: "Empty" })

/**
 * A graph with a single vertex.
 *
 * @since 1.0.0
 * @category constructors
 */
export const vertex: <A>(value: A) => Graph<A> = (value) => internal.makeGraph({ _tag: "Vertex", value })

/**
 * Creates a new `UndirectedGraph`.
 *
 * @since 1.0.0
 * @category constructors
 */
export const undirected: <A>(graph: Graph<A>) => UndirectedGraph<A> = <A>(
  graph: Graph<A>
) => internal.makeGraph((graph as GraphImpl<A>).backing, "undirected") as UndirectedGraph<A>

/**
 * Creates a new `DirectedGraph`.
 *
 * @since 1.0.0
 * @category constructors
 */
export const directed: <A>(graph: Graph<A>) => DirectedGraph<A> = <A>(
  graph: Graph<A>
) => internal.makeGraph((graph as GraphImpl<A>).backing, "directed") as DirectedGraph<A>

// -----------------------------------------------------------------------------
// #endregion
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// #region Core Algebraic Operations
// -----------------------------------------------------------------------------

/**
 * The union of two graphs.
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
 * @since 1.0.0
 * @category core
 */
export const connect: { 
  <A>(that: Graph<A>): (self: Graph<A>) => Graph<A>
  <A>(self: Graph<A>, that: Graph<A>): Graph<A>
} = dual(2, internal.makeConnect)

// -----------------------------------------------------------------------------
// #endregion
// -----------------------------------------------------------------------------

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
 * A path of vertices.
 *
 * @since 1.0.0
 * @category constructors
 */
export const path = <A>(vertices: Iterable<A>): Graph<A> => {
  const vs = Array.from(vertices)
  if (vs.length === 0) {
    return empty()
  }
  return vs.map(vertex).reduce((acc, v) => connect(acc, v))
}

/**
 * A clique of vertices.
 *
 * @since 1.0.0
 * @category constructors
 */
export const clique = <A>(vertices: Iterable<A>): Graph<A> => {
  const vs = Array.from(vertices)
  if (vs.length === 0) {
    return empty()
  }
  return vs.map(vertex).reduce((acc, v) => connect(acc, v))
}

// -----------------------------------------------------------------------------
// #endregion
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// #region Equivalence-parameterized Functions
// -----------------------------------------------------------------------------

/**
 * Checks if `self` is a subgraph of `that`.
 *
 * @since 1.0.0
 * @category predicates
 */
export const isSubgraphOf: { 
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
 * Checks if two graphs are equal.
 *
 * @since 1.0.0
 * @category predicates
 */
export const equals: { 
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

/**
 * Computes the hash of a graph.
 *
 * @since 1.0.0
 * @category hashing
 */
export const hash: <A>(self: Graph<A>, E: Equivalence.Equivalence<A>) => number = (
  self,
  E
) => {
  const rel = toRelation(self, E)
  return pipe(
    Hash.hash(rel.vertices),
    Hash.combine(Hash.hash(rel.edges)),
    Hash.combine(Hash.string("@apg/Graph"))
  )
}

// -----------------------------------------------------------------------------
// #endregion
// -----------------------------------------------------------------------------
