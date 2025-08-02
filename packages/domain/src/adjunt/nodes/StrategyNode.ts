import { Schema as S } from "effect"
import type { RecursionScheme } from "../core/RecursionScheme"
import { RecursionScheme as RecursionSchemeSchema } from "../core/RecursionScheme"
import { StrategyId, SchemaId } from "../core/Brand"

// Strategy metadata for the logic transformation
const StrategyMetadata = S.Struct({
  inputSchemaId: SchemaId,
  outputSchemaId: SchemaId,
  // Context schema for the L functor
  contextSchemaId: S.optional(SchemaId),
  // Whether this strategy is effectful
  isEffectful: S.Boolean,
  // Performance hints
  parallelizable: S.optional(S.Boolean),
  cacheable: S.optional(S.Boolean),
})

// Encoded representation
const EncodedStrategyNode = S.Struct({
  _tag: S.Literal("StrategyNode"),
  id: StrategyId,
  name: S.String,
  description: S.optional(S.String),
  recursionScheme: RecursionSchemeSchema,
  metadata: StrategyMetadata,
  // Serialized transformation logic (could be code, AST, or reference)
  logic: S.Unknown,
  version: S.String,
  createdAt: S.DateTimeUtc,
})

// The actual transformation function type
export type StrategyTransform<A, B> = (input: A) => B

// Live API class
export class StrategyNode<
  Input = unknown,
  Output = unknown,
  Context = never
> extends S.Class<StrategyNode<Input, Output, Context>>("StrategyNode")(
  EncodedStrategyNode
) {
  // Keep the actual transformation logic in memory
  private _transform?: StrategyTransform<Input, Output>

  static make<I, O, C = never>(params: {
    id: string
    name: string
    recursionScheme: RecursionScheme
    inputSchemaId: string
    outputSchemaId: string
    transform: StrategyTransform<I, O>
    description?: string
    contextSchemaId?: string
    isEffectful?: boolean
    parallelizable?: boolean
    cacheable?: boolean
    version?: string
  }): StrategyNode<I, O, C> {
    const node = new StrategyNode({
      _tag: "StrategyNode",
      id: StrategyId.make(params.id),
      name: params.name,
      description: params.description,
      recursionScheme: params.recursionScheme,
      metadata: {
        inputSchemaId: SchemaId.make(params.inputSchemaId),
        outputSchemaId: SchemaId.make(params.outputSchemaId),
        contextSchemaId: params.contextSchemaId
          ? SchemaId.make(params.contextSchemaId)
          : undefined,
        isEffectful: params.isEffectful ?? false,
        parallelizable: params.parallelizable,
        cacheable: params.cacheable,
      },
      // Store a serializable representation
      logic: params.transform.toString(),
      version: params.version ?? "1.0.0",
      createdAt: new Date(),
    })
    // Attach the actual transform
    node._transform = params.transform
    return node
  }

  get transform(): StrategyTransform<Input, Output> | undefined {
    return this._transform
  }

  // Helper to check if this strategy requires context
  get requiresContext(): boolean {
    return this.metadata.contextSchemaId !== undefined
  }
}