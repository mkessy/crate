import { Monoid, Semigroup } from "@effect/typeclass"
import { Data, Equal, Hash, HashMap, HashSet, Order, ParseResult, pipe, Schema, String } from "effect"
import type * as Triple from "./Entity.js"

const TypeId: unique symbol = Symbol.for("@effect/rdf/FieldValue")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

export class FieldValue<A> extends Data.Class<{
  readonly content: A
  readonly sources: HashSet.HashSet<Triple.EntityURI>
  readonly boost: number
  readonly attributes: HashMap.HashMap<string, unknown>
}> {
  readonly [TypeId]: TypeId = TypeId;

  [Hash.symbol](): number {
    return pipe(
      Hash.hash(this.content),
      Hash.combine(Hash.number(this.boost)),
      Hash.combine(Hash.hash(this.sources))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return isFieldValue(that) &&
      Equal.equals(this.content, that.content) &&
      this.boost === that.boost &&
      Equal.equals(this.sources, that.sources)
  }
}

/**
 * Creates a Schema for `FieldValue<A>` given a schema for its content `A`.
 *
 * @since 1.0.0
 * @category schemas
 */
export const schema = <A, I, R>(
  item: Schema.Schema<A, I, R>
): Schema.Schema<FieldValue<A>, {
  readonly content: A
  readonly sources: HashSet.HashSet<Triple.EntityURI>
  readonly boost: number
  readonly attributes: HashMap.HashMap<string, unknown>
}, R> => {
  // Define schemas for the other fields once

  Schema.declare(
    [item],
    {
      // --- DECODING LOGIC ---
      decode: (content) => (input, parseOptions, ast) => {
        if (typeof input !== "object" || input === null) {
          return ParseResult.fail(new ParseResult.Type(ast, input))
        }
        const contentResult = ParseResult.decodeUnknownSync(item)(input.content)

        // If all fields decode successfully, construct the FieldValue
        return ParseResult.succeed(
          new FieldValue({
            content: contentResult,
            sources: input.sources,
            boost: input.boost,
            attributes: input.attributes
          })
        )
      },
      // --- ENCODING LOGIC ---
      encode: (content) => (input, parseOptions, ast) => {
        if (!isFieldValue(input)) {
          return ParseResult.fail(new ParseResult.Type(ast, input))
        }
        // Use Effect's built-in encoders for each field
        const contentResult = ParseResult.encodeUnknown(content)(input.content, parseOptions)
        const sourcesResult = ParseResult.encodeUnknown(sourcesSchema)(input.sources, parseOptions)
        const boostResult = ParseResult.encodeUnknown(boostSchema)(input.boost, parseOptions)
        const attributesResult = ParseResult.encodeUnknown(attributesSchema)(input.attributes, parseOptions)

        // If all fields encode successfully, construct the encoded object
        return ParseResult.succeed({
          content: contentResult,
          sources: sourcesResult,
          boost: boostResult,
          attributes: attributesResult
        })
      }
    }
  )
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isFieldValue = (u: unknown): u is FieldValue<unknown> => u instanceof FieldValue

/**
 * @since 1.0.0
 * @category constructors
 */
export const empty: FieldValue = FieldValue.make({
  content: String.empty,
  sources: HashSet.empty(),
  attributes: HashMap.empty()
})

/**
 * @since 1.0.0
 * @category constructors
 */
export const make = (params: {
  readonly content: string
  readonly sources?: HashSet.HashSet<Triple.EntityURI>
  readonly boost?: number
  readonly attributes?: HashMap.HashMap<string, unknown>
}): FieldValue =>
  FieldValue.make({
    content: params.content,
    sources: params.sources ?? HashSet.empty(),
    boost: params.boost ?? 0.2, // TODO: what exactly should be the default boost?
    attributes: params.attributes ?? HashMap.empty()
  })

/**
 * @since 1.0.0
 * @category constructors
 */
export const fromTriple = (triple: Triple.Triple, toString: (triple: Triple.Triple) => string): FieldValue =>
  make({
    content: toString(triple),
    sources: HashSet.make(triple.subject),
    boost: triple.metadata.confidence,
    attributes: HashMap.make(["predicate", triple.predicate])
  })

/**
 * @since 1.0.0
 * @category combinators
 */
export const withContent = (content: string) => (self: FieldValue): FieldValue => FieldValue.make({ ...self, content })

/**
 * @since 1.0.0
 * @category combinators
 */
export const withBoost = (boost: number) => (self: FieldValue): FieldValue => FieldValue.make({ ...self, boost })

/**
 * @since 1.0.0
 * @category combinators
 */
export const addSource = (source: Triple.EntityURI) => (self: FieldValue): FieldValue =>
  FieldValue.make({
    ...self,
    sources: HashSet.add(self.sources, source)
  })

/**
 * @since 1.0.0
 * @category combinators
 */
export const setAttribute = (key: string, value: unknown) => (self: FieldValue): FieldValue =>
  FieldValue.make({
    ...self,
    attributes: HashMap.set(self.attributes, key, value)
  })

/**
 * @since 1.0.0
 * @category combinators
 */
export const combine = (self: FieldValue, that: FieldValue): FieldValue =>
  FieldValue.make({
    content: String.concat(self.content, that.content),
    sources: HashSet.union(self.sources, that.sources),
    boost: Math.max(self.boost, that.boost),
    attributes: HashMap.union(self.attributes, that.attributes)
  })

/**
 * @since 1.0.0
 * @category instances
 */
export const SemigroupInstance: Semigroup.Semigroup<FieldValue> = Semigroup.make(combine)

/**
 * @since 1.0.0
 * @category instances
 */
export const MonoidInstance: Monoid.Monoid<FieldValue> = Monoid.fromSemigroup(SemigroupInstance, empty)

/**
 * @since 1.0.0
 * @category instances
 */
export const OrderInstance: Order.Order<FieldValue> = pipe(
  Order.number,
  Order.mapInput((fv: FieldValue) => fv.boost),
  Order.reverse,
  Order.combine(
    pipe(
      Order.number,
      Order.mapInput((fv: FieldValue) => fv.content.length)
    )
  )
)

/**
 * @since 1.0.0
 * @category combinators
 */
export const combineAll = (values: ReadonlyArray<FieldValue>): FieldValue => Monoid.combineAll(MonoidInstance)(values)
