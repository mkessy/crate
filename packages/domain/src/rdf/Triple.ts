import { Equal, Hash, pipe, Schema } from "effect"
import type { Any } from "effect/Schema"
import { Attribute, Entity, EntityUri, WithMetadata } from "./Entity.js"
import { Predicate, PredicateUri } from "./Predicate.js"

const TypeId: unique symbol = Symbol.for("RDF/Triple")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

export type TripleUri = Schema.Schema.Encoded<typeof TripleUri>
export const TripleUri = Schema.TemplateLiteralParser(
  EntityUri,
  "/",
  PredicateUri,
  "/",
  EntityUri
)
export const TripleURIMake = (subject: EntityUri, predicate: PredicateUri, object: EntityUri): TripleUri =>
  Schema.encodeSync(TripleUri)([subject, "/", predicate, "/", object])

export type Direction = Schema.Schema.Type<typeof Direction>
export const Direction = Schema.Union(Schema.Literal("forward"), Schema.Literal("reverse"))

/**
 * @since 1.0.0
 * @category models
 */
export class Triple extends Schema.TaggedClass<Triple>()("Triple", {
  id: TripleUri,
  subject: Schema.Union(Entity, WithMetadata),
  predicate: Predicate,
  object: Schema.Union(Entity, WithMetadata),
  attributes: Schema.Array(Attribute),
  direction: Schema.optional(Direction)
}, {
  disableValidation: true
}) {
  /**
   * @since 1.0.0
   */
  readonly [TypeId]: TypeId = TypeId;

  [Hash.symbol](): number {
    return pipe(
      Hash.hash(this.subject.id),
      Hash.combine(Hash.hash(this.predicate.id)),
      Hash.combine(Hash.hash(this.object.id)),
      Hash.combine(Hash.hash(this.direction))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return (that instanceof Triple) && this.subject.id === that.subject.id &&
      this.predicate.id === that.predicate.id &&
      this.object.id === that.object.id &&
      this.direction === that.direction
  }

  getId(): string {
    return Schema.encodeSync(TripleUri)(this.id)
  }

  getSubject(): Entity | WithMetadata<Any> {
    return this.subject
  }

  getPredicate(): Predicate {
    return this.predicate
  }

  getObject(): Entity | WithMetadata<Any> {
    return this.object
  }

  static Make(params: {
    readonly subject: Entity | WithMetadata<Any>
    readonly predicate: Predicate
    readonly object: Entity | WithMetadata<Any>
    readonly attributes: Array<Attribute>
    readonly direction?: Direction
  }): Triple {
    return Triple.make({
      id: Schema.decodeUnknownSync(TripleUri)(`${params.subject.id}/${params.predicate.id}/${params.object.id}`),
      subject: params.subject,
      predicate: params.predicate,
      object: params.object,
      direction: params.direction,
      attributes: params.attributes
    })
  }
}

/**
 * @since 1.0.0
 * @category refinements
 */
export const isTriple = (u: unknown): u is Triple => Schema.is(Triple)(u)
