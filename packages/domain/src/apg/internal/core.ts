import type { Equal } from "effect/Equal"
import type { HashSet } from "effect/HashSet"
import type { Inspectable } from "effect/Inspectable"
import type { Pipeable } from "effect/Pipeable"
import type * as Types from "effect/Types"

// TypeId definition
export const GraphTypeId: unique symbol = Symbol.for("effect/Graph")
export type GraphTypeId = typeof GraphTypeId

// Graph kinds enum
export type GraphKind = "directed" | "undirected" | "reflexive" | "transitive"

// Core interface
export interface Graph<out A> extends Equal, Pipeable, Inspectable {
  readonly [GraphTypeId]: {
    readonly _A: Types.Covariant<A>
  }
  [Symbol.iterator](): Iterator<A>
}

// Implementation interface
export interface GraphImpl<A> extends Graph<A> {
  readonly kind: GraphKind
  readonly backing: GraphBacking<A>
  _relation: Relation<A> | undefined // Memoization cache
}

export interface IEmpty {
  readonly _tag: "Empty"
}
export interface IVertex<A> {
  readonly _tag: "Vertex"
  readonly value: A
}
export interface IOverlay<A> {
  readonly _tag: "Overlay"
  readonly left: Graph<A>
  readonly right: Graph<A>
}
export interface IConnect<A> {
  readonly _tag: "Connect"
  readonly left: Graph<A>
  readonly right: Graph<A>
}
export interface IRelation<A> {
  readonly _tag: "Relation"
  readonly relation: Relation<A>
}

// Backing discriminated union
export type GraphBacking<A> =
  | IEmpty
  | IVertex<A>
  | IOverlay<A>
  | IConnect<A>
  | IRelation<A>

// Relation type
export type Relation<A> = {
  readonly vertices: HashSet<A>
  readonly edges: HashSet<readonly [A, A]>
}
