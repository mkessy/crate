import type * as TApplicative from "@effect/typeclass/Applicative"
import type * as TFoldable from "@effect/typeclass/Foldable"
import type * as TTraversable from "@effect/typeclass/Traversable"
import { Array, Data, Effect, pipe } from "effect"
import { dual } from "effect/Function"
import type { Kind, TypeLambda } from "effect/HKT"
import type * as Entity from "./Entity.js"

// Import the Array traversable instance
import * as ArrayTraversable from "@effect/typeclass/data/Array"

/**
 * Type lambda for KnowledgeGraph - defines how the type constructor works
 * @since 1.0.0
 * @category type lambdas
 */
export interface KnowledgeGraphTypeLambda extends TypeLambda {
  readonly type: KnowledgeGraph<this["Target"]>
}

/**
 * A schema-aware, traversable knowledge graph
 * @since 1.0.0
 * @category models
 */
export interface KnowledgeGraph<A> {
  readonly triples: ReadonlyArray<A>

  // Core typeclass methods
  reduce<B>(b: B, f: (b: B, a: A) => B): B
  traverse<F extends TypeLambda>(
    F: TApplicative.Applicative<F>
  ): <R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ) => Kind<F, R, O, E, KnowledgeGraph<B>>

  // Graph-specific operations
  filter(f: (a: A) => boolean): TripleGraph<A>
}

/**
 * Main implementation of KnowledgeGraph
 * @since 1.0.0
 * @category models
 */
export class TripleGraph<A> implements KnowledgeGraph<A> {
  constructor(readonly triples: ReadonlyArray<A>) {}

  [Symbol.iterator](): Iterator<A> {
    return this.triples[Symbol.iterator]()
  }

  // --- Foldable implementation ---
  reduce<B>(b: B, f: (b: B, a: A) => B): B {
    return Array.reduce(this.triples, b, f)
  }

  // --- Traversable implementation ---
  traverse<F extends TypeLambda>(
    F: TApplicative.Applicative<F>
  ): <R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ) => Kind<F, R, O, E, KnowledgeGraph<B>> {
    return <R, O, E, B>(f: (a: A) => Kind<F, R, O, E, B>) =>
      pipe(
        ArrayTraversable.Traversable.traverse(F)(this.triples, f),
        F.map((newTriples) => new TripleGraph(newTriples) as KnowledgeGraph<B>)
      )
  }

  // --- Graph-specific operations ---
  filter(f: (a: A) => boolean): TripleGraph<A> {
    return new TripleGraph(Array.filter(this.triples, f))
  }
}

// --- Constructors ---

export const empty = <A = Entity.Triple>(): TripleGraph<A> => new TripleGraph<A>([])

export const fromArray = <A = Entity.Triple>(triples: ReadonlyArray<A>): TripleGraph<A> => new TripleGraph(triples)

export const of = <A = Entity.Triple>(triple: A): TripleGraph<A> => new TripleGraph([triple])

// --- Combinators ---

export const combine = <A>(first: TripleGraph<A>, second: TripleGraph<A>): TripleGraph<A> =>
  new TripleGraph([...first.triples, ...second.triples])

export const map = <A, B>(self: TripleGraph<A>, f: (a: A) => B): TripleGraph<B> =>
  new TripleGraph(Array.map(self.triples, f))

export const flatMap = <A, B>(
  self: TripleGraph<A>,
  f: (a: A) => TripleGraph<B>
): TripleGraph<B> =>
  new TripleGraph(
    Array.flatMap(self.triples, (a) => f(a).triples)
  )

// --- Typeclass Instances ---

/**
 * Get the Traversable instance for KnowledgeGraph
 * @since 1.0.0
 * @category instances
 */
export const Traversable: TTraversable.Traversable<KnowledgeGraphTypeLambda> = {
  traverse: <F extends TypeLambda>(F: TApplicative.Applicative<F>) =>
    dual(
      2,
      <A, R, O, E, B>(
        self: KnowledgeGraph<A>,
        f: (a: A) => Kind<F, R, O, E, B>
      ): Kind<F, R, O, E, KnowledgeGraph<B>> => self.traverse(F)(f)
    )
}

/**
 * Get the Foldable instance for KnowledgeGraph
 * @since 1.0.0
 * @category instances
 */
export const Foldable: TFoldable.Foldable<KnowledgeGraphTypeLambda> = {
  reduce: <A, B>(_b: B, _f: (b: B, a: A) => B) =>
    dual(
      3,
      <A, B>(
        self: KnowledgeGraph<A>,
        b: B,
        f: (b: B, a: A) => B
      ): B => self.reduce(b, f)
    )
}

// --- Effect-based Operations ---

export class CardinalityViolation extends Data.TaggedError("CardinalityViolation")<{
  readonly message: string
}> {}

export const validateCardinality = <A extends Entity.Triple>(
  self: KnowledgeGraph<A>
): Effect.Effect<KnowledgeGraph<A>, CardinalityViolation> => Effect.succeed(self)

export const load = <R, E>(
  loader: Effect.Effect<ReadonlyArray<Entity.Triple>, E, R>
): Effect.Effect<KnowledgeGraph<Entity.Triple>, E, R> =>
  pipe(
    loader,
    Effect.map(fromArray)
  )
