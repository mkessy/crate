import type * as TApplicative from "@effect/typeclass/Applicative"
import type * as TCovariant from "@effect/typeclass/Covariant"
import type * as TFoldable from "@effect/typeclass/Foldable"
import type * as TTraversable from "@effect/typeclass/Traversable"
import { Chunk, Data, Effect, pipe } from "effect"
import { dual } from "effect/Function"
import type { Kind, TypeLambda } from "effect/HKT"
import type { Triple } from "./Triple.js"

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
  readonly triples: Chunk.Chunk<A>

  // Core typeclass methods
  map<B>(f: (a: A) => B): KnowledgeGraph<B>
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
  constructor(readonly triples: Chunk.Chunk<A>) {}

  [Symbol.iterator](): Iterator<A> {
    return this.triples[Symbol.iterator]()
  }

  // --- Functor implementation ---
  map<B>(f: (a: A) => B): KnowledgeGraph<B> {
    return new TripleGraph(Chunk.map(this.triples, f))
  }

  // --- Foldable implementation ---
  reduce<B>(b: B, f: (b: B, a: A) => B): B {
    return Chunk.reduce(this.triples, b, f)
  }

  // --- Traversable implementation ---
  traverse<F extends TypeLambda>(
    F: TApplicative.Applicative<F>
  ): <R, O, E, B>(
    f: (a: A) => Kind<F, R, O, E, B>
  ) => Kind<F, R, O, E, KnowledgeGraph<B>> {
    return <R, O, E, B>(f: (a: A) => Kind<F, R, O, E, B>) =>
      pipe(
        ArrayTraversable.Traversable.traverse(F)(Chunk.toReadonlyArray(this.triples), f),
        F.map((newTriples) => new TripleGraph(Chunk.fromIterable(newTriples)) as KnowledgeGraph<B>)
      )
  }

  // --- Graph-specific operations ---
  filter(f: (a: A) => boolean): TripleGraph<A> {
    return new TripleGraph(Chunk.filter(this.triples, f))
  }
}

// --- Constructors ---

export const make = <A = Triple>(triples: Iterable<A>): TripleGraph<A> => new TripleGraph(Chunk.fromIterable(triples))

export const empty = <A = Triple>(): TripleGraph<A> => new TripleGraph<A>(Chunk.empty())

export const fromChunk = <A = Triple>(triples: Chunk.Chunk<A>): TripleGraph<A> => new TripleGraph(triples)

export const fromArray = <A = Triple>(triples: ReadonlyArray<A>): TripleGraph<A> =>
  new TripleGraph(Chunk.fromIterable(triples))

export const of = <A = Triple>(triple: A): TripleGraph<A> => new TripleGraph(Chunk.of(triple))

// --- Combinators ---

export const combine = <A>(first: TripleGraph<A>, second: TripleGraph<A>): TripleGraph<A> =>
  new TripleGraph(Chunk.appendAll(first.triples, second.triples))

export const map = <A, B>(self: TripleGraph<A>, f: (a: A) => B): TripleGraph<B> =>
  new TripleGraph(Chunk.map(self.triples, f))

export const flatMap = <A, B>(
  self: TripleGraph<A>,
  f: (a: A) => TripleGraph<B>
): TripleGraph<B> =>
  new TripleGraph(
    Chunk.flatMap(self.triples, (a) => f(a).triples)
  )

// --- Covariant operations ---

export const as = <A, B>(self: KnowledgeGraph<A>, b: B): KnowledgeGraph<B> => Covariant.map(self, () => b)

export const asVoid = <A>(self: KnowledgeGraph<A>): KnowledgeGraph<void> => as(self, undefined)

export const toArray = <A>(self: KnowledgeGraph<A>): ReadonlyArray<A> => Chunk.toReadonlyArray(self.triples)

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
 * Get the Covariant instance for KnowledgeGraph
 * @since 1.0.0
 * @category instances
 */
export const Covariant: TCovariant.Covariant<KnowledgeGraphTypeLambda> = {
  map: dual(
    2,
    <A, B>(
      self: KnowledgeGraph<A>,
      f: (a: A) => B
    ): KnowledgeGraph<B> => self.map(f)
  ),
  imap: dual(
    3,
    <A, B>(
      self: KnowledgeGraph<A>,
      to: (a: A) => B,
      _from: (b: B) => A
    ): KnowledgeGraph<B> => self.map(to)
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

export const validateCardinality = <A extends Triple>(
  self: KnowledgeGraph<A>
): Effect.Effect<KnowledgeGraph<A>, CardinalityViolation> => Effect.succeed(self)

export const load = <R, E>(
  loader: Effect.Effect<Chunk.Chunk<Triple>, E, R>
): Effect.Effect<KnowledgeGraph<Triple>, E, R> =>
  pipe(
    loader,
    Effect.map(fromChunk)
  )

export const loadFromChunk = <R, E>(
  loader: Effect.Effect<Chunk.Chunk<Triple>, E, R>
): Effect.Effect<KnowledgeGraph<Triple>, E, R> =>
  pipe(
    loader,
    Effect.map(fromChunk)
  )
