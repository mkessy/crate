import { Context, Effect, Layer, Stream, Option, Data } from "effect"
import type { RecursiveHypergraph, HyperNode, Hyperedge } from "../core/RecursiveHypergraph.js"
import type { BaseNode } from "../core/BaseNode.js"
import type { NodeId, EdgeId } from "../core/Brand.js"

// ============================================================================
// Graph Service Interface
// ============================================================================

export interface GraphService extends Context.Tag.Service<GraphService> {
  // Core graph operations
  readonly createGraph: <P>(name?: string) => Effect.Effect<GraphHandle<P>>
  readonly getGraph: <P>(handle: GraphHandle<P>) => Effect.Effect<RecursiveHypergraph<P>>
  readonly updateGraph: <P>(
    handle: GraphHandle<P>,
    updater: (graph: RecursiveHypergraph<P>) => RecursiveHypergraph<P>
  ) => Effect.Effect<void>
  
  // Node operations
  readonly addNode: <P>(
    handle: GraphHandle<P>,
    node: BaseNode<any>,
    properties: P
  ) => Effect.Effect<void>
  
  readonly getNode: <P>(
    handle: GraphHandle<P>,
    nodeId: NodeId
  ) => Effect.Effect<Option.Option<HyperNode<P>>>
  
  readonly removeNode: <P>(
    handle: GraphHandle<P>,
    nodeId: NodeId
  ) => Effect.Effect<void>
  
  // Edge operations
  readonly addHyperedge: <P>(
    handle: GraphHandle<P>,
    edge: Hyperedge
  ) => Effect.Effect<void>
  
  readonly getEdge: <P>(
    handle: GraphHandle<P>,
    edgeId: EdgeId
  ) => Effect.Effect<Option.Option<Hyperedge>>
  
  readonly removeEdge: <P>(
    handle: GraphHandle<P>,
    edgeId: EdgeId
  ) => Effect.Effect<void>
  
  // Query operations
  readonly queryNodes: <P>(
    handle: GraphHandle<P>,
    predicate: (node: HyperNode<P>) => boolean
  ) => Stream.Stream<HyperNode<P>>
  
  readonly fold: <P, R>(
    handle: GraphHandle<P>,
    algebra: import("../core/RecursiveHypergraph.js").HypergraphAlgebra<P, R>
  ) => Effect.Effect<R>
  
  // View operations for pure schema transforms and history
  readonly createView: <P>(
    handle: GraphHandle<P>,
    viewConfig: ViewConfig<P>
  ) => Effect.Effect<GraphView<P>>
  
  readonly getTransformHistory: <P>(
    handle: GraphHandle<P>,
    nodeId: NodeId
  ) => Effect.Effect<ReadonlyArray<TransformRecord>>
  
  readonly getPureSchemaTransforms: <P>(
    handle: GraphHandle<P>
  ) => Effect.Effect<ReadonlyArray<SchemaTransform>>
}

export class GraphService extends Context.Tag("GraphService")<GraphService>() {}

// ============================================================================
// Supporting Types
// ============================================================================

export interface GraphHandle<P> {
  readonly id: string
  readonly _phantom: P
}

export interface ViewConfig<P> {
  readonly name: string
  readonly nodeFilter?: (node: HyperNode<P>) => boolean
  readonly edgeFilter?: (edge: Hyperedge) => boolean
  readonly propertyProjection?: <Q>(properties: P) => Q
  readonly includeProvenance: boolean
  readonly includeMetrics: boolean
}

export interface GraphView<P> {
  readonly handle: GraphHandle<P>
  readonly config: ViewConfig<P>
  readonly snapshot: RecursiveHypergraph<P>
  readonly createdAt: Date
}

export interface TransformRecord {
  readonly id: string
  readonly nodeId: NodeId
  readonly transformType: "strategy" | "functor" | "optimizer"
  readonly inputNodes: ReadonlyArray<NodeId>
  readonly outputNodes: ReadonlyArray<NodeId>
  readonly timestamp: Date
  readonly success: boolean
  readonly metadata: Record<string, unknown>
}

