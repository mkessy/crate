import { Effect, Stream, Option, Duration, Context, Layer } from "effect"
import type { CanonicalGraph, AlgebraicPropertyGraph } from "../../core/CanonicalGraph"
import type { NodeId, StrategyId, CorrelationId, SchemaId } from "../../core/Brand"
import type { AnyNode, StrategyNode, SchemaNode } from "../../nodes"
import type { RecursionScheme } from "../../core/RecursionScheme"

// ============================================================================
// Core Types
// ============================================================================

export interface ExecutionContext {
  readonly correlationId: CorrelationId
  readonly startTime: Date
  readonly metadata: Record<string, unknown>
}

export interface ExecutionStep {
  readonly id: string
  readonly type: "LoadSource" | "ApplyStrategy" | "Optimize" | "Generate"
  readonly nodeId: NodeId
  readonly dependencies: ReadonlyArray<string>
  readonly cacheKey?: string
  readonly estimatedCost?: number
}

export interface ExecutionPlan {
  readonly steps: ReadonlyArray<ExecutionStep>
  readonly dependencies: ReadonlyMap<string, ReadonlySet<string>>
  readonly parallelizableGroups: ReadonlyArray<ReadonlyArray<string>>
}

export interface CompiledGraph<Source, Target> {
  readonly graph: AlgebraicPropertyGraph<unknown>
  readonly executionPlan: ExecutionPlan
  readonly sourceSchema: SchemaNode<Source>
  readonly targetSchema: SchemaNode<Target>
  readonly optimizations: ReadonlyArray<AppliedOptimization>
}

export interface AppliedOptimization {
  readonly type: "Fusion" | "Parallelization" | "Caching" | "Reordering"
  readonly description: string
  readonly impact: number // 0-1 score
}

// ============================================================================
// Engine Configuration
// ============================================================================

export interface EngineConfig {
  readonly maxConcurrency: number
  readonly cacheStrategy: CacheStrategy
  readonly validationMode: "strict" | "lenient"
  readonly metricsEnabled: boolean
  readonly provenanceTracking: boolean
  readonly optimizationLevel: 0 | 1 | 2 | 3
}

export interface CacheStrategy {
  readonly shouldCache: (step: ExecutionStep) => boolean
  readonly generateKey: (step: ExecutionStep, context: ExecutionContext) => string
  readonly ttl: (step: ExecutionStep) => Option.Option<Duration.Duration>
}

// ============================================================================
// Error Types
// ============================================================================

export class EngineError extends Context.Tag("EngineError")<
  EngineError,
  { readonly _tag: string; readonly message: string }
>() {}

export class CompilationError extends EngineError {
  readonly _tag = "CompilationError"
}

export class ValidationError extends EngineError {
  readonly _tag = "ValidationError"
}

export class ExecutionError extends EngineError {
  readonly _tag = "ExecutionError"
}

export class NotFoundError extends EngineError {
  readonly _tag = "NotFoundError"
  constructor(readonly id: NodeId | StrategyId | SchemaId) {
    super()
    this.message = `Not found: ${id}`
  }
}

// ============================================================================
// Service Interfaces
// ============================================================================

// Graph Database Service
export interface GraphDatabase extends Context.Tag.Service<GraphDatabase> {
  readonly getNode: (id: NodeId) => Effect.Effect<AnyNode, NotFoundError>
  readonly putNode: (node: AnyNode) => Effect.Effect<void>
  readonly queryNodes: (query: GraphQuery) => Stream.Stream<AnyNode>
  readonly getGraph: (id: string) => Effect.Effect<AlgebraicPropertyGraph<unknown>, NotFoundError>
  readonly putGraph: (id: string, graph: AlgebraicPropertyGraph<unknown>) => Effect.Effect<void>
  readonly transaction: <A, E>(
    effect: Effect.Effect<A, E, GraphDatabase>
  ) => Effect.Effect<A, E | TransactionError>
}

export class GraphDatabase extends Context.Tag("GraphDatabase")<GraphDatabase>() {}

export interface GraphQuery {
  readonly type?: AnyNode["_tag"]
  readonly predicate?: (node: AnyNode) => boolean
  readonly limit?: number
  readonly offset?: number
}

export class TransactionError extends EngineError {
  readonly _tag = "TransactionError"
}

// Cache Service
export interface CacheService extends Context.Tag.Service<CacheService> {
  readonly get: <A>(key: string) => Effect.Effect<Option.Option<A>, CacheError>
  readonly set: <A>(key: string, value: A, ttl?: Duration.Duration) => Effect.Effect<void>
  readonly invalidate: (pattern: string) => Effect.Effect<void>
  readonly clear: () => Effect.Effect<void>
}

export class CacheService extends Context.Tag("CacheService")<CacheService>() {}

export class CacheError extends EngineError {
  readonly _tag = "CacheError"
}

// Strategy Registry
export interface StrategyRegistry extends Context.Tag.Service<StrategyRegistry> {
  readonly register: (strategy: StrategyNode<any, any>) => Effect.Effect<void>
  readonly get: (id: StrategyId) => Effect.Effect<StrategyNode<any, any>, NotFoundError>
  readonly findByCapability: (
    input: SchemaId,
    output: SchemaId,
    recursionScheme?: RecursionScheme
  ) => Effect.Effect<ReadonlyArray<StrategyNode<any, any>>>
  readonly listAll: () => Effect.Effect<ReadonlyArray<StrategyNode<any, any>>>
}

export class StrategyRegistry extends Context.Tag("StrategyRegistry")<StrategyRegistry>() {}

// ============================================================================
// Engine Interface
// ============================================================================

export interface Engine extends Context.Tag.Service<Engine> {
  readonly compile: <Source, Target>(
    graph: AlgebraicPropertyGraph<unknown>
  ) => Effect.Effect<CompiledGraph<Source, Target>, CompilationError>
  
  readonly validate: <Source, Target>(
    compiled: CompiledGraph<Source, Target>
  ) => Effect.Effect<void, ValidationError>
  
  readonly execute: <Source, Target>(
    compiled: CompiledGraph<Source, Target>
  ) => Stream.Stream<Target, ExecutionError, ExecutionContext>
  
  readonly materialize: <Source, Target>(
    graph: AlgebraicPropertyGraph<unknown>,
    targetSchemaId: SchemaId
  ) => Stream.Stream<Target, EngineError, ExecutionContext>
}

export class Engine extends Context.Tag("Engine")<Engine>() {}

// ============================================================================
// Engine Status
// ============================================================================

export interface EngineStatus {
  readonly state: "initializing" | "ready" | "busy" | "shutting_down" | "stopped"
  readonly activeExecutions: number
  readonly queuedExecutions: number
  readonly uptime: Duration.Duration
  readonly lastError?: EngineError
}

// ============================================================================
// Validation Results
// ============================================================================

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: ReadonlyArray<ValidationIssue>
  readonly warnings: ReadonlyArray<ValidationIssue>
}

export interface ValidationIssue {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly message: string
  readonly location?: {
    readonly nodeId?: NodeId
    readonly stepId?: string
  }
}