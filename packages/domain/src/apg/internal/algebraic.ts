/**
 * Algebraic graph implementation.
 *
 * This module provides the core algebraic constructors and factories for
 * building graphs following Mokhov's algebraic approach.
 *
 * @since 1.0.0
 * @module
 */

import type { Equivalence } from "effect"
import { Array, Equal, Hash, Inspectable, pipe, Pipeable, Predicate } from "effect"
import type { Graph, GraphBacking, GraphImpl, GraphKind } from "./core.js"
import { GraphTypeId, isGraphImpl } from "./core.js"
import { toRelation } from "./relation.js"

// -----------------------------------------------------------------------------
// #region The Graph Prototype
// -----------------------------------------------------------------------------

const GraphProto: Omit<Graph<any>, GraphTypeId | "_A"> = {
  [Equal.symbol](this: GraphImpl<any>, that: Equal.Equal): boolean {
    if (!isGraph(that)) return false

    // Two graphs are equal if they have the same vertices and edges
    // We use the default Equal.equals which respects custom Equal implementations
    const thisRelation = toRelation(this, Equal.equals)
    const thatRelation = toRelation(that as unknown as GraphImpl<any>, Equal.equals)

    return (
      Equal.equals(thisRelation.vertices, thatRelation.vertices) &&
      Equal.equals(thisRelation.edges, thatRelation.edges)
    )
  },

  [Hash.symbol](this: GraphImpl<any>): number {
    // Hash based on the canonical relation form
    const relation = toRelation(this, Equal.equals)
    return pipe(
      Hash.hash(relation.vertices),
      Hash.combine(Hash.hash(relation.edges)),
      Hash.combine(Hash.string("@apg/Graph"))
    )
  },
  [Symbol.iterator]<A>(this: GraphImpl<A>): Iterator<A> {
    // For iteration, use Equal.equals as the default vertex equivalence
    // This handles primitives correctly and respects custom Equal implementations
    const defaultEquivalence: Equivalence.Equivalence<A> = Equal.equals
    const relation = toRelation(this, defaultEquivalence)
    return relation.vertices[Symbol.iterator]()
  },

  pipe() {
    return Pipeable.pipeArguments(this, arguments)
  },

  [Inspectable.NodeInspectSymbol]() {
    return this.toJSON()
  },

  toString() {
    return Inspectable.format(this)
  },

  toJSON<A>(this: GraphImpl<A>) {
    return {
      _id: "Graph",
      kind: this.kind,
      backing: inspectBacking(this.backing)
    }
  }
}

/**
 * Helper to create a JSON representation of graph backing.
 *
 * @since 1.0.0
 * @category internal
 */
const inspectBacking = <A>(backing: GraphBacking<A>): unknown => {
  switch (backing._tag) {
    case "Empty":
      return { _tag: "Empty" }
    case "Vertex":
      return { _tag: "Vertex", value: Inspectable.toJSON(backing.value) }
    case "Overlay":
      return {
        _tag: "Overlay",
        left: inspectBacking(backing.left.backing),
        right: inspectBacking(backing.right.backing)
      }
    case "Connect":
      return {
        _tag: "Connect",
        left: inspectBacking(backing.left.backing),
        right: inspectBacking(backing.right.backing)
      }
    case "Relation":
      return {
        _tag: "Relation",
        vertices: Array.fromIterable(backing.relation.vertices).length,
        edges: Array.fromIterable(backing.relation.edges).length
      }
  }
}

// -----------------------------------------------------------------------------
// #region Factories and Type Guards
// -----------------------------------------------------------------------------

/**
 * The internal factory for creating `Graph` instances.
 *
 * This factory ensures that all graphs have the proper prototype chain
 * and internal structure required by the implementation.
 *
 * @since 1.0.0
 * @category internal
 */
export const makeGraph = <A>(
  backing: GraphBacking<A>,
  kind: GraphKind = "directed"
): GraphImpl<A> => {
  const graph = Object.create(GraphProto)
  graph[GraphTypeId] = GraphTypeId
  graph.backing = backing
  graph.kind = kind
  graph._relation = undefined
  return graph
}

/**
 * A type guard for `Graph`.
 *
 * @since 1.0.0
 * @category guards
 */
export const isGraph = (u: unknown): u is Graph<unknown> => Predicate.hasProperty(u, GraphTypeId)

/**
 * The internal factory for `overlay`.
 *
 * Creates an overlay of two graphs, preserving the kind from the first graph.
 *
 * @since 1.0.0
 * @category internal
 */
export const makeOverlay = <A>(self: Graph<A>, that: Graph<A>): Graph<A> => {
  if (!isGraphImpl(self) || !isGraphImpl(that)) {
    throw new Error("Invalid graph implementation")
  }

  return makeGraph(
    { _tag: "Overlay", left: self, right: that },
    self.kind
  )
}

/**
 * The internal factory for `connect`.
 *
 * Creates a connection of two graphs, preserving the kind from the first graph.
 *
 * @since 1.0.0
 * @category internal
 */
export const makeConnect = <A>(self: Graph<A>, that: Graph<A>): Graph<A> => {
  if (!isGraphImpl(self) || !isGraphImpl(that)) {
    throw new Error("Invalid graph implementation")
  }

  return makeGraph(
    { _tag: "Connect", left: self, right: that },
    self.kind
  )
}

// -----------------------------------------------------------------------------
// #region Utility Functions
// -----------------------------------------------------------------------------

/**
 * Extracts the vertex type from a graph at the value level.
 *
 * @since 1.0.0
 * @category internal
 */
export type VertexType = <A>(graph: Graph<A>) => A
