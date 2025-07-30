import { pipe } from "effect"
import { assert, describe, it } from "vitest"

import * as G from "../src/apg/Graph.js"

describe("Graph", () => {
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
  })

  describe("core operations", () => {
    it("overlay", () => {
      const g1 = G.edge("a", "b")
      const g2 = G.edge("c", "d")
      const g3 = G.overlay(g1, g2)

      const expected = pipe(
        G.vertex("a"),
        G.connect(G.vertex("b")),
        G.overlay(pipe(G.vertex("c"), G.connect(G.vertex("d"))))
      )

      assert.isTrue(G.equals(g3, expected))
    })

    it("connect", () => {
      const g1 = G.vertex("a")
      const g2 = G.vertex("b")
      const g3 = G.connect(g1, g2)

      assert.isTrue(G.equals(g3, G.edge("a", "b")))
    })
  })

  describe("predicates", () => {
    it("isSubgraphOf", () => {
      const g1 = G.edge("a", "b")
      const g2 = G.path(["a", "b", "c"])
      const g3 = G.vertex("d")

      assert.isTrue(G.isSubgraphOf(g1, g2))
      assert.isFalse(G.isSubgraphOf(g2, g1))
      assert.isFalse(G.isSubgraphOf(g1, g3))
      assert.isTrue(G.isSubgraphOf(G.empty(), g1))
    })
  })

  describe("undirected graphs", () => {
    it("should have symmetric edges", () => {
      const g = G.undirected(G.edge(1, 2))
      const forward = G.edge(1, 2)
      const backward = G.edge(2, 1)
      const expected = G.overlay(forward, backward)

      assert.isTrue(G.equals(g, expected))
    })
  })
})
