import { Equal, Hash, pipe, Schema } from "effect"

// ============================================================================
// Core Types
// ============================================================================

/**
 * @since 1.0.0
 * @category models
 */
export const EntityUri = Schema.String.pipe(
  Schema.trimmed(),
  Schema.brand("EntityURI")
)

/**
 * @since 1.0.0
 * @category models
 */
export type EntityUri = Schema.Schema.Type<typeof EntityUri>

const EntityTypeId: unique symbol = Symbol.for("RDF/Entity")
export type EntityTypeId = typeof EntityTypeId

export const EntityType = Schema.String.pipe(Schema.brand("EntityType"))
export type EntityType = Schema.Schema.Type<typeof EntityType>

// Helper type to extract entity type from Entity or WithMetadata
export type ExtractEntityType<E> = E extends Entity | WithMetadata<any> ? E["type"]
  : E extends (id: string, value: any) => infer R ? R extends WithMetadata<any> & { type: infer T } ? T
    : never
  : never

export class Entity extends Schema.Class<Entity>("Entity")({
  id: EntityUri,
  type: Schema.String,
  parent: Schema.optional(EntityUri)
}, {
  disableValidation: true
}) {
  readonly [EntityTypeId]: EntityTypeId = EntityTypeId

  constructor(props: {
    readonly id: EntityUri
    readonly type: string
  }, options?: Schema.MakeOptions) {
    super(props, options)
  }

  [Hash.symbol](): number {
    return pipe(
      Hash.hash(this.id),
      Hash.combine(Hash.hash(this.type))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return (that instanceof WithMetadata || that instanceof Entity) &&
      Equal.equals(this.id, that.id) && Equal.equals(this.type, that.type)
  }

  static MakeClass(type: string): (id: string) => Entity {
    return (id: string) => {
      return Entity.make({ id: EntityUri.make(`crate://${type}/${id}`), type })
    }
  }
}

const MetadataTypeId: unique symbol = Symbol.for("RDF/Metadata")
export type MetadataTypeId = typeof MetadataTypeId

export class WithMetadata<A> extends Entity {
  readonly [MetadataTypeId]: MetadataTypeId = MetadataTypeId
  readonly value: A

  constructor(props: {
    readonly id: EntityUri
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
      Hash.combine(Hash.hash(this.type))
    )
  }

  [Equal.symbol](that: unknown): boolean {
    return (that instanceof WithMetadata || that instanceof Entity) &&
      Equal.equals(this.id, that.id) && Equal.equals(this.type, that.type)
  }

  static MakeWithMetadataClass<A, T extends string>(props: {
    readonly type: T
    readonly schema: Schema.Schema<A>
  }): (id: string, value: A) => WithMetadata<A> & { type: T } {
    return (id: string, value: A) => {
      const val = Schema.decodeUnknownSync(props.schema)(value)
      return WithMetadata.make({
        id: EntityUri.make(`crate://${props.type}/${id}`),
        type: props.type,
        value: val as A
      }) as WithMetadata<A> & { type: T }
    }
  }
}

// ============================================================================
// Relationship Attributes
// ============================================================================

const AttributeTypeId: unique symbol = Symbol.for("RDF/Attribute")
export type AttributeTypeId = typeof AttributeTypeId

export const AttributeId = Schema.String.pipe(Schema.brand("AttributeId"))
export type AttributeId = Schema.Schema.Type<typeof AttributeId>

export const AttributeType = Schema.String.pipe(Schema.brand("AttributeType"))
export type AttributeType = Schema.Schema.Type<typeof AttributeType>

/**
 * @since 1.0.0
 * @category models
 */
export class Attribute extends Schema.TaggedClass<Attribute>()("Attribute", {
  id: AttributeId,
  name: Schema.String,
  description: Schema.String,
  type: AttributeType,
  allowedValues: Schema.Set(Schema.String).pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => new Set<string>())
  )
}, {
  disableValidation: true
}) {
  readonly [AttributeTypeId]: AttributeTypeId = AttributeTypeId
}
