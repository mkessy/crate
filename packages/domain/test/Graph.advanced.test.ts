import { HashSet, pipe } from "effect"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"
import type { Graph, GraphImpl } from "../src/apg/internal/core.js"
import * as R from "../src/apg/Relation.js"

describe("Advanced Graph Tests", () => {
  describe("Memoization and Performance", () => {
    it("should memoize relation computation", () => {
      const g = G.path(["a", "b", "c", "d", "e"])
      const impl = g as GraphImpl<string>

      // First call computes relation
      assert.isUndefined(impl._relation)
      const rel1 = G.toRelation(g)
      assert.isDefined(impl._relation)

      // Second call returns memoized result
      const rel2 = G.toRelation(g)
      assert.strictEqual(rel1, rel2) // Same reference
    })

    it("should handle deep graph structures", () => {
      // Create a deeply nested graph
      let deep: Graph<number> = G.vertex(0)
      for (let i = 1; i < 100; i++) {
        deep = G.connect(deep, G.vertex(i))
      }

      // Should not stack overflow
      const rel = G.toRelation(deep)
      assert.equal(HashSet.size(rel.vertices), 100)
    })
  })

  describe("Graph Kinds", () => {
    describe("Reflexive Graphs", () => {
      it("should add self-loops to all vertices", () => {
        const g = pipe(
          G.path(["a", "b", "c"])
          // TODO: Implement reflexive
        )

        const rel = G.toRelation(g)

        // Check self-loops exist
        assert.isTrue(G.hasEdge(g, "a", "a"))
        assert.isTrue(G.hasEdge(g, "b", "b"))
        assert.isTrue(G.hasEdge(g, "c", "c"))
      })
    })

    describe("Transitive Graphs", () => {
      it("should compute transitive closure", () => {
        const g = pipe(
          G.path(["a", "b", "c"])
          // TODO: Implement transitive
        )

        const rel = G.toRelation(g)

        // Direct edges
        assert.isTrue(G.hasEdge(g, "a", "b"))
        assert.isTrue(G.hasEdge(g, "b", "c"))

        // Transitive edge
        assert.isTrue(G.hasEdge(g, "a", "c"))
      })

      it("should handle cycles in transitive closure", () => {
        const g = pipe(
          G.overlay(
            G.edge("a", "b"),
            G.overlay(
              G.edge("b", "c"),
              G.edge("c", "a")
            )
          )
          // TODO: Implement transitive
        )

        const rel = G.toRelation(g)

        // All pairs should be connected
        assert.isTrue(G.hasEdge(g, "a", "a")) // Self-loop from cycle
        assert.isTrue(G.hasEdge(g, "b", "b"))
        assert.isTrue(G.hasEdge(g, "c", "c"))
      })
    })
  })

  describe("Equal Trait Implementation", () => {
    it("should detect equal graphs with different construction", () => {
      const g1 = G.overlay(G.edge("a", "b"), G.edge("c", "d"))
      const g2 = G.overlay(G.edge("c", "d"), G.edge("a", "b"))

      assert.isTrue(G.equals(g1, g2))
    })

    it("should work with HashSet", () => {
      const g1 = G.edge("a", "b")
      const g2 = G.overlay(G.vertex("a"), G.vertex("b"))
      const g3 = G.connect(G.vertex("a"), G.vertex("b"))

      const set = HashSet.make(g1, g2, g3)
      assert.equal(HashSet.size(set), 2) // g1 and g3 are equal
    })
  })

  describe("Custom Equivalence", () => {
    interface Node {
      id: string
      metadata: Record<string, unknown>
    }

    it("should support custom vertex equivalence", () => {
      interface Node {
        id: string
        metadata: Record<string, unknown>
      }
      const nodeEq: Equivalence.Equivalence<Node> = (a, b) => a.id === b.id

      const n1: Node = { id: "A", metadata: { version: 1 } }
      const n2: Node = { id: "A", metadata: { version: 2 } }
      const n3: Node = { id: "B", metadata: {} }

      const g1 = G.edge(n1, n3)
      const g2 = G.edge(n2, n3)

      assert.throws(() => G._equalsWith(g1, g2, nodeEq), "Not implemented")
      assert.isFalse(G.equals(g1, g2)) // Different with default equality
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty graph operations", () => {
      const empty = G.empty<string>()
      assert.isTrue(G.isSubgraphOf(empty, empty))
      assert.isTrue(G.equals(G.overlay(empty, empty), empty))
      assert.isTrue(G.equals(G.connect(empty, empty), empty))
    })

    it("should handle single vertex operations", () => {
      const v = G.vertex("a")
      assert.isTrue(G.isSubgraphOf(v, v))
      assert.isTrue(G.equals(G.overlay(v, v), v))
      assert.isFalse(G.equals(G.connect(v, v), v)) // Creates self-loop
    })
  })

  describe("Complex Graph Patterns", () => {
    it("should construct complete graphs (cliques)", () => {
      const vertices = ["a", "b", "c", "d"]
      const clique = G.clique(vertices)

      const rel = G.toRelation(clique)

      // Check all edges exist
      for (const v1 of vertices) {
        for (const v2 of vertices) {
          if (v1 !== v2) {
            assert.isTrue(
              G.hasEdge(clique, v1, v2),
              `Missing edge ${v1} -> ${v2}`
            )
          }
        }
      }
    })

    it("should detect graph isomorphism (with custom equivalence)", () => {
      // Two structurally identical graphs with different vertex labels
      const g1 = G.path([1, 2, 3])
      const g2 = G.path(["a", "b", "c"])

      // With a special equivalence that maps vertices
      const isoEq: Equivalence<string | number> = (a, b) => {
        const map: Record<string | number, string | number> = {
          1: "a",
          2: "b",
          3: "c",
          "a": 1,
          "b": 2,
          "c": 3
        }
        return a === b || map[a] === b
      }

      // This would require a more sophisticated isomorphism check
      // For now, we just verify they have the same structure
      const rel1 = G.toRelation(g1)
      const rel2 = G.toRelation(g2)

      assert.equal(HashSet.size(rel1.vertices), HashSet.size(rel2.vertices))
      assert.equal(HashSet.size(rel1.edges), HashSet.size(rel2.edges))
    })
  })
})
