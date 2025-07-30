/**
 * Edge data structure for algebraic graphs.
 *
 * This module provides an immutable Edge type that properly implements
 * Effect's Equal and Hash traits for use in HashSet collections.
 *
 * @since 1.0.0
 * @module
 */

import type { Equivalence } from "effect"
import { Equal, Hash, Inspectable, pipe, Pipeable, Predicate } from "effect"
import type * as Types from "effect/Types"

// -----------------------------------------------------------------------------
// #region Type Definitions
// -----------------------------------------------------------------------------

/**
 * @since 1.0.0
 * @category symbols
 */
export const EdgeTypeId = Symbol.for("@apg/Edge")

/**
 * @since 1.0.0
 * @category symbols
 */
export type EdgeTypeId = typeof EdgeTypeId

/**
 * A directed edge in an algebraic graph from vertex `from` to vertex `to`.
 *
 * Edges implement Effect's Equal and Hash traits to ensure proper behavior
 * in HashSet collections.
 *
 * @since 1.0.0
 * @category models
 */
export interface Edge<out A> extends Equal.Equal, Pipeable.Pipeable, Inspectable.Inspectable {
  readonly [EdgeTypeId]: EdgeTypeId
  readonly _A: Types.Covariant<A>
  readonly from: A
  readonly to: A
}

// -----------------------------------------------------------------------------
// #region Internal Implementation
// -----------------------------------------------------------------------------

const EdgeProto: Omit<Edge<any>, EdgeTypeId | "_A" | "from" | "to"> = {
  [Equal.symbol](this: Edge<any>, that: Equal.Equal): boolean {
    return isEdge(that) &&
      Equal.equals(this.from, that.from) &&
      Equal.equals(this.to, that.to)
  },

  [Hash.symbol](this: Edge<any>): number {
    return pipe(
      Hash.hash(this.from),
      Hash.combine(Hash.hash(this.to)),
      Hash.combine(Hash.string("@apg/Edge"))
    )
  },

  [Inspectable.NodeInspectSymbol](this: Edge<any>) {
    return this.toJSON()
  },

  toString(this: Edge<any>) {
    return Inspectable.format(this)
  },

  toJSON(this: Edge<any>) {
    return {
      _id: "Edge",
      from: Inspectable.toJSON(this.from),
      to: Inspectable.toJSON(this.to)
    }
  },

  pipe() {
    return Pipeable.pipeArguments(this, arguments)
  }
}

// -----------------------------------------------------------------------------
// #region Constructors
// -----------------------------------------------------------------------------

/**
 * Creates a directed edge from vertex `from` to vertex `to`.
 *
 * @example
 * ```ts
 * import { Edge } from "@apg/internal/edge"
 *
 * const edge = Edge.make("A", "B")
 * ```
 *
 * @since 1.0.0
 * @category constructors
 */
export const make = <A>(from: A, to: A): Edge<A> => {
  const edge = Object.create(EdgeProto)
  edge[EdgeTypeId] = EdgeTypeId
  edge.from = from
  edge.to = to
  return edge
}

/**
 * Creates an Edge from a tuple [from, to].
 *
 * @example
 * ```ts
 * import { Edge } from "@apg/internal/edge"
 *
 * const edge = Edge.fromTuple(["A", "B"])
 * ```
 *
 * @since 1.0.0
 * @category constructors
 */
export const fromTuple = <A>(tuple: readonly [A, A]): Edge<A> => make(tuple[0], tuple[1])

// -----------------------------------------------------------------------------
// #region Type Guards
// -----------------------------------------------------------------------------

/**
 * Type guard for Edge.
 *
 * @since 1.0.0
 * @category guards
 */
export const isEdge = (u: unknown): u is Edge<unknown> => Predicate.hasProperty(u, EdgeTypeId)

// -----------------------------------------------------------------------------
// #region Accessors
// -----------------------------------------------------------------------------

/**
 * Converts an Edge to a tuple [from, to].
 *
 * @since 1.0.0
 * @category accessors
 */
export const toTuple = <A>(edge: Edge<A>): readonly [A, A] => [edge.from, edge.to] as const

/**
 * Reverses the direction of an edge.
 *
 * @since 1.0.0
 * @category transformations
 */
export const reverse = <A>(edge: Edge<A>): Edge<A> => make(edge.to, edge.from)

/**
 * Checks if an edge is a self-loop (from === to).
 *
 * @since 1.0.0
 * @category predicates
 */
export const isSelfLoop = <A>(edge: Edge<A>): boolean => Equal.equals(edge.from, edge.to)

// -----------------------------------------------------------------------------
// #region Instances
// -----------------------------------------------------------------------------

/**
 * Equivalence instance for Edge.
 *
 * @since 1.0.0
 * @category instances
 */
export const getEquivalence = <A>(): Equivalence.Equivalence<Edge<A>> => Equal.equivalence<Edge<A>>()
