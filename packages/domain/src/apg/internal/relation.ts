/**
 * Algebraic graph relation implementation.
 *
 * This module provides the algebraic interpreter that transforms the abstract
 * graph representation into its canonical relation form (vertex and edge sets).
 *
 * @since 1.0.0
 * @module
 */

import type { Equivalence } from "effect"
import { Array, HashSet, identity, pipe } from "effect"
import type { GraphBacking, GraphImpl, GraphKind, Relation } from "./core.js"
import { isGraphImpl } from "./core.js"
import * as Edge from "./edge.js"

// -----------------------------------------------------------------------------
// #region Symmetric Closure Implementation
// -----------------------------------------------------------------------------

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
  kind: GraphKind
): (relation: Relation<A>) => Relation<A> => {
  switch (kind) {
    case "directed":
      // No transformation needed - directed is the default
      return identity

    case "undirected":
      // Apply symmetric closure: if (a,b) ∈ E then (b,a) ∈ E
      return (relation) => ({
        vertices: relation.vertices,
        edges: makeSymmetricClosure(relation.edges)
      })

    case "reflexive":
      // Add self-loops: ∀v ∈ V, (v,v) ∈ E
      return (relation) => ({
        vertices: relation.vertices,
        edges: addReflexiveEdges(relation.vertices, relation.edges)
      })

    case "transitive":
      // Apply transitive closure: if (a,b) ∈ E and (b,c) ∈ E then (a,c) ∈ E
      return (relation) => ({
        vertices: relation.vertices,
        edges: computeTransitiveClosure(relation.edges)
      })
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
  backing: GraphBacking<A>,
  E: Equivalence.Equivalence<A>
): Relation<A> => {
  switch (backing._tag) {
    case "Empty": {
      return {
        vertices: HashSet.empty<A>(),
        edges: HashSet.empty<Edge.Edge<A>>()
      }
    }

    case "Vertex": {
      return {
        vertices: HashSet.make(backing.value),
        edges: HashSet.empty<Edge.Edge<A>>()
      }
    }

    case "Overlay": {
      const left = toRelation(backing.left as GraphImpl<A>, E)
      const right = toRelation(backing.right as GraphImpl<A>, E)
      return {
        vertices: pipe(left.vertices, HashSet.union(right.vertices)),
        edges: pipe(left.edges, HashSet.union(right.edges))
      }
    }

    case "Connect": {
      const left = toRelation(backing.left as GraphImpl<A>, E)
      const right = toRelation(backing.right as GraphImpl<A>, E)

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

      return {
        vertices: pipe(left.vertices, HashSet.union(right.vertices)),
        edges: pipe(
          left.edges,
          HashSet.union(right.edges),
          HashSet.union(newEdges)
        )
      }
    }

    case "Relation": {
      return backing.relation
    }
  }
}

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
  graph: GraphImpl<A>,
  E: Equivalence.Equivalence<A>
): Relation<A> => {
  if (!isGraphImpl(graph)) {
    throw new Error("Invalid graph implementation")
  }

  const impl = graph as GraphImpl<A>

  // Check memoization cache first
  if (impl._relation !== undefined) {
    return impl._relation
  }

  // Compute the base relation from the algebraic backing
  const baseRelation = computeRelation(impl.backing, E)

  // Apply kind-specific transformations
  const transformedRelation = pipe(
    baseRelation,
    applyKindTransformations(impl.kind)
  )

  // Cache the result for future calls
  impl._relation = transformedRelation

  return transformedRelation
}
