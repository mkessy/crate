/**
 * Algebraic graph relation implementation.
 *
 * This module provides the algebraic interpreter that transforms the abstract
 * graph representation into its canonical relation form (vertex and edge sets).
 *
 * @since 1.0.0
 * @module
 */

import { Array, Equal, Hash, HashSet, Inspectable, pipe } from "effect"
import type * as R from "../Relation.js"
import type { GraphBacking, GraphImpl, GraphKind } from "./core.js"
import { isGraphImpl } from "./core.js"
import * as Edge from "./edge.js"

// -----------------------------------------------------------------------------
// #region Symmetric Closure Implementation
// -----------------------------------------------------------------------------
const RelationSymbolKey = "@apg/Relation"

/**
 * @since 1.0.0
 * @category symbols
 */
export const RelationTypeId: R.TypeId = Symbol.for(RelationSymbolKey) as R.TypeId

/**
 * The canonical representation of a Graph as a set of vertices and a set of
 * edges. This is the normalized form used for analysis and operations.
 *
 * @since 1.0.0
 * @category models
 */
class Relation<in out A> implements R.Relation<A> {
  readonly [RelationTypeId]: R.TypeId = RelationTypeId
  readonly edges: HashSet.HashSet<Edge.Edge<A>> = HashSet.empty<Edge.Edge<A>>()
  readonly vertices: HashSet.HashSet<A> = HashSet.empty<A>()

  constructor(vertices: HashSet.HashSet<A>, edges: HashSet.HashSet<Edge.Edge<A>>) {
    this.vertices = vertices
    this.edges = edges
  }

  [Equal.symbol](this: Relation<any>, that: Relation<any>): boolean {
    return Equal.equals(this, that)
  }

  [Hash.symbol](this: Relation<any>): number {
    return pipe(
      Hash.hash(this.vertices),
      Hash.combine(Hash.hash(this.edges)),
      Hash.combine(Hash.string("@apg/Relation"))
    )
  }

  [Symbol.iterator]<A>(this: Relation<A>): Iterator<A> {
    return this.vertices[Symbol.iterator]()
  }

  [Inspectable.NodeInspectSymbol](this: Relation<any>) {
    return this.toJSON()
  }

  pipe(): this {
    return this
  }

  toString() {
    return Inspectable.format(this)
  }

  toJSON<A>(this: Relation<A>) {
    return {
      _id: "Relation",
      vertices: Array.fromIterable(this.vertices),
      edges: Array.fromIterable(this.edges)
    }
  }
}

/**
 * Computes the symmetric closure of a set of edges.
 *
 * For undirected graphs: if (a,b) ∈ E then (b,a) ∈ E
 *
 * @since 1.0.0
 * @category internal
 */
const makeSymmetricClosure = <A>(
  edges: HashSet.HashSet<Edge.Edge<A>>
): HashSet.HashSet<Edge.Edge<A>> => {
  return pipe(
    edges,
    HashSet.flatMap((edge) =>
      HashSet.fromIterable([
        edge,
        Edge.reverse(edge)
      ])
    )
  )
}

// -----------------------------------------------------------------------------
// #region Reflexive Closure Implementation
// -----------------------------------------------------------------------------

/**
 * Adds reflexive edges (self-loops) to the relation.
 *
 * For reflexive graphs: ∀v ∈ V, (v,v) ∈ E
 *
 * @since 1.0.0
 * @category internal
 */
const addReflexiveEdges = <A>(
  vertices: HashSet.HashSet<A>,
  edges: HashSet.HashSet<Edge.Edge<A>>
): HashSet.HashSet<Edge.Edge<A>> => {
  const selfLoops = pipe(
    vertices,
    HashSet.map((v) => Edge.make(v, v))
  )

  return pipe(
    edges,
    HashSet.union(selfLoops)
  )
}

// -----------------------------------------------------------------------------
// #region Transitive Closure Implementation
// -----------------------------------------------------------------------------

/**
 * Computes the transitive closure using a functional variant of Warshall's algorithm.
 *
 * For transitive graphs: if (a,b) ∈ E and (b,c) ∈ E then (a,c) ∈ E
 *
 * Time Complexity: O(V³) where V is the number of vertices
 * Space Complexity: O(V²) for the adjacency representation
 *
 * @since 1.0.0
 * @category internal
 */
