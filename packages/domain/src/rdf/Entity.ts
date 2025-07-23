import { Equal, Hash, pipe, Schema } from "effect"
import type { Any } from "effect/Schema"
import { Cardinality } from "./Cardinality.js"

// ============================================================================
// Core Types
// ============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export const EntityURI = Schema.String.pipe(
  Schema.trimmed(),
  Schema.brand("EntityURI")
)

/**
 * @since 1.0.0
 * @category models
 */
export type EntityURI = Schema.Schema.Type<typeof EntityURI>

const EntityTypeId: unique symbol = Symbol.for("RDF/Entity")
export type EntityTypeId = typeof EntityTypeId

// Helper type to extract entity type from Entity or WithMetadata
export type ExtractEntityType<E> = E extends Entity | WithMetadata<any> ? E["type"]
  : E extends (id: string, value: any) => infer R ? R extends WithMetadata<any> & { type: infer T } ? T
    : never
  : never

export class Entity extends Schema.Class<Entity>("Entity")({
  id: EntityURI,
  type: Schema.String
}, {
  disableValidation: true
}) {
  readonly [EntityTypeId]: EntityTypeId = EntityTypeId;

  [Hash.symbol](): number {
    return pipe(
      Hash.hash(this.id),
      Hash.combine(Hash.hash(this.type))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return (that instanceof Entity) && this.id === that.id && this.type === that.type
  }

  static MakeClass(type: string): (id: string) => Entity {
    return (id: string) => {
      return Entity.make({ id: EntityURI.make(`crate://${type}/${id}`), type })
    }
  }
}

const MetadataTypeId: unique symbol = Symbol.for("RDF/Metadata")
export type MetadataTypeId = typeof MetadataTypeId

export class WithMetadata<A> extends Entity {
  readonly [MetadataTypeId]: MetadataTypeId = MetadataTypeId
  readonly value: A

  constructor(props: {
    readonly id: EntityURI
    readonly type: string
    readonly value: A
  }, options?: Schema.MakeOptions) {
    super({
      id: props.id,
      type: props.type
    }, options)
    this.value = props.value
  }

  [Hash.symbol](): number {
    return pipe(
      Hash.hash(this.id),
      Hash.combine(Hash.hash(this.type)),
      Hash.combine(Hash.hash(this.value))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return (that instanceof WithMetadata || that instanceof Entity) &&
      this.id === that.id && this.type === that.type
  }

  static MakeWithMetadataClass<A, T extends string>(props: {
    readonly type: T
    readonly schema: Schema.Schema<A>
  }): (id: string, value: A) => WithMetadata<A> & { type: T } {
    return (id: string, value: A) => {
      const val = Schema.decodeUnknownSync(props.schema)(value)
      return WithMetadata.make({
        id: EntityURI.make(`crate://${props.type}/${id}`),
        type: props.type,
        value: val as A
      }) as WithMetadata<A> & { type: T }
    }
  }
}

/**
 * @since 1.0.0
 * @category models
 */
export type PredicateURI = Schema.Schema.Type<typeof PredicateURI>
export const PredicateURI = Schema.String.pipe(
  Schema.trimmed(),
  Schema.brand("PredicateURI")
)

const PredicateTypeId: unique symbol = Symbol.for("RDF/Predicate")
export type PredicateTypeId = typeof PredicateTypeId

/**
 * @since 1.0.0
 * @category models
 */

export class Predicate extends Schema.Class<Predicate>("Predicate")({
  id: PredicateURI,
  forwardPhrase: Schema.String,
  reversePhrase: Schema.String,
  longForm: Schema.String,
  description: Schema.String,
  cardinality0: Cardinality,
  cardinality1: Cardinality
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
  predicates: Schema.NonEmptyArray(Predicate)
}, {
  disableValidation: true
}) {
  readonly [PredicateGroupingTypeId]: PredicateGroupingTypeId = PredicateGroupingTypeId
}

// ============================================================================
// Relationship Attributes
// ============================================================================

const AttributeTypeId: unique symbol = Symbol.for("RDF/Attribute")
export type AttributeTypeId = typeof AttributeTypeId

export type AttributeId = Schema.Schema.Type<typeof AttributeId>
export const AttributeId = Schema.String.pipe(Schema.brand("AttributeId"))

/**
 * @since 1.0.0
 * @category models
 */
export class Attribute extends Schema.TaggedClass<Attribute>()("Attribute", {
  id: AttributeId,
  name: Schema.String,
  description: Schema.String
}, {
  disableValidation: true
}) {
  readonly [AttributeTypeId]: AttributeTypeId = AttributeTypeId
}

const TypeId: unique symbol = Symbol.for("RDF/Triple")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

export type TripleURI = Schema.Schema.Encoded<typeof TripleURI>
export const TripleURI = Schema.TemplateLiteralParser(
  EntityURI,
  "/",
  PredicateURI,
  "/",
  EntityURI
)
export const TripleURIMake = (subject: EntityURI, predicate: PredicateURI, object: EntityURI): TripleURI =>
  Schema.encodeSync(TripleURI)([subject, "/", predicate, "/", object])

export type Direction = Schema.Schema.Type<typeof Direction>
export const Direction = Schema.Union(Schema.Literal("forward"), Schema.Literal("reverse"))

/**
 * @since 1.0.0
 * @category models
 */
export class Triple extends Schema.TaggedClass<Triple>()("Triple", {
  id: TripleURI,
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
      Hash.combine(Hash.hash(this.direction)),
      Hash.combine(Hash.array(this.attributes))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return (that instanceof Triple) && this.subject.id === that.subject.id &&
      this.predicate.id === that.predicate.id &&
      this.object.id === that.object.id &&
      this.direction === that.direction
  }

  getId(): string {
    return Schema.encodeSync(TripleURI)(this.id)
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
      id: Schema.decodeUnknownSync(TripleURI)(`${params.subject.id}/${params.predicate.id}/${params.object.id}`),
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
