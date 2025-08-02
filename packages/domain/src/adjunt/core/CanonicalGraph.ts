import type { Effect, Option } from "effect"
import { pipe, Schema as S } from "effect"
import type { AnyNode } from "../nodes/index.js"
import { EdgeId, NodeId } from "./Brand.js"
import { Edge, EdgeLabel } from "./Edge.js"

// Graph metadata
const GraphMetadata = S.Struct({
  name: S.optional(S.String),
  description: S.optional(S.String),
  version: S.optional(S.String),
  createdAt: S.DateTimeUtc,
  lastModified: S.DateTimeUtc
})

// Property attachment to nodes
export interface PropertyNode<A> {
  readonly node: AnyNode
  readonly properties: ReadonlyMap<string, A>
  readonly children: ReadonlyArray<PropertyNode<A>>
}

// Algebraic Property Graph - recursive structure
export interface AlgebraicPropertyGraph<A> {
  readonly roots: ReadonlyArray<PropertyNode<A>>
  readonly edges: ReadonlyMap<EdgeId, Edge>
  readonly metadata: S.Schema.Type<typeof GraphMetadata>
}

// Fold operation for the graph (catamorphism)
export interface GraphAlgebra<A, B> {
  readonly node: (
    node: AnyNode,
    properties: ReadonlyMap<string, A>,
    childResults: ReadonlyArray<B>
  ) => B
  readonly combine: (results: ReadonlyArray<B>) => B
}

// Immutable graph operations
export namespace AlgebraicPropertyGraph {
  // Create an empty graph
  export const empty = <A>(name?: string): AlgebraicPropertyGraph<A> => ({
    roots: [],
    edges: new Map(),
    metadata: {
      name,
      createdAt: new Date(),
      lastModified: new Date()
    }
  })

  // Fold over the graph structure
  export const fold = <A, B>(
    graph: AlgebraicPropertyGraph<A>,
    algebra: GraphAlgebra<A, B>
  ): B => {
    const foldNode = (node: PropertyNode<A>): B => {
      const childResults = node.children.map(foldNode)
      return algebra.node(node.node, node.properties, childResults)
    }

    const results = graph.roots.map(foldNode)
    return algebra.combine(results)
  }

  // Add a root node
  export const addRoot = <A>(
    graph: AlgebraicPropertyGraph<A>,
    node: AnyNode,
    properties: ReadonlyMap<string, A> = new Map()
  ): AlgebraicPropertyGraph<A> => ({
    ...graph,
    roots: [...graph.roots, { node, properties, children: [] }],
    metadata: { ...graph.metadata, lastModified: new Date() }
  })

  // Add a child to a node (immutably)
  export const addChild = <A>(
    graph: AlgebraicPropertyGraph<A>,
    parentId: NodeId,
    childNode: AnyNode,
    childProperties: ReadonlyMap<string, A> = new Map()
  ): AlgebraicPropertyGraph<A> => {
    const updateNode = (node: PropertyNode<A>): PropertyNode<A> => {
      if (node.node.id === parentId) {
        return {
          ...node,
          children: [...node.children, { node: childNode, properties: childProperties, children: [] }]
        }
      }
      return {
        ...node,
        children: node.children.map(updateNode)
      }
    }

    return {
      ...graph,
      roots: graph.roots.map(updateNode),
      metadata: { ...graph.metadata, lastModified: new Date() }
    }
  }

  // Add an edge
  export const addEdge = <A>(
    graph: AlgebraicPropertyGraph<A>,
    edge: Edge
  ): AlgebraicPropertyGraph<A> => ({
    ...graph,
    edges: new Map([...graph.edges, [edge.id, edge]]),
    metadata: { ...graph.metadata, lastModified: new Date() }
  })

  // Map over the graph (functor operation)
  export const map = <A, B>(
    graph: AlgebraicPropertyGraph<A>,
    f: (a: A) => B
  ): AlgebraicPropertyGraph<B> => {
    const mapNode = (node: PropertyNode<A>): PropertyNode<B> => ({
      node: node.node,
      properties: new Map(
        Array.from(node.properties.entries()).map(([k, v]) => [k, f(v)])
      ),
      children: node.children.map(mapNode)
    })

    return {
      roots: graph.roots.map(mapNode),
      edges: graph.edges,
      metadata: graph.metadata
    }
  }

  // Find a node by ID (returns path to node)
  export const findNode = <A>(
    graph: AlgebraicPropertyGraph<A>,
    nodeId: NodeId
  ): Option.Option<ReadonlyArray<PropertyNode<A>>> => {
    const findInNode = (
      node: PropertyNode<A>,
      path: ReadonlyArray<PropertyNode<A>>
    ): Option.Option<ReadonlyArray<PropertyNode<A>>> => {
      const currentPath = [...path, node]

      if (node.node.id === nodeId) {
        return Option.some(currentPath)
      }

      for (const child of node.children) {
        const result = findInNode(child, currentPath)
        if (Option.isSome(result)) {
          return result
        }
      }

      return Option.none()
    }

    for (const root of graph.roots) {
      const result = findInNode(root, [])
      if (Option.isSome(result)) {
        return result
      }
    }

    return Option.none()
  }

  // Get all nodes as a flat array
  export const allNodes = <A>(
    graph: AlgebraicPropertyGraph<A>
  ): ReadonlyArray<PropertyNode<A>> => {
    const collectNodes = (node: PropertyNode<A>): ReadonlyArray<PropertyNode<A>> => [
      node,
      ...node.children.flatMap(collectNodes)
    ]

    return graph.roots.flatMap(collectNodes)
  }

