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
export const EntityURI = pipe(
  Schema.String,
  Schema.brand("EntityURI"),
  Schema.annotations({
    identifier: "EntityURI",
    title: "Entity URI",
    description: "A valid URI identifying an RDF entity"
  })
)

/**
 * @since 1.0.0
 * @category models
 */
export type EntityURI = Schema.Schema.Type<typeof EntityURI>

const EntityTypeId: unique symbol = Symbol.for("RDF/Entity")
export type EntityTypeId = typeof EntityTypeId

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
}

/**
 * @since 1.0.0
 * @category models
 */
export const PredicateURI = pipe(
  Schema.String,
  Schema.brand("PredicateURI"),
  Schema.annotations({
    identifier: "Predicate",
    title: "Predicate URI",
    description: "A valid URI identifying an RDF predicate"
  })
)

const PredicateTypeId: unique symbol = Symbol.for("RDF/Predicate")
export type PredicateTypeId = typeof PredicateTypeId

/**
 * @since 1.0.0
 * @category models
 */
export type PredicateURI = Schema.Schema.Type<typeof PredicateURI>

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

// ============================================================================
// Triple Metadata
// ============================================================================

// ============================================================================
// Triple
// ============================================================================

const TypeId: unique symbol = Symbol.for("RDF/Triple")

/**
 * @since 1.0.0
 * @category type ids
 */
export type TypeId = typeof TypeId

export type TripleURI = Schema.Schema.Type<typeof TripleURI>
export const TripleURI = Schema.TemplateLiteralParser(
  EntityURI,
  Schema.Literal("/"),
  PredicateURI,
  Schema.Literal("/"),
  EntityURI
)

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

  getId(): TripleURI {
    return this.id
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

  Id(): TripleURI {
    return Schema.decodeUnknownSync(TripleURI)(`${this.subject.id}/${this.predicate.id}/${this.object.id}`)
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