export interface SchemaTransform {
  readonly id: string
  readonly sourceSchemaId: string
  readonly targetSchemaId: string
  readonly transformFunction: string // Serialized function
  readonly isPure: boolean
  readonly isReversible: boolean
  readonly preservesStructure: boolean
}

// ============================================================================
// In-Memory Implementation
// ============================================================================

export interface InMemoryGraphServiceConfig {
  readonly maxGraphs: number
  readonly enableMetrics: boolean
  readonly enableHistory: boolean
  readonly compressionEnabled: boolean
}

class InMemoryGraphService implements GraphService {
  private graphs = new Map<string, RecursiveHypergraph<any>>()
  private transformHistory = new Map<string, Array<TransformRecord>>()
  private schemaTransforms = new Map<string, Array<SchemaTransform>>()
  private nextId = 0
  
  constructor(private config: InMemoryGraphServiceConfig) {}
  
  createGraph<P>(name?: string): Effect.Effect<GraphHandle<P>> {
    return Effect.gen(function* () {
      const id = `graph_${this.nextId++}`
      const graph = import("../core/RecursiveHypergraph.js").RecursiveHypergraph.empty<P>({
        name,
        version: "1.0.0"
      })
      
      this.graphs.set(id, graph)
      if (this.config.enableHistory) {
        this.transformHistory.set(id, [])
      }
      if (this.config.enableMetrics) {
        this.schemaTransforms.set(id, [])
      }
      
      return { id, _phantom: undefined as unknown as P }
    }.bind(this))
  }
  
  getGraph<P>(handle: GraphHandle<P>): Effect.Effect<RecursiveHypergraph<P>> {
    return Effect.gen(function* () {
      const graph = this.graphs.get(handle.id)
      return yield* graph 
        ? Effect.succeed(graph as RecursiveHypergraph<P>)
        : Effect.fail(new GraphNotFoundError(handle.id))
    }.bind(this))
  }
  
  updateGraph<P>(
    handle: GraphHandle<P>,
    updater: (graph: RecursiveHypergraph<P>) => RecursiveHypergraph<P>
  ): Effect.Effect<void> {
    return Effect.gen(function* () {
      const currentGraph = yield* this.getGraph(handle)
      const updatedGraph = updater(currentGraph)
      this.graphs.set(handle.id, updatedGraph)
    }.bind(this))
  }
  
  addNode<P>(
    handle: GraphHandle<P>,
    node: BaseNode<any>,
    properties: P
  ): Effect.Effect<void> {
    return this.updateGraph(handle, graph =>
      import("../core/RecursiveHypergraph.js").RecursiveHypergraph.addNode(graph, node, properties)
    )
  }
  
  getNode<P>(
    handle: GraphHandle<P>,
    nodeId: NodeId
  ): Effect.Effect<Option.Option<HyperNode<P>>> {
    return Effect.gen(function* () {
      const graph = yield* this.getGraph(handle)
      return import("../core/RecursiveHypergraph.js").RecursiveHypergraph.getNode(graph, nodeId)
    }.bind(this))
  }
  
  removeNode<P>(handle: GraphHandle<P>, nodeId: NodeId): Effect.Effect<void> {
    return this.updateGraph(handle, graph =>
      import("../core/RecursiveHypergraph.js").RecursiveHypergraph.filterNodes(graph, node => 
        node.node.id !== nodeId
      )
    )
  }
  
  addHyperedge<P>(handle: GraphHandle<P>, edge: Hyperedge): Effect.Effect<void> {
    return this.updateGraph(handle, graph =>
      import("../core/RecursiveHypergraph.js").RecursiveHypergraph.addHyperedge(graph, edge)
    )
  }
  
  getEdge<P>(
    handle: GraphHandle<P>,
    edgeId: EdgeId
  ): Effect.Effect<Option.Option<Hyperedge>> {
    return Effect.gen(function* () {
      const graph = yield* this.getGraph(handle)
      return Option.fromNullable(graph.edges.get(edgeId))
    }.bind(this))
  }
  