  // Filter nodes by predicate
  export const filterNodes = <A>(
    graph: AlgebraicPropertyGraph<A>,
    predicate: (node: AnyNode, properties: ReadonlyMap<string, A>) => boolean
  ): ReadonlyArray<PropertyNode<A>> =>
    pipe(
      allNodes(graph),
      RA.filter((pNode) => predicate(pNode.node, pNode.properties))
    )

  // Traverse the graph with an effect
  export const traverse = <A, R, E, B>(
    graph: AlgebraicPropertyGraph<A>,
    f: (node: AnyNode, properties: ReadonlyMap<string, A>) => Effect.Effect<B, E, R>
  ): Effect.Effect<AlgebraicPropertyGraph<B>, E, R> => {
    const traverseNode = (
      node: PropertyNode<A>
    ): Effect.Effect<PropertyNode<B>, E, R> =>
      Effect.gen(function*() {
        const newProps = yield* Effect.forEach(
          Array.from(node.properties.entries()),
          ([key, value]) =>
            Effect.map(
              f(node.node, new Map([[key, value]])),
              (b) => [key, b] as const
            )
        )

        const children = yield* Effect.forEach(
          node.children,
          traverseNode
        )

        return {
          node: node.node,
          properties: new Map(newProps),
          children
        }
      })

    return Effect.gen(function*() {
      const newRoots = yield* Effect.forEach(graph.roots, traverseNode)

      return {
        roots: newRoots,
        edges: graph.edges,
        metadata: graph.metadata
      }
    })
  }

  // Common fold algebras
  export const Algebras = {
    // Count all nodes
    count: <A>(): GraphAlgebra<A, number> => ({
      node: (_, __, childCounts) => 1 + childCounts.reduce((a, b) => a + b, 0),
      combine: (results) => results.reduce((a, b) => a + b, 0)
    }),

    // Collect all nodes
    collect: <A>(): GraphAlgebra<A, ReadonlyArray<AnyNode>> => ({
      node: (node, _, childResults) => [node, ...childResults.flat()],
      combine: (results) => results.flat()
    }),

    // Maximum depth
    depth: <A>(): GraphAlgebra<A, number> => ({
      node: (_, __, childDepths) => 1 + (childDepths.length > 0 ? Math.max(...childDepths) : 0),
      combine: (results) => results.length > 0 ? Math.max(...results) : 0
    }),

    // Check if a node exists
    contains: <A>(nodeId: NodeId): GraphAlgebra<A, boolean> => ({
      node: (node, _, childResults) => node.id === nodeId || childResults.some(Boolean),
      combine: (results) => results.some(Boolean)
    })
  }
}

// Encoded representation for serialization
const EncodedCanonicalGraph = S.Struct({
  nodes: S.Record(NodeId, S.Unknown),
  edges: S.Record(EdgeId, Edge),
  metadata: GraphMetadata
})

// Bridge class for compatibility
export class CanonicalGraph extends S.Class<CanonicalGraph>("CanonicalGraph")(
  EncodedCanonicalGraph
) {
  // Convert to algebraic property graph
  toAlgebraic<A>(): AlgebraicPropertyGraph<A> {
    // Build adjacency list
    const adjacency = new Map<NodeId, Set<NodeId>>()
    const nodeMap = new Map<NodeId, AnyNode>()

    // Populate node map
    Object.entries(this.nodes).forEach(([id, node]) => {
      nodeMap.set(id as NodeId, node as AnyNode)
      adjacency.set(id as NodeId, new Set())
    })

    // Build adjacency from edges
    Object.values(this.edges).forEach((edge) => {
      const children = adjacency.get(edge.sourceId) || new Set()
      children.add(edge.targetId)
      adjacency.set(edge.sourceId, children)
    })

    // Find root nodes (nodes with no incoming edges)
    const hasIncoming = new Set<NodeId>()
    Object.values(this.edges).forEach((edge) => {
      hasIncoming.add(edge.targetId)
    })

    const rootIds = Array.from(nodeMap.keys()).filter((id) => !hasIncoming.has(id))

    // Build property nodes recursively
    const buildPropertyNode = (
      nodeId: NodeId,
      visited: Set<NodeId>
    ): PropertyNode<A> | null => {
      if (visited.has(nodeId)) return null
      visited.add(nodeId)

      const node = nodeMap.get(nodeId)
      if (!node) return null

      const childIds = adjacency.get(nodeId) || new Set()
      const children = Array.from(childIds)
        .map((childId) => buildPropertyNode(childId, visited))
        .filter((child): child is PropertyNode<A> => child !== null)

      return {
        node,
        properties: new Map(),
        children
      }
    }

    const visited = new Set<NodeId>()
    const roots = rootIds
      .map((id) => buildPropertyNode(id, visited))
      .filter((root): root is PropertyNode<A> => root !== null)

    return {
      roots,
      edges: new Map(Object.entries(this.edges).map(([id, edge]) => [id as EdgeId, edge])),
      metadata: this.metadata
    }
  }

  // Factory methods remain for compatibility
  static empty(name?: string): CanonicalGraph {
    return new CanonicalGraph({
      nodes: {},
      edges: {},
      metadata: {
        name,
        createdAt: new Date(),
        lastModified: new Date()
      }
    })
  }
}
