import { Data, Option, ReadonlyArray as RA, Effect, Hash, Equal } from "effect"
import type { BaseNode } from "./BaseNode.js"
import type { NodeId, EdgeId } from "./Brand.js"
import type { Edge } from "./Edge.js"

// Hyperedge - connects multiple source nodes to multiple target nodes
export interface Hyperedge {
  readonly id: EdgeId
  readonly sourceIds: ReadonlyArray<NodeId>
  readonly targetIds: ReadonlyArray<NodeId>
  readonly label: string
  readonly properties: ReadonlyMap<string, unknown>
  readonly weight?: number
}

// Property-carrying node in the hypergraph
export interface HyperNode<P> {
  readonly node: BaseNode<any>
  readonly properties: P
  readonly incomingEdges: ReadonlyArray<Hyperedge>
  readonly outgoingEdges: ReadonlyArray<Hyperedge>
}

// Recursive hypergraph structure
export interface RecursiveHypergraph<P> extends Equal.Equal, Hash.Hashable {
  readonly nodes: ReadonlyMap<NodeId, HyperNode<P>>
  readonly edges: ReadonlyMap<EdgeId, Hyperedge>
  readonly metadata: GraphMetadata
}

export interface GraphMetadata {
  readonly name?: string
  readonly version: string
  readonly createdAt: Date
  readonly lastModified: Date
  readonly tags: ReadonlyArray<string>
  readonly properties: ReadonlyMap<string, unknown>
}

// Fold algebra for the recursive hypergraph
export interface HypergraphAlgebra<P, R> {
  readonly node: (
    node: BaseNode<any>,
    properties: P,
    incomingResults: ReadonlyArray<R>,
    outgoingResults: ReadonlyArray<R>
  ) => R
  
  readonly edge: (
    edge: Hyperedge,
    sourceResults: ReadonlyArray<R>,
    targetResults: ReadonlyArray<R>
  ) => R
  
  readonly combine: (results: ReadonlyArray<R>) => R
}

