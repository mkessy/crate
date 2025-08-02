# Adjoint Engine Design

## Overview

The Adjoint Engine is the runtime that materializes declarative graph transformations into actual data streams. It implements the adjoint fold recursion scheme while providing formal guarantees, caching, and observability.

## Core Principles

1. **Compilation-Execution Separation**: Graphs are compiled and validated before execution
2. **Effect-First**: All operations are expressed as Effects for composability
3. **Layer-Based Architecture**: Services are injected via Effect Layers
4. **Property-Based Testing**: All components tested with property-based generators
5. **Formal Guarantees**: Mathematical properties enforced at runtime

## Engine Lifecycle

### 1. Initialization Phase
```typescript
interface EngineConfig {
  readonly maxConcurrency: number
  readonly cacheStrategy: CacheStrategy
  readonly validationMode: "strict" | "lenient"
  readonly metricsEnabled: boolean
  readonly provenanceTracking: boolean
}

interface Engine {
  readonly initialize: Effect.Effect<void, EngineError, EngineServices>
  readonly shutdown: Effect.Effect<void, never, never>
  readonly status: Effect.Effect<EngineStatus>
}
```

### 2. Compilation Phase
```typescript
interface GraphCompiler {
  readonly compile: <Source, Target>(
    graph: Graph<Source, Target>
  ) => Effect.Effect<CompiledGraph<Source, Target>, CompilationError>
  
  readonly validate: <Source, Target>(
    graph: Graph<Source, Target>
  ) => Effect.Effect<ValidationResult, ValidationError>
}

interface CompiledGraph<Source, Target> {
  readonly graph: Graph<Source, Target>
  readonly executionPlan: ExecutionPlan
  readonly dependencies: DependencyMap
  readonly optimizations: AppliedOptimizations
}
```

### 3. Execution Phase
```typescript
interface GraphExecutor {
  readonly execute: <Source, Target>(
    compiled: CompiledGraph<Source, Target>
  ) => Stream.Stream<Target, ExecutionError, ExecutionContext>
  
  readonly executeWithProvenance: <Source, Target>(
    compiled: CompiledGraph<Source, Target>
  ) => Stream.Stream<
    { data: Target; provenance: ProvenanceGraph },
    ExecutionError,
    ExecutionContext
  >
}
```

## Service Architecture

### Core Services (Effect Layers)

```typescript
// 1. Graph Database Service
interface GraphDatabase {
  readonly getNode: (id: NodeId) => Effect.Effect<AnyNode, NotFoundError>
  readonly putNode: (node: AnyNode) => Effect.Effect<void>
  readonly queryNodes: (query: GraphQuery) => Stream.Stream<AnyNode>
  readonly transaction: <A>(
    effect: Effect.Effect<A, E, GraphDatabase>
  ) => Effect.Effect<A, E | TransactionError>
}

// 2. Cache Service
interface CacheService {
  readonly get: <A>(key: CacheKey) => Effect.Effect<Option<A>, CacheError>
  readonly set: <A>(key: CacheKey, value: A, ttl?: Duration) => Effect.Effect<void>
  readonly invalidate: (pattern: CachePattern) => Effect.Effect<void>
}

// 3. Strategy Registry
interface StrategyRegistry {
  readonly register: (strategy: StrategyNode<any, any>) => Effect.Effect<void>
  readonly get: (id: StrategyId) => Effect.Effect<StrategyNode<any, any>, NotFoundError>
  readonly findByCapability: (
    input: SchemaId,
    output: SchemaId
  ) => Effect.Effect<Array<StrategyNode<any, any>>>
}

// 4. LLM Service (for FunctorNodes)
interface LLMService {
  readonly generateStrategy: (
    functor: FunctorNode
  ) => Effect.Effect<StrategyNode<any, any>, LLMError>
  
  readonly validateGeneration: (
    strategy: StrategyNode<any, any>,
    functor: FunctorNode
  ) => Effect.Effect<boolean>
}

// 5. Metrics Service
interface MetricsService {
  readonly recordDuration: (
    metric: string,
    duration: Duration,
    labels?: Record<string, string>
  ) => Effect.Effect<void>
  
  readonly incrementCounter: (
    metric: string,
    labels?: Record<string, string>
  ) => Effect.Effect<void>
  
  readonly recordGauge: (
    metric: string,
    value: number,
    labels?: Record<string, string>
  ) => Effect.Effect<void>
}
```

### Layer Composition

