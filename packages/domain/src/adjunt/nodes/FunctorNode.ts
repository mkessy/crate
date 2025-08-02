import { Schema as S } from "effect"
import { FunctorId, SchemaId, StrategyId } from "../core/Brand.js"

// LLM prompt configuration
const PromptConfig = S.Struct({
  template: S.String,
  // Variables to inject into the prompt
  variables: S.optional(S.Record({ key: S.String, value: S.String })),
  // Expected output format
  outputFormat: S.optional(S.Literal("json", "yaml", "code")),
  // Model preferences
  modelPreferences: S.optional(
    S.Struct({
      temperature: S.optional(S.Number),
      maxTokens: S.optional(S.Number),
      model: S.optional(S.String)
    })
  )
})

// Encoded representation
const EncodedFunctorNode = S.Struct({
  _tag: S.Literal("FunctorNode"),
  id: FunctorId,
  name: S.String,
  description: S.optional(S.String),
  // The prompt configuration for the LLM
  promptConfig: PromptConfig,
  // The schema of the expected generated strategy
  targetStrategyMetadata: S.Struct({
    recursionScheme: S.String,
    inputSchemaId: SchemaId,
    outputSchemaId: SchemaId,
    contextSchemaId: S.optional(SchemaId)
  }),
  // Previously generated strategies (for caching/learning)
  generatedStrategyIds: S.Array(StrategyId),
  createdAt: S.DateTimeUtc
})

// Live API class
export class FunctorNode extends S.Class<FunctorNode>("FunctorNode")(
  EncodedFunctorNode
) {
  static make(params: {
    id: string
    name: string
    promptTemplate: string
    targetRecursionScheme: string
    inputSchemaId: string
    outputSchemaId: string
    description?: string
    promptVariables?: Record<string, string>
    outputFormat?: "json" | "yaml" | "code"
    contextSchemaId?: string
    modelPreferences?: {
      temperature?: number
      maxTokens?: number
      model?: string
    }
  }): FunctorNode {
    return new FunctorNode({
      _tag: "FunctorNode",
      id: FunctorId.make(params.id),
      name: params.name,
      description: params.description,
      promptConfig: {
        template: params.promptTemplate,
        variables: params.promptVariables,
        outputFormat: params.outputFormat,
        modelPreferences: params.modelPreferences
      },
      targetStrategyMetadata: {
        recursionScheme: params.targetRecursionScheme,
        inputSchemaId: SchemaId.make(params.inputSchemaId),
        outputSchemaId: SchemaId.make(params.outputSchemaId),
        contextSchemaId: params.contextSchemaId
          ? SchemaId.make(params.contextSchemaId)
          : undefined
      },
      generatedStrategyIds: [],
      createdAt: new Date()
    })
  }

  // Add a generated strategy reference
  addGeneratedStrategy(strategyId: string): FunctorNode {
    return new FunctorNode({
      ...this,
      generatedStrategyIds: [
        ...this.generatedStrategyIds,
        StrategyId.make(strategyId)
      ]
    })
  }
}
