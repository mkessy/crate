import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"

describe("Graph Operators", () => {
  describe("map", () => {
    it("should apply a function to each vertex", () => {
      const g = G.path([1, 2, 3])
      const mapped = G.map(g, (n) => n * 2)
      const expected = G.path([2, 4, 6])
      assert.isTrue(G.equals(mapped, expected))
    })

    it("should preserve the structure of the graph", () => {
      const g = G.connect(G.vertex(1), G.overlay(G.vertex(2), G.vertex(3)))
      const mapped = G.map(g, (n) => `v${n}`)
      const expected = G.connect(G.vertex("v1"), G.overlay(G.vertex("v2"), G.vertex("v3")))
      assert.isTrue(G.equals(mapped, expected))
    })

    it("map(id) === id (Functor identity law)", () => {
      const g = G.clique([1, 2, 3, 4])
      assert.isTrue(G.equals(G.map(g, (x) => x), g))
    })
  })

  describe("fold", () => {
    const countVertices = <A>(g: G.Graph<A>): number =>
      G.fold(g, {
        onEmpty: () => 0,
        onVertex: (_) => 1,
        onOverlay: (l, r) => l + r,
        onConnect: (l, r) => l + r
      })

    it("can be used to count vertices", () => {
      const g2 = G.empty()
      const g3 = G.path([1, 2, 3])

      assert.equal(countVertices(g2), 0)
      assert.equal(G.vertexCount(g2), 0)
      assert.equal(countVertices(g3), 3)
      assert.equal(G.vertexCount(g3), 3)
    })

    const hasVertex = <A>(g: G.Graph<A>, v: A): boolean =>
      G.fold(g, {
        onEmpty: () => false,
        onVertex: (x) => x === v,
        onOverlay: (l, r) => l || r,
        onConnect: (l, r) => l || r
      })

    it("can be used to check for vertex existence", () => {
      const g = G.path(["a", "b", "c"])
      assert.isTrue(hasVertex(g, "b"))
      assert.isFalse(hasVertex(g, "d"))
    })
  })

  describe("transpose", () => {
    it("should reverse the direction of all edges", () => {
      const g = G.path([1, 2, 3]) // 1 -> 2 -> 3
      const transposed = G.transpose(g)
      // const expected = G.path([3, 2, 1]) // 3 -> 2 -> 1

      // Note: The algebraic structure will be different, but the relational
      // representation of the edges will be reversed.
      assert.isTrue(G.hasEdge(g, 1, 2))
      assert.isFalse(G.hasEdge(g, 2, 1))

      assert.isTrue(G.hasEdge(transposed, 2, 1))
      assert.isFalse(G.hasEdge(transposed, 1, 2))
    })

    it("transpose(transpose(g)) === g (involution)", () => {
      const g = G.connect(G.clique([1, 2]), G.path([3, 4]))
      const transposedOnce = G.transpose(g)
      const transposedTwice = G.transpose(transposedOnce)

      assert.isTrue(G.equals(g, transposedTwice))
    })

    it("transpose of an undirected graph is itself", () => {
      const g = G.undirected(G.path([1, 2, 3]))
      const transposed = G.transpose(g)
      assert.isTrue(G.equals(g, transposed))
    })
  })
})
