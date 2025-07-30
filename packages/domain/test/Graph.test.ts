import type { Equivalence } from "effect"
import { Data, Equal, Hash, HashSet, pipe } from "effect"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"

describe("Graph - Implemented API Tests", () => {
  describe("constructors", () => {
    it("empty", () => {
      const g = G.empty()
      assert.isTrue(G.equals(g, G.empty()))
    })

    it("vertex", () => {
      const g = G.vertex("a")
      assert.isTrue(G.equals(g, G.vertex("a")))
      assert.isFalse(G.equals(g, G.vertex("b")))
    })

    it("edge", () => {
      const g = G.edge("a", "b")
      const expected = pipe(G.vertex("a"), G.connect(G.vertex("b")))
      assert.isTrue(G.equals(g, expected))
    })

    it("path", () => {
      const g = G.path(["a", "b", "c"])
      const expected = pipe(
        G.vertex("a"),
        G.connect(G.vertex("b")),
        G.connect(G.vertex("c"))
      )
      assert.isTrue(G.equals(g, expected))
    })

    it("path with empty array returns empty graph", () => {
      const g = G.path([])
      assert.isTrue(G.equals(g, G.empty()))
    })

    it("clique", () => {
      const g = G.clique(["a", "b", "c"])
      // In a clique, every vertex connects to every other vertex
      const vs = G.fromVertices(["a", "b", "c"])
      const expected = G.connect(vs, vs)
      assert.isTrue(G.equals(g, expected))
    })
  })

  describe("core algebraic operations", () => {
    it("overlay combines vertex sets", () => {
      const g1 = G.vertex("a")
      const g2 = G.vertex("b")
      const g3 = G.overlay(g1, g2)

      // g3 should have both vertices but no edges between them
      assert.isFalse(G.equals(g3, G.edge("a", "b")))
      assert.isTrue(G.isSubgraphOf(g1, g3))
      assert.isTrue(G.isSubgraphOf(g2, g3))
    })

    it("connect creates edges from left to right", () => {
      const g1 = G.vertex("a")
      const g2 = G.vertex("b")
      const g3 = G.connect(g1, g2)

      assert.isTrue(G.equals(g3, G.edge("a", "b")))
    })

    it("overlay is commutative", () => {
      const g1 = G.edge("a", "b")
      const g2 = G.edge("c", "d")

      assert.isTrue(G.equals(G.overlay(g1, g2), G.overlay(g2, g1)))
    })
  })

  describe("predicates", () => {
    describe("isSubgraphOf", () => {
      it("empty graph is subgraph of any graph", () => {
        const g = G.path(["a", "b", "c"])
        assert.isTrue(G.isSubgraphOf(G.empty(), g))
      })

      it("any graph is subgraph of itself", () => {
        const g = G.path(["a", "b", "c"])
        assert.isTrue(G.isSubgraphOf(g, g))
      })

      it("vertex is subgraph of edge containing it", () => {
        const v = G.vertex("a")
        const e = G.edge("a", "b")
        assert.isTrue(G.isSubgraphOf(v, e))
      })

      it("edge is not subgraph of its vertices", () => {
        const e = G.edge("a", "b")
        const v = G.overlay(G.vertex("a"), G.vertex("b"))
        assert.isFalse(G.isSubgraphOf(e, v))
      })
    })

    describe("equals", () => {
      it("uses intrinsic Equal implementation", () => {
        const g1 = G.overlay(G.edge("a", "b"), G.edge("c", "d"))
        const g2 = G.overlay(G.edge("c", "d"), G.edge("a", "b"))

        assert.isTrue(G.equals(g1, g2))
        assert.isTrue(Equal.equals(g1, g2)) // Same as G.equals
      })

      it("different graphs are not equal", () => {
        const g1 = G.edge("a", "b")
        const g2 = G.edge("b", "a")

        assert.isFalse(G.equals(g1, g2))
      })
    })

    describe.skip("equalsWith", () => {
      interface Node {
        id: string
        metadata?: unknown
      }

      const nodeEq: Equivalence.Equivalence<Node> = (a, b) => a.id === b.id

      it("allows custom vertex equivalence", () => {
        const n1: Node = { id: "A", metadata: { version: 1 } }
        const n2: Node = { id: "A", metadata: { version: 2 } }
        const n3: Node = { id: "B" }

        const g1 = G.edge(n1, n3)
        const g2 = G.edge(n2, n3)

        // With custom equivalence, they are equal
        assert.throws(() => G._equalsWith(g1, g2, nodeEq), "Not implemented")

        // With default equality, they are different
        assert.isFalse(G.equals(g1, g2))
      })
    })
  })

  describe("hashing", () => {
    it("equal graphs have equal hashes", () => {
      const g1 = G.overlay(G.edge("a", "b"), G.vertex("c"))
      const g2 = G.overlay(G.vertex("c"), G.edge("a", "b"))

      assert.equal(G.hash(g1), G.hash(g2))
    })

    it("uses Effect's Hash implementation", () => {
      const g = G.edge("a", "b")
      assert.equal(G.hash(g), Hash.hash(g))
    })
  })

  describe("directed and undirected graphs", () => {
    it("undirected creates undirected graph", () => {
      const g = G.edge("a", "b")
      const u = G.undirected(g)

      assert.equal(G.kind(u), "undirected")
    })

    it("directed creates directed graph", () => {
      const g = G.edge("a", "b")
      const d = G.directed(g)

      assert.equal(G.kind(d), "directed")
    })

    it("toUndirected converts to undirected", () => {
      const g = G.edge("a", "b")
      const u = G.toUndirected(g)

      assert.equal(G.kind(u), "undirected")
    })

    it("toDirected converts to directed", () => {
      const g = G.edge("a", "b")
      const d = G.toDirected(g)

      assert.equal(G.kind(d), "directed")
    })
  })

  describe("Effect integration", () => {
    it("graphs work with HashSet", () => {
      const g1 = G.edge("a", "b")
      const g2 = G.overlay(G.vertex("a"), G.vertex("b"))
      const g3 = G.connect(G.vertex("a"), G.vertex("b")) // Same as g1

      const set = pipe(
        HashSet.empty<G.Graph<string>>(),
        HashSet.add(g1),
        HashSet.add(g2),
        HashSet.add(g3)
      )

      // g1 and g3 are equal, so set should have 2 elements
      assert.equal(HashSet.size(set), 2)
    })

    it("graphs can be iterated", () => {
      const g = G.path(["a", "b", "c"])
      const vertices = Array.from(g)

      assert.includeMembers(vertices, ["a", "b", "c"])
    })
  })

  describe("Custom Vertices with Data.Class", () => {
    class Person extends Data.Class<{ readonly id: number; readonly name: string }> {}

    it("treats vertices with same data as equal", () => {
      const g1 = G.vertex(new Person({ id: 1, name: "Alice" }))
      const g2 = G.vertex(new Person({ id: 1, name: "Alice" }))
      const g3 = G.vertex(new Person({ id: 1, name: "Alice V2" }))

      assert.isTrue(G.equals(g1, g2)) // Same data
      assert.isFalse(G.equals(g1, g3)) // Different name
    })

    it("works with complex graph operations", () => {
      const alice = new Person({ id: 1, name: "Alice" })
      const bob = new Person({ id: 2, name: "Bob" })
      const alice2 = new Person({ id: 1, name: "Alice" })

      const g1 = G.edge(alice, bob)
      const g2 = G.edge(alice2, bob)

      assert.isTrue(G.equals(g1, g2))
    })
  })

  describe("edge cases", () => {
    it("empty path returns empty graph", () => {
      assert.isTrue(G.equals(G.path([]), G.empty()))
    })

    it("single vertex path", () => {
      assert.isTrue(G.equals(G.path(["a"]), G.vertex("a")))
    })

    it("empty clique returns empty graph", () => {
      assert.isTrue(G.equals(G.clique([]), G.empty()))
    })

    it("operations preserve graph type", () => {
      const g1 = G.edge("a", "b")
      const g2 = G.edge("c", "d")

      const overlaid = G.overlay(g1, g2)
      const connected = G.connect(g1, g2)

      // Both operations return Graph<string>
      const _typeCheck1: G.Graph<string> = overlaid
      const _typeCheck2: G.Graph<string> = connected
    })
  })
})