```typescript
// Production layers
const GraphDatabaseLive = Layer.effect(
  GraphDatabase,
  Effect.gen(function* () {
    // Real implementation with persistence
  })
)

const CacheServiceLive = Layer.effect(
  CacheService,
  Effect.gen(function* () {
    const config = yield* Config
    // Redis or in-memory implementation
  })
)

// Test layers with mocks
const GraphDatabaseTest = Layer.succeed(
  GraphDatabase,
  {
    getNode: (id) => Effect.succeed(TestNodeGenerator.generate()),
    putNode: () => Effect.void,
    queryNodes: () => Stream.fromIterable(TestNodeGenerator.generateMany(10)),
    transaction: (effect) => effect
  }
)

const CacheServiceTest = Layer.succeed(
  CacheService,
  {
    get: () => Effect.succeed(Option.none()),
    set: () => Effect.void,
    invalidate: () => Effect.void
  }
)

// Composed layers
const EngineLive = Layer.mergeAll(
  GraphDatabaseLive,
  CacheServiceLive,
  StrategyRegistryLive,
  LLMServiceLive,
  MetricsServiceLive
)

const EngineTest = Layer.mergeAll(
  GraphDatabaseTest,
  CacheServiceTest,
  StrategyRegistryTest,
  LLMServiceTest,
  MetricsServiceTest
)
```

## Execution Plan & Caching

### Execution Plan Structure
```typescript
interface ExecutionPlan {
  readonly steps: Array<ExecutionStep>
  readonly dependencies: DependencyGraph
  readonly parallelizableGroups: Array<Array<ExecutionStepId>>
}

interface ExecutionStep {
  readonly id: ExecutionStepId
  readonly type: "LoadSource" | "ApplyStrategy" | "Optimize" | "Generate"
  readonly nodeId: NodeId
  readonly dependencies: Array<ExecutionStepId>
  readonly cacheKey?: CacheKey
  readonly estimatedCost?: ExecutionCost
}
```

### Caching Strategy
```typescript
interface CacheStrategy {
  readonly shouldCache: (step: ExecutionStep) => boolean
  readonly generateKey: (step: ExecutionStep, context: ExecutionContext) => CacheKey
  readonly ttl: (step: ExecutionStep) => Option<Duration>
}

// Different cache levels
interface CacheHierarchy {
  readonly l1: SubgraphCache      // In-memory, fast access
  readonly l2: StrategyCache      // Distributed, shared across instances
  readonly l3: ResultCache        // Long-term storage
}
```

## Property-Based Testing Framework

### Test Generators
```typescript
// Using fast-check with Effect
interface TestGenerators {
  readonly node: Arbitrary<AnyNode>
  readonly sourceDataNode: Arbitrary<SourceDataNode>
  readonly schemaNode: <A, I>() => Arbitrary<SchemaNode<A, I>>
  readonly strategyNode: <I, O>() => Arbitrary<StrategyNode<I, O>>
  readonly graph: <S, T>() => Arbitrary<Graph<S, T>>
  readonly executionPlan: Arbitrary<ExecutionPlan>
}

// Property definitions
interface EngineProperties {
  // Compilation is deterministic
  readonly compilationDeterministic: Property<
    [Graph<any, any>],
    boolean
  >
  
  // Execution preserves types
  readonly executionTypePreservation: Property<
    [CompiledGraph<A, B>, A],
    B
  >
  
  // Caching doesn't affect results
  readonly cacheTransparency: Property<
    [ExecutionPlan, CacheState],
    boolean
  >
  
  // Provenance graph is complete
  readonly provenanceCompleteness: Property<
    [ExecutionResult],
    boolean
  >
}
```

### Mock Layer Generators
```typescript
interface MockLayerGenerators {
  readonly graphDatabase: (
    nodes: Array<AnyNode>
  ) => Layer.Layer<GraphDatabase>
  
  readonly cacheService: (
    initialCache: Map<CacheKey, unknown>
  ) => Layer.Layer<CacheService>
  
  readonly strategyRegistry: (
    strategies: Array<StrategyNode<any, any>>
  ) => Layer.Layer<StrategyRegistry>
}
```

## AI Module Design

