/**
 * Mathematical Properties and Edge Cases for APG
 *
 * This test suite focuses on mathematical correctness and edge cases
 * that are crucial for a production-ready algebraic graph implementation.
 *
 * Covers: complexity bounds, numerical stability, corner cases,
 * and implementation-specific guarantees.
 */

import { Array, Equal, HashSet, pipe } from "effect"
import * as fc from "fast-check"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"

describe("Mathematical Properties & Edge Cases", () => {
  describe("Complexity and Performance Guarantees", () => {
    it("toRelation is memoized and doesn't recompute", () => {
      const g = G.path(["a", "b", "c", "d", "e"])

      // First call should compute
      const start1 = performance.now()
      const rel1 = G.toRelation(g)
      const time1 = performance.now() - start1

      // Second call should be memoized (much faster)
      const start2 = performance.now()
      const rel2 = G.toRelation(g)
      const time2 = performance.now() - start2

      // Same reference due to memoization
      assert.strictEqual(rel1, rel2)
      // Second call should be significantly faster (< 10% of first call)
      assert.isTrue(time2 < time1 * 0.1, `Memoization failed: ${time2}ms vs ${time1}ms`)
    })

    it("transitive closure handles self-loops correctly", () => {
      // Graph with existing self-loop
      const g = G.overlay(
        G.edge("a", "a"), // Self-loop
        G.edge("a", "b")
      )
      const transitive = G.transitive(g)

      // Should preserve existing self-loop and not duplicate
      const edges = Array.fromIterable(G.edges(transitive))
      const selfLoops = edges.filter((e) => e.from === "a" && e.to === "a")
      assert.equal(selfLoops.length, 1, "Self-loop should not be duplicated")
    })

    it("large transitive closure doesn't cause stack overflow", () => {
      // Create a chain of 100 vertices
      const vertices = Array.range(0, 100)
      const chain = G.path(vertices)

      // This should complete without stack overflow
      assert.doesNotThrow(() => {
        const transitive = G.transitive(chain)
        const vertexCount = G.vertexCount(transitive)
        assert.equal(vertexCount, 100)
      })
    })
  })

  describe("Numerical Stability and Edge Cases", () => {
    it("handles graphs with identical vertices correctly", () => {
      // Create graph with duplicate vertex values
      const g = G.overlay(
        G.vertex("a"),
        G.overlay(G.vertex("a"), G.vertex("a"))
      )

      const vertices = G.vertices(g)
      assert.equal(HashSet.size(vertices), 1, "Duplicate vertices should be merged")
    })

    it("handles empty and single-vertex edge cases", () => {
      const empty = G.empty<string>()
      const single = G.vertex("a")

      // Empty graph properties
      assert.equal(G.vertexCount(empty), 0)
      assert.equal(G.edgeCount(empty), 0)
      assert.isTrue(G.equals(G.reflexive(empty), empty))
      assert.isTrue(G.equals(G.transitive(empty), empty))

      // Single vertex properties
      assert.equal(G.vertexCount(single), 1)
      assert.equal(G.edgeCount(single), 0)
      assert.equal(G.edgeCount(G.reflexive(single)), 1) // Self-loop added
      assert.isTrue(G.hasEdge(G.reflexive(single), "a", "a"))
    })

    it("preserves mathematical invariants under all operations", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { maxLength: 10 }),
          (vertices) => {
            const g = G.fromVertices(vertices)
            const reflexive = G.reflexive(g)
            const transitive = G.transitive(g)
            const undirected = G.undirected(g)

            // Vertex count invariant
            const originalCount = G.vertexCount(g)
            assert.equal(G.vertexCount(reflexive), originalCount)
            assert.equal(G.vertexCount(transitive), originalCount)
            assert.equal(G.vertexCount(undirected), originalCount)

            // Reflexive graphs have at least as many edges as original
            assert.isTrue(G.edgeCount(reflexive) >= G.edgeCount(g))

            // Transitive graphs have at least as many edges as original
            assert.isTrue(G.edgeCount(transitive) >= G.edgeCount(g))
          }
        )
      )
    })
  })

  describe("Type Safety and Interface Contracts", () => {
    it("maintains type safety across transformations", () => {
      // Test with different vertex types
      const stringGraph = G.path(["a", "b", "c"])
      const numberGraph = G.path([1, 2, 3])
      const booleanGraph = G.path([true, false])

      // All operations should preserve type
      assert.doesNotThrow(() => {
        G.reflexive(stringGraph)
        G.transitive(numberGraph)
        G.undirected(booleanGraph)
      })
    })

    it("hasEdge is consistent with edge set", () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.string()), { maxLength: 10 }),
          (edgePairs) => {
            const g = G.fromEdges(edgePairs)
            const edgeSet = G.edges(g)

            // Every edge in the set should be found by hasEdge
            for (const edge of edgeSet) {
              assert.isTrue(
                G.hasEdge(g, edge.from, edge.to),
                `hasEdge failed for edge ${edge.from} -> ${edge.to}`
              )
            }
          }
        )
      )
    })

    it("vertex and edge counts are consistent", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { maxLength: 10 }),
          fc.array(fc.tuple(fc.string(), fc.string()), { maxLength: 10 }),
          (vertices, edgePairs) => {
            const g = G.overlay(G.fromVertices(vertices), G.fromEdges(edgePairs))

            const vertexSet = G.vertices(g)
            const edgeSet = G.edges(g)

            assert.equal(G.vertexCount(g), HashSet.size(vertexSet))
            assert.equal(G.edgeCount(g), HashSet.size(edgeSet))
          }
        )
      )
    })
  })

  describe("Correctness of Graph Kinds", () => {
    it("reflexive graphs satisfy reflexivity property", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1, maxLength: 8 }),
          (vertices) => {
            const g = G.fromVertices(vertices)
            const reflexive = G.reflexive(g)

            // Every vertex must have a self-loop
            for (const v of vertices) {
              assert.isTrue(
                G.hasEdge(reflexive, v, v),
                `Missing self-loop for vertex ${v}`
              )
            }
          }
        )
      )
    })

    it("transitive graphs satisfy transitivity property", () => {
      // Test small cases where we can verify transitivity manually
      const cases = [
        { vertices: ["a", "b", "c"], edges: [["a", "b"], ["b", "c"]] },
        { vertices: ["x", "y", "z", "w"], edges: [["x", "y"], ["y", "z"], ["z", "w"]] }
      ]

      for (const { edges, vertices } of cases) {
        const g = G.overlay(
          G.fromVertices(vertices),
          G.fromEdges(edges as Array<[string, string]>)
        )
        const transitive = G.transitive(g)

        // Check transitivity: if (a,b) and (b,c) exist, then (a,c) must exist
        for (const v1 of vertices) {
          for (const v2 of vertices) {
            if (G.hasEdge(transitive, v1, v2)) {
              for (const v3 of vertices) {
                if (G.hasEdge(transitive, v2, v3)) {
                  assert.isTrue(
                    G.hasEdge(transitive, v1, v3),
                    `Transitivity violated: ${v1} -> ${v2} -> ${v3}`
                  )
                }
              }
            }
          }
        }
      }
    })

    it("undirected graphs satisfy symmetry property", () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.string()), { maxLength: 8 }),
          (edgePairs) => {
            const g = G.fromEdges(edgePairs)
            const undirected = G.undirected(g)

            // Every edge should have its reverse
            const edges = G.edges(undirected)
            for (const edge of edges) {
              assert.isTrue(
                G.hasEdge(undirected, edge.to, edge.from),
                `Missing reverse edge for ${edge.from} -> ${edge.to}`
              )
            }
          }
        )
      )
    })
  })

  describe("Boundary Conditions and Error Handling", () => {
    it("handles extremely large vertex sets efficiently", () => {
      // Test with 1000 vertices (still reasonable for CI)
      const largeVertexSet = Array.range(0, 1000).map((i) => `v${i}`)

      assert.doesNotThrow(() => {
        const g = G.fromVertices(largeVertexSet)
        const vertexCount = G.vertexCount(g)
        assert.equal(vertexCount, 1000)
      })
    })

    it("maintains consistency under mixed operations", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { maxLength: 5 }),
          (vertices) => {
            const base = G.fromVertices(vertices)

            // Apply multiple transformations
            const transformed = pipe(
              base,
              G.reflexive,
              G.transpose,
              G.undirected,
              G.transitive
            )

            // Should still have same vertices
            const originalVertices = G.vertices(base)
            const transformedVertices = G.vertices(transformed)
            assert.isTrue(Equal.equals(originalVertices, transformedVertices))
          }
        )
      )
    })

    it("fold handles deeply nested structures", () => {
      // Create a deeply nested graph through repeated overlay
      let deep = G.vertex("base")
      for (let i = 0; i < 100; i++) {
        deep = G.overlay(deep, G.vertex(`v${i}`))
      }

      // Fold should not stack overflow
      assert.doesNotThrow(() => {
        const count = G.fold(deep, {
          onEmpty: () => 0,
          onVertex: () => 1,
          onOverlay: (l, r) => l + r,
          onConnect: (l, r) => l + r
        })
        assert.equal(count, 101) // base + 100 additional vertices
      })
    })
  })
})