const computeTransitiveClosure = <A>(
  edges: HashSet.HashSet<Edge.Edge<A>>
): HashSet.HashSet<Edge.Edge<A>> => {
  // Extract all vertices from edges
  const vertices = pipe(
    edges,
    HashSet.flatMap((edge) => HashSet.fromIterable([edge.from, edge.to]))
  )

  // Build adjacency map for efficient lookup
  const adjacencyMap = pipe(
    edges,
    Array.fromIterable,
    Array.reduce(
      new Map<A, HashSet.HashSet<A>>(),
      (map, edge) => {
        const targets = map.get(edge.from) || HashSet.empty<A>()
        map.set(edge.from, HashSet.add(targets, edge.to))
        return map
      }
    )
  )

  // Floyd-Warshall algorithm adapted for functional style
  let closure = edges
  let changed = true

  while (changed) {
    const newEdges = pipe(
      Array.fromIterable(vertices),
      Array.flatMap((k) =>
        pipe(
          Array.fromIterable(vertices),
          Array.flatMap((i) =>
            pipe(
              Array.fromIterable(vertices),
              Array.filter((j) => {
                // Check if path i -> k -> j exists
                const hasIK = adjacencyMap.get(i)?.pipe(HashSet.has(k)) ?? false
                const hasKJ = adjacencyMap.get(k)?.pipe(HashSet.has(j)) ?? false
                const hasIJ = adjacencyMap.get(i)?.pipe(HashSet.has(j)) ?? false

                return hasIK && hasKJ && !hasIJ
              }),
              Array.map((j) => Edge.make(i, j))
            )
          )
        )
      ),
      HashSet.fromIterable
    )

    const nextClosure = HashSet.union(closure, newEdges)
    changed = HashSet.size(nextClosure) > HashSet.size(closure)

    if (changed) {
      // Update adjacency map with new edges
      pipe(
        newEdges,
        HashSet.forEach((edge) => {
          const targets = adjacencyMap.get(edge.from) || HashSet.empty<A>()
          adjacencyMap.set(edge.from, HashSet.add(targets, edge.to))
        })
      )
    }

    closure = nextClosure
  }

  return closure
}

// -----------------------------------------------------------------------------
// #region Kind Transformations
// -----------------------------------------------------------------------------

/**
 * Applies graph kind-specific transformations to a relation.
 *
 * This function ensures that the resulting relation satisfies the mathematical
 * properties required by the specified graph kind.
 *
 * @since 1.0.0
 * @category internal
 */
const applyKindTransformations = <A>(
  kind: GraphKind,
  relation: R.Relation<A>
): R.Relation<A> => {
  switch (kind) {
    case "directed":
      return relation
    case "undirected":
      return new Relation(
        relation.vertices,
        makeSymmetricClosure(relation.edges)
      )
    case "reflexive":
      return new Relation(
        relation.vertices,
        addReflexiveEdges(relation.vertices, relation.edges)
      )
    case "transitive":
      return new Relation(
        relation.vertices,
        computeTransitiveClosure(relation.edges)
      )
  }
}

// -----------------------------------------------------------------------------
// #region The Algebraic Interpreter
// -----------------------------------------------------------------------------

/**
 * The recursive interpreter for the algebraic graph representation.
 *
 * This function traverses the algebraic structure and computes the canonical
 * relation representation. The implementation follows Mokhov's formulation
 * precisely.
 *
 * Note: This implementation is not stack-safe for deeply nested graphs.
 * A future optimization could use a trampolining approach if needed.
 *
 * @since 1.0.0
 * @category internal
 */
const computeRelation = <A>(
  backing: GraphBacking<A>
): R.Relation<A> => {
  switch (backing._tag) {
    case "Empty": {
      return new Relation(HashSet.empty<A>(), HashSet.empty<Edge.Edge<A>>())
    }

    case "Vertex": {
      return new Relation(HashSet.make(backing.value), HashSet.empty<Edge.Edge<A>>())
    }

    case "Overlay": {
      const left = toRelation(backing.left as GraphImpl<A>)
      const right = toRelation(backing.right as GraphImpl<A>)
      return new Relation(
        HashSet.union(left.vertices, right.vertices),
        HashSet.union(left.edges, right.edges)
      )
    }

    case "Connect": {
      const left = toRelation(backing.left as GraphImpl<A>)
      const right = toRelation(backing.right as GraphImpl<A>)

      // Create edges from all vertices in left to all vertices in right
      const newEdges = pipe(
        Array.fromIterable(left.vertices),
        Array.flatMap((a) =>
          pipe(
            Array.fromIterable(right.vertices),
            Array.map((b) => Edge.make(a, b))
          )
        ),
        HashSet.fromIterable
      )

      const vertices = HashSet.union(left.vertices, right.vertices)
      const edges = HashSet.union(HashSet.union(left.edges, right.edges), newEdges)

      return new Relation(vertices, edges)
    }
  }
}

// not effectful now and so will be expensive because we won't check if the graph changed
// -----------------------------------------------------------------------------
// #region Public API
// -----------------------------------------------------------------------------

/**
 * Converts a `Graph` into its canonical `Relation` form.
 *
 * This function is the bridge from the abstract algebraic representation to a
 * concrete, analyzable data structure. It uses memoization to avoid
 * re-computing the relation for the same graph.
 *
 * The implementation follows a two-phase approach:
 * 1. Compute the base relation from the algebraic structure
 * 2. Apply kind-specific transformations to ensure mathematical properties
 *
 * @since 1.0.0
 * @category conversions
 */
export const toRelation = <A>(
  graph: GraphImpl<A>
): R.Relation<A> => {
  if (!isGraphImpl(graph)) {
    throw new Error("Invalid graph implementation")
  }

  const impl = graph as GraphImpl<A>

  // Check memoization cache first
  if (impl._relation !== undefined) {
    return impl._relation
  }

  // Compute the base relation from the algebraic backing
  const baseRelation = computeRelation(impl.backing)

  // Apply kind-specific transformations
  const transformedRelation = applyKindTransformations(impl.kind, baseRelation)

  // Cache the result for future calls
  impl._relation = transformedRelation

  return transformedRelation
}

export const toReflexive = <A>(g: R.Relation<A>): R.Relation<A> => {
  return applyKindTransformations("reflexive", g)
}