// Immutable operations on recursive hypergraphs
export namespace RecursiveHypergraph {
  // Create empty hypergraph
  export const empty = <P>(metadata?: Partial<GraphMetadata>): RecursiveHypergraph<P> => 
    Data.struct({
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        version: "1.0.0",
        createdAt: new Date(),
        lastModified: new Date(),
        tags: [],
        properties: new Map(),
        ...metadata
      }
    })

  // Add a node
  export const addNode = <P>(
    graph: RecursiveHypergraph<P>,
    node: BaseNode<any>,
    properties: P
  ): RecursiveHypergraph<P> => {
    const hyperNode: HyperNode<P> = {
      node,
      properties,
      incomingEdges: [],
      outgoingEdges: []
    }
    
    return Data.struct({
      ...graph,
      nodes: new Map([...graph.nodes, [node.id, hyperNode]]),
      metadata: {
        ...graph.metadata,
        lastModified: new Date()
      }
    })
  }

  // Add a hyperedge
  export const addHyperedge = <P>(
    graph: RecursiveHypergraph<P>,
    edge: Hyperedge
  ): RecursiveHypergraph<P> => {
    // Update nodes to include this edge
    const updatedNodes = new Map(graph.nodes)
    
    // Add to outgoing edges of source nodes
    edge.sourceIds.forEach(sourceId => {
      const node = updatedNodes.get(sourceId)
      if (node) {
        updatedNodes.set(sourceId, {
          ...node,
          outgoingEdges: [...node.outgoingEdges, edge]
        })
      }
    })
    
    // Add to incoming edges of target nodes
    edge.targetIds.forEach(targetId => {
      const node = updatedNodes.get(targetId)
      if (node) {
        updatedNodes.set(targetId, {
          ...node,
          incomingEdges: [...node.incomingEdges, edge]
        })
      }
    })
    
    return Data.struct({
      ...graph,
      nodes: updatedNodes,
      edges: new Map([...graph.edges, [edge.id, edge]]),
      metadata: {
        ...graph.metadata,
        lastModified: new Date()
      }
    })
  }

  // Fold over the hypergraph
  export const fold = <P, R>(
    graph: RecursiveHypergraph<P>,
    algebra: HypergraphAlgebra<P, R>
  ): R => {
    const nodeResults = new Map<NodeId, R>()
    const edgeResults = new Map<EdgeId, R>()
    
    // Process all edges first
    for (const [edgeId, edge] of graph.edges) {
      const sourceResults = edge.sourceIds
        .map(id => nodeResults.get(id))
        .filter((r): r is R => r !== undefined)
      
      const targetResults = edge.targetIds
        .map(id => nodeResults.get(id))
        .filter((r): r is R => r !== undefined)
      
      const edgeResult = algebra.edge(edge, sourceResults, targetResults)
      edgeResults.set(edgeId, edgeResult)
    }
    
    // Process all nodes
    for (const [nodeId, hyperNode] of graph.nodes) {
      const incomingResults = hyperNode.incomingEdges
        .map(edge => edgeResults.get(edge.id))
        .filter((r): r is R => r !== undefined)
      
      const outgoingResults = hyperNode.outgoingEdges
        .map(edge => edgeResults.get(edge.id))
        .filter((r): r is R => r !== undefined)
      
      const nodeResult = algebra.node(
        hyperNode.node,
        hyperNode.properties,
        incomingResults,
        outgoingResults
      )
      nodeResults.set(nodeId, nodeResult)
    }
    
    return algebra.combine(Array.from(nodeResults.values()))
  }

  // Map over properties
  export const mapProperties = <P, Q>(
    graph: RecursiveHypergraph<P>,
    f: (properties: P) => Q
  ): RecursiveHypergraph<Q> => {
    const mappedNodes = new Map<NodeId, HyperNode<Q>>()
    
    for (const [nodeId, hyperNode] of graph.nodes) {
      mappedNodes.set(nodeId, {
        ...hyperNode,
        properties: f(hyperNode.properties)
      })
    }
    
    return Data.struct({
      ...graph,
      nodes: mappedNodes
    })
  }

  // Filter nodes by predicate
  export const filterNodes = <P>(
    graph: RecursiveHypergraph<P>,
    predicate: (hyperNode: HyperNode<P>) => boolean
  ): RecursiveHypergraph<P> => {
    const filteredNodes = new Map<NodeId, HyperNode<P>>()
    const keptNodeIds = new Set<NodeId>()
    
    // Filter nodes
    for (const [nodeId, hyperNode] of graph.nodes) {
      if (predicate(hyperNode)) {
        filteredNodes.set(nodeId, hyperNode)
        keptNodeIds.add(nodeId)
      }
    }
    
    // Filter edges to only include those between kept nodes
    const filteredEdges = new Map<EdgeId, Hyperedge>()
    for (const [edgeId, edge] of graph.edges) {
      const hasAllSources = edge.sourceIds.every(id => keptNodeIds.has(id))
      const hasAllTargets = edge.targetIds.every(id => keptNodeIds.has(id))
      
      if (hasAllSources && hasAllTargets) {
        filteredEdges.set(edgeId, edge)
      }
    }
    
    return Data.struct({
      ...graph,
      nodes: filteredNodes,
      edges: filteredEdges
    })
  }

  // Get all nodes as array
  export const allNodes = <P>(
    graph: RecursiveHypergraph<P>
  ): ReadonlyArray<HyperNode<P>> =>
    Array.from(graph.nodes.values())

  // Get node by ID
  export const getNode = <P>(
    graph: RecursiveHypergraph<P>,
    nodeId: NodeId
  ): Option.Option<HyperNode<P>> =>
    Option.fromNullable(graph.nodes.get(nodeId))

  // Get neighbors of a node (connected via hyperedges)
  export const getNeighbors = <P>(
    graph: RecursiveHypergraph<P>,
    nodeId: NodeId
  ): ReadonlyArray<HyperNode<P>> => {
    const node = graph.nodes.get(nodeId)
    if (!node) return []
    
    const neighborIds = new Set<NodeId>()
    
    // From outgoing edges
    node.outgoingEdges.forEach(edge => {
      edge.targetIds.forEach(id => neighborIds.add(id))
    })
    
    // From incoming edges
    node.incomingEdges.forEach(edge => {
      edge.sourceIds.forEach(id => neighborIds.add(id))
    })
    
    // Remove self
    neighborIds.delete(nodeId)
    
    return Array.from(neighborIds)
      .map(id => graph.nodes.get(id))
      .filter((node): node is HyperNode<P> => node !== undefined)
  }

  // Traverse with effects
  export const traverse = <P, R, E, A>(
    graph: RecursiveHypergraph<P>,
    f: (hyperNode: HyperNode<P>) => Effect.Effect<A, E, R>
  ): Effect.Effect<RecursiveHypergraph<A>, E, R> =>
    Effect.gen(function* () {
      const results = new Map<NodeId, HyperNode<A>>()
      
      for (const [nodeId, hyperNode] of graph.nodes) {
        const newProperties = yield* f(hyperNode)
        results.set(nodeId, {
          ...hyperNode,
          properties: newProperties
        })
      }
      
      return Data.struct({
        ...graph,
        nodes: results
      })
    })

  // Common fold algebras
  export const Algebras = {
    // Count all nodes
    count: <P>(): HypergraphAlgebra<P, number> => ({
      node: () => 1,
      edge: () => 0,
      combine: results => results.reduce((sum, count) => sum + count, 0)
    }),

    // Collect all nodes
    collect: <P>(): HypergraphAlgebra<P, ReadonlyArray<BaseNode<any>>> => ({
      node: (node) => [node],
      edge: () => [],
      combine: results => results.flat()
    }),

    // Calculate graph metrics
    metrics: <P>(): HypergraphAlgebra<P, GraphMetrics> => ({
      node: (node, _, incoming, outgoing) => ({
        nodeCount: 1,
        edgeCount: 0,
        maxDegree: incoming.length + outgoing.length,
        serializable: node.hasSerializableSchema() ? 1 : 0
      }),
      edge: () => ({
        nodeCount: 0,
        edgeCount: 1,
        maxDegree: 0,
        serializable: 0
      }),
      combine: results => results.reduce(
        (acc, curr) => ({
          nodeCount: acc.nodeCount + curr.nodeCount,
          edgeCount: acc.edgeCount + curr.edgeCount,
          maxDegree: Math.max(acc.maxDegree, curr.maxDegree),
          serializable: acc.serializable + curr.serializable
        }),
        { nodeCount: 0, edgeCount: 0, maxDegree: 0, serializable: 0 }
      )
    })
  }
}

export interface GraphMetrics {
  readonly nodeCount: number
  readonly edgeCount: number
  readonly maxDegree: number
  readonly serializable: number
}