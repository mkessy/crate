import type { Effect, Option, Schema as S } from "effect"
import { Context } from "effect"
import type { AlgebraicPropertyGraph } from "../../core/CanonicalGraph"
import type { RecursionScheme } from "../../core/RecursionScheme"
import type { AnyNode, FunctorNode, SchemaNode, StrategyNode } from "../../nodes"

// ============================================================================
// Prompt Types
// ============================================================================

export interface PromptTemplate {
  readonly system: string
  readonly user: string
  readonly examples: ReadonlyArray<Example>
  readonly constraints: ReadonlyArray<string>
  readonly outputFormat: OutputFormat
  readonly temperature?: number
  readonly maxTokens?: number
}

export interface Example {
  readonly input: string
  readonly output: string
  readonly explanation?: string
}

export interface OutputFormat {
  readonly type: "json" | "yaml" | "code" | "natural"
  readonly schema?: S.Schema<any>
  readonly language?: string // for code output
}

// ============================================================================
// Domain-Aware Prompt Building
// ============================================================================

export interface PromptBuilder extends Context.Tag.Service<PromptBuilder> {
  // Convert domain objects to prompts
  readonly fromNode: (node: AnyNode) => Effect.Effect<string>
  readonly fromGraph: (graph: AlgebraicPropertyGraph<any>) => Effect.Effect<string>
  readonly fromSchema: <A, I>(schema: SchemaNode<A, I>) => Effect.Effect<string>

  // Strategy generation prompts
  readonly strategyGeneration: (
    functor: FunctorNode,
    context?: {
      readonly inputSamples?: ReadonlyArray<unknown>
      readonly outputSamples?: ReadonlyArray<unknown>
      readonly existingStrategies?: ReadonlyArray<StrategyNode<any, any>>
    }
  ) => Effect.Effect<PromptTemplate>

  // Schema inference prompts
  readonly schemaInference: (
    samples: ReadonlyArray<unknown>,
    hints?: {
      readonly expectedType?: string
      readonly constraints?: ReadonlyArray<string>
    }
  ) => Effect.Effect<PromptTemplate>

  // Optimization prompts
  readonly optimizationHints: (
    strategies: ReadonlyArray<StrategyNode<any, any>>,
    metrics: Record<string, number>
  ) => Effect.Effect<PromptTemplate>

  // Graph transformation prompts
  readonly graphTransformation: (
    sourceGraph: AlgebraicPropertyGraph<any>,
    targetSchema: SchemaNode<any, any>
  ) => Effect.Effect<PromptTemplate>
}

export class PromptBuilder extends Context.Tag("PromptBuilder")<PromptBuilder>() {}

// ============================================================================
// LLM Service Interface
// ============================================================================

export interface LLMService extends Context.Tag.Service<LLMService> {
  // Core LLM operations
  readonly complete: (
    prompt: PromptTemplate
  ) => Effect.Effect<string, LLMError>

  readonly generateStrategy: (
    functor: FunctorNode,
    context?: LLMContext
  ) => Effect.Effect<StrategyNode<any, any>, LLMError>

  readonly validateGeneration: (
    strategy: StrategyNode<any, any>,
    functor: FunctorNode
  ) => Effect.Effect<ValidationResult>

  // Advanced operations
  readonly improveStrategy: (
    strategy: StrategyNode<any, any>,
    feedback: StrategyFeedback
  ) => Effect.Effect<StrategyNode<any, any>, LLMError>

  readonly explainTransformation: (
    input: unknown,
    output: unknown,
    strategy: StrategyNode<any, any>
  ) => Effect.Effect<string, LLMError>

  readonly suggestOptimizations: (
    graph: AlgebraicPropertyGraph<any>,
    performanceMetrics: PerformanceMetrics
  ) => Effect.Effect<ReadonlyArray<OptimizationSuggestion>, LLMError>
}

export class LLMService extends Context.Tag("LLMService")<LLMService>() {}

// ============================================================================
// Supporting Types
// ============================================================================

export interface LLMContext {
  readonly availableSchemas: ReadonlyArray<SchemaNode<any, any>>
  readonly availableStrategies: ReadonlyArray<StrategyNode<any, any>>
  readonly performanceConstraints?: PerformanceConstraints
  readonly domainContext?: string
}

export interface ValidationResult {
  readonly valid: boolean
  readonly confidence: number // 0-1
  readonly issues: ReadonlyArray<{
    readonly severity: "error" | "warning"
    readonly message: string
  }>
}

export interface StrategyFeedback {
  readonly executionErrors?: ReadonlyArray<string>
  readonly performanceIssues?: ReadonlyArray<string>
  readonly correctnessIssues?: ReadonlyArray<{
    readonly input: unknown
    readonly expectedOutput: unknown
    readonly actualOutput: unknown
  }>
}

export interface PerformanceMetrics {
  readonly executionTime: Duration.Duration
  readonly memoryUsage: number
  readonly throughput: number
  readonly errorRate: number
}

export interface PerformanceConstraints {
  readonly maxExecutionTime?: Duration.Duration
  readonly maxMemoryUsage?: number
  readonly minThroughput?: number
  readonly maxErrorRate?: number
}

export interface OptimizationSuggestion {
  readonly type: "fusion" | "parallelization" | "caching" | "algorithmic"
  readonly description: string
  readonly estimatedImprovement: number // percentage
  readonly implementation: Option.Option<StrategyNode<any, any>>
}

// ============================================================================
// Error Types
// ============================================================================

export class LLMError extends Context.Tag("LLMError")<
  LLMError,
  {
    readonly _tag: string
    readonly message: string
    readonly retryable: boolean
  }
>() {}

export class GenerationError extends LLMError {
  readonly _tag = "GenerationError"
  readonly retryable = true
}

export class ValidationError extends LLMError {
  readonly _tag = "ValidationError"
  readonly retryable = false
}

export class RateLimitError extends LLMError {
  readonly _tag = "RateLimitError"
  readonly retryable = true
}

// ============================================================================
// Prompt Templates Library
// ============================================================================

export namespace PromptTemplates {
  export const STRATEGY_GENERATION_SYSTEM = `You are an expert in functional programming and category theory.
Your task is to generate strategy implementations for data transformations.
You must ensure the generated code follows the adjoint fold recursion pattern.`

  export const SCHEMA_INFERENCE_SYSTEM = `You are a schema inference expert.
Analyze the provided data samples and infer the most appropriate schema.
Consider edge cases and ensure the schema is as specific as possible while covering all samples.`

  export const OPTIMIZATION_SYSTEM = `You are a performance optimization expert.
Analyze the provided strategies and metrics to suggest optimizations.
Focus on mathematical properties that enable safe transformations.`

  export const strategyGenerationUser = (
    recursionScheme: RecursionScheme,
    inputDesc: string,
    outputDesc: string
  ) =>
    `Generate a ${recursionScheme} strategy that transforms:
Input: ${inputDesc}
Output: ${outputDesc}

The strategy must:
1. Be pure and deterministic
2. Handle all edge cases
3. Be efficiently implementable
4. Follow the formal properties of ${recursionScheme}`

  export const schemaInferenceUser = (
    samples: ReadonlyArray<unknown>
  ) =>
    `Infer a schema from these samples:
${JSON.stringify(samples, null, 2)}

Requirements:
1. The schema should be as specific as possible
2. It should handle all provided samples
3. Consider potential edge cases not in the samples
4. Use algebraic data types where appropriate`
}