### First-Class Prompt Generation
```typescript
interface PromptBuilder {
  readonly fromNode: (node: AnyNode) => Prompt
  readonly fromGraph: (graph: Graph<any, any>) => Prompt
  readonly fromExecutionContext: (context: ExecutionContext) => Prompt
}

interface Prompt {
  readonly system: string
  readonly user: string
  readonly examples: Array<Example>
  readonly constraints: Array<Constraint>
  readonly expectedOutput: OutputSchema
}

// Domain-aware prompt templates
interface PromptTemplates {
  readonly strategyGeneration: (
    input: SchemaNode<any>,
    output: SchemaNode<any>,
    recursionScheme: RecursionScheme
  ) => Prompt
  
  readonly schemaInference: (
    samples: Array<unknown>
  ) => Prompt
  
  readonly optimizationHints: (
    strategies: Array<StrategyNode<any, any>>,
    metrics: MetricResults
  ) => Prompt
}
```

## Formal Guarantees & Verification

### Runtime Verification
```typescript
interface RuntimeVerifier {
  // Verify adjoint fold equation holds
  readonly verifyAdjointProperty: <A, B>(
    step: ExecutionStep,
    result: B
  ) => Effect.Effect<void, VerificationError>
  
  // Verify limit preservation
  readonly verifyLimitPreservation: (
    plan: ExecutionPlan,
    results: Array<ExecutionResult>
  ) => Effect.Effect<void, VerificationError>
  
  // Lock results with cryptographic proof
  readonly lockResult: <A>(
    result: A,
    provenance: ProvenanceGraph
  ) => Effect.Effect<LockedResult<A>>
}

interface LockedResult<A> {
  readonly value: A
  readonly hash: Hash
  readonly proof: ProvenanceProof
  readonly timestamp: DateTime
}
```

### Compilation Guarantees
```typescript
interface CompilationGuarantees {
  // Type safety
  readonly typeCheck: <S, T>(
    graph: Graph<S, T>
  ) => Effect.Effect<void, TypeError>
  
  // Termination analysis
  readonly terminationCheck: (
    plan: ExecutionPlan
  ) => Effect.Effect<TerminationProof, NonTerminationError>
  
  // Resource bounds
  readonly resourceBounds: (
    plan: ExecutionPlan
  ) => Effect.Effect<ResourceEstimate>
}
```

## Toy GraphDatabase Implementation

```typescript
// Simple in-memory implementation for testing
class InMemoryGraphDatabase implements GraphDatabase {
  private nodes = new Map<NodeId, AnyNode>()
  private edges = new Map<EdgeId, Edge>()
  private indices = {
    byType: new Map<string, Set<NodeId>>(),
    bySchema: new Map<SchemaId, Set<NodeId>>()
  }
  
  getNode(id: NodeId) {
    return Effect.fromNullable(this.nodes.get(id))
      .pipe(Effect.mapError(() => new NotFoundError(id)))
  }
  
  queryNodes(query: GraphQuery) {
    return Stream.fromIterable(this.nodes.values())
      .pipe(Stream.filter(query.predicate))
  }
  
  // Transaction support with STM
  transaction<A>(effect: Effect.Effect<A, E, GraphDatabase>) {
    return STM.atomically(
      effect.pipe(Effect.provideService(GraphDatabase, this))
    )
  }
}
```

## Startup & Shutdown Procedures

### Startup Sequence
```typescript
const startupSequence = Effect.gen(function* () {
  // 1. Load configuration
  const config = yield* Config.config
  
  // 2. Initialize services
  yield* Logger.log("Initializing services...")
  const services = yield* Layer.launch(EngineLive)
  
  // 3. Verify database connection
  yield* GraphDatabase.healthCheck
  
  // 4. Pre-warm caches
  yield* CacheService.warmup
  
  // 5. Load strategy registry
  const strategies = yield* StrategyRegistry.loadBuiltins
  
  // 6. Start metrics collection
  yield* MetricsService.start
  
  // 7. Engine ready
  yield* Logger.log("Engine initialized successfully")
})
```

### Graceful Shutdown
```typescript
const shutdownSequence = Effect.gen(function* () {
  // 1. Stop accepting new work
  yield* Engine.pauseNewRequests
  
  // 2. Wait for in-flight operations
  yield* Engine.drainInFlight.pipe(
    Effect.timeout(Duration.seconds(30))
  )
  
  // 3. Flush caches
  yield* CacheService.flush
  
  // 4. Close database connections
  yield* GraphDatabase.close
  
  // 5. Export metrics
  yield* MetricsService.export
  
  // 6. Final cleanup
  yield* Logger.log("Engine shutdown complete")
})
```

## Next Steps

1. Implement core service interfaces
2. Create property-based test generators
3. Build toy GraphDatabase for testing
4. Implement compilation pipeline
5. Create mock layers for unit testing
6. Design caching hierarchy
7. Implement AI prompt generation
8. Add formal verification layer