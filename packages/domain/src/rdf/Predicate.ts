import { Equal, Hash, Schema } from "effect"
import { Cardinality } from "./Cardinality.js"
import { AttributeId, EntityType } from "./Entity.js"

/**
 * @since 1.0.0
 * @category models
 */
export type PredicateUri = Schema.Schema.Type<typeof PredicateUri>
export const PredicateUri = Schema.String.pipe(
  Schema.trimmed(),
  Schema.brand("PredicateUri")
)

const PredicateTypeId: unique symbol = Symbol.for("RDF/Predicate")
export type PredicateTypeId = typeof PredicateTypeId

export type PredicateSignature = Schema.Schema.Type<typeof PredicateSignature>
export const PredicateSignature = Schema.Struct({
  subject: EntityType,
  object: EntityType
}).pipe(Schema.brand("PredicateSignature"))

/**
 * @since 1.0.0
 * @category models
 */

export class Predicate extends Schema.Class<Predicate>("Predicate")({
  id: PredicateUri,
  forwardPhrase: Schema.String,
  reversePhrase: Schema.String,
  longForm: Schema.String,
  description: Schema.String,
  parent: Schema.Option(PredicateUri),
  cardinality0: Cardinality,
  cardinality1: Cardinality,
  attributes: Schema.ReadonlySet(AttributeId)
}, {
  disableValidation: true
}) {
  readonly [PredicateTypeId]: PredicateTypeId = PredicateTypeId;

  [Hash.symbol](): number {
    return Hash.hash(this.id)
  }

  [Equal.symbol](that: unknown): boolean {
    return that instanceof Predicate && this.id === that.id
  }
}

const PredicateGroupingTypeId: unique symbol = Symbol.for("RDF/PredicateGrouping")
export type PredicateGroupingTypeId = typeof PredicateGroupingTypeId

export class PredicateGrouping extends Schema.Class<PredicateGrouping>("PredicateGrouping")({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  predicates: Schema.NonEmptyArray(PredicateUri)
}, {
  disableValidation: true
}) {
  readonly [PredicateGroupingTypeId]: PredicateGroupingTypeId = PredicateGroupingTypeId
}