  removeEdge<P>(handle: GraphHandle<P>, edgeId: EdgeId): Effect.Effect<void> {
    return this.updateGraph(handle, graph => 
      Data.struct({
        ...graph,
        edges: new Map([...graph.edges].filter(([id]) => id !== edgeId))
      })
    )
  }
  
  queryNodes<P>(
    handle: GraphHandle<P>,
    predicate: (node: HyperNode<P>) => boolean
  ): Stream.Stream<HyperNode<P>> {
    return Stream.fromEffect(
      Effect.gen(function* () {
        const graph = yield* this.getGraph(handle)
        return import("../core/RecursiveHypergraph.js").RecursiveHypergraph.allNodes(graph).filter(predicate)
      }.bind(this))
    ).pipe(Stream.flatMap(Stream.fromIterable))
  }
  
  fold<P, R>(
    handle: GraphHandle<P>,
    algebra: import("../core/RecursiveHypergraph.js").HypergraphAlgebra<P, R>
  ): Effect.Effect<R> {
    return Effect.gen(function* () {
      const graph = yield* this.getGraph(handle)
      return import("../core/RecursiveHypergraph.js").RecursiveHypergraph.fold(graph, algebra)
    }.bind(this))
  }
  
  createView<P>(
    handle: GraphHandle<P>,
    viewConfig: ViewConfig<P>
  ): Effect.Effect<GraphView<P>> {
    return Effect.gen(function* () {
      const graph = yield* this.getGraph(handle)
      
      let filteredGraph = graph
      
      if (viewConfig.nodeFilter) {
        filteredGraph = import("../core/RecursiveHypergraph.js").RecursiveHypergraph.filterNodes(
          filteredGraph, 
          viewConfig.nodeFilter
        )
      }
      
      if (viewConfig.propertyProjection) {
        filteredGraph = import("../core/RecursiveHypergraph.js").RecursiveHypergraph.mapProperties(
          filteredGraph,
          viewConfig.propertyProjection
        )
      }
      
      return {
        handle,
        config: viewConfig,
        snapshot: filteredGraph,
        createdAt: new Date()
      }
    }.bind(this))
  }
  
  getTransformHistory<P>(
    handle: GraphHandle<P>,
    nodeId: NodeId
  ): Effect.Effect<ReadonlyArray<TransformRecord>> {
    return Effect.gen(function* () {
      if (!this.config.enableHistory) {
        return []
      }
      
      const history = this.transformHistory.get(handle.id) || []
      return history.filter(record => 
        record.nodeId === nodeId || 
        record.inputNodes.includes(nodeId) ||
        record.outputNodes.includes(nodeId)
      )
    }.bind(this))
  }
  
  getPureSchemaTransforms<P>(
    handle: GraphHandle<P>
  ): Effect.Effect<ReadonlyArray<SchemaTransform>> {
    return Effect.gen(function* () {
      const transforms = this.schemaTransforms.get(handle.id) || []
      return transforms.filter(t => t.isPure)
    }.bind(this))
  }
}

// ============================================================================
// Errors
// ============================================================================

export class GraphNotFoundError extends Data.TaggedError("GraphNotFoundError")<{
  readonly graphId: string
}> {}

export class NodeNotFoundError extends Data.TaggedError("NodeNotFoundError")<{
  readonly nodeId: NodeId
}> {}

export class EdgeNotFoundError extends Data.TaggedError("EdgeNotFoundError")<{
  readonly edgeId: EdgeId
}> {}

// ============================================================================
// Layers
// ============================================================================

export const InMemoryGraphServiceLive = (config: InMemoryGraphServiceConfig) =>
  Layer.succeed(GraphService, new InMemoryGraphService(config))

export const DefaultInMemoryGraphServiceLive = InMemoryGraphServiceLive({
  maxGraphs: 100,
  enableMetrics: true,
  enableHistory: true,
  compressionEnabled: false
})

// Test layer with minimal functionality
export const TestGraphServiceLive = InMemoryGraphServiceLive({
  maxGraphs: 10,
  enableMetrics: false,
  enableHistory: false,
  compressionEnabled: false
})