import { Schema } from "effect"

/**
 * @since 1.0.0
 * @category models
 */
export const OneToOne = Schema.TaggedStruct("OneToOne", {})

/**
 * @since 1.0.0
 * @category models
 */
export type OneToOne = Schema.Schema.Type<typeof OneToOne>

/**
 * @since 1.0.0
 * @category models
 */
export const OneToMany = Schema.TaggedStruct("OneToMany", {
  max: Schema.Number.pipe(Schema.propertySignature, Schema.withConstructorDefault(() => Infinity))
})

/**
 * @since 1.0.0
 * @category models
 */
export type OneToMany = Schema.Schema.Type<typeof OneToMany>

/**
 * @since 1.0.0
 * @category models
 */
export const ManyToOne = Schema.TaggedStruct("ManyToOne", {})

/**
 * @since 1.0.0
 * @category models
 */
export type ManyToOne = Schema.Schema.Type<typeof ManyToOne>

/**
 * @since 1.0.0
 * @category models
 */
export const ManyToMany = Schema.TaggedStruct("ManyToMany", {
  maxSource: Schema.Number.pipe(Schema.propertySignature, Schema.withConstructorDefault(() => Infinity)),
  maxTarget: Schema.Number.pipe(Schema.propertySignature, Schema.withConstructorDefault(() => Infinity))
})

/**
 * @since 1.0.0
 * @category models
 */
export type ManyToMany = Schema.Schema.Type<typeof ManyToMany>

/**
 * @since 1.0.0
 * @category models
 */
export const Cardinality = Schema.Union(
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany
)

/**
 * @since 1.0.0
 * @category models
 */
export const Many: ManyToMany = ManyToMany.make()

/**
 * @since 1.0.0
 * @category models
 */
export const One: OneToOne = OneToOne.make()

/**
 * @since 1.0.0
 * @category models
 */
export type Cardinality = Schema.Schema.Type<typeof Cardinality>

/**
 * @since 1.0.0
 * @category refinements
 */
export const isOneToOne = (c: Cardinality): c is OneToOne => Schema.is(OneToOne)(c)

/**
 * @since 1.0.0
 * @category refinements
 */
export const isOneToMany = (c: Cardinality): c is OneToMany => Schema.is(OneToMany)(c)

/**
 * @since 1.0.0
 * @category refinements
 */
export const isManyToOne = (c: Cardinality): c is ManyToOne => Schema.is(ManyToOne)(c)

/**
 * @since 1.0.0
 * @category refinements
 */
export const isManyToMany = (c: Cardinality): c is ManyToMany => Schema.is(ManyToMany)(c)

/**
 * @since 1.0.0
 * @category constructors
 */
export const oneToOne = (): OneToOne => OneToOne.make()

/**
 * @since 1.0.0
 * @category constructors
 */
export const oneToMany = (max?: number): OneToMany => OneToMany.make({ max: max ?? Infinity })

/**
 * @since 1.0.0
 * @category constructors
 */
export const manyToOne = (): ManyToOne => ManyToOne.make()

/**
 * @since 1.0.0
 * @category constructors
 */
export const manyToMany = (maxSource?: number, maxTarget?: number): ManyToMany =>
  ManyToMany.make({
    maxSource: maxSource ?? Infinity,
    maxTarget: maxTarget ?? Infinity
  })
