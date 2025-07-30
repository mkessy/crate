import * as fc from "fast-check"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"
import type { Graph } from "../src/apg/internal/core.js"

const graphArb = fc.letrec((tie) => ({
  graph: fc.oneof(
    { maxDepth: 5 },
    { weight: 1, arbitrary: fc.constant(G.empty()) },
    { weight: 2, arbitrary: fc.string().map(G.vertex) },
    {
      weight: 4,
      arbitrary: fc
        .tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("graph") as fc.Arbitrary<Graph<string>>)
        .map(([g1, g2]) => G.overlay(g1, g2))
    },
    {
      weight: 4,
      arbitrary: fc
        .tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("graph") as fc.Arbitrary<Graph<string>>)
        .map(([g1, g2]) => G.connect(g1, g2))
    }
  ),
  nonEmpty: fc.oneof(
    { maxDepth: 5 },
    { weight: 2, arbitrary: fc.string().map(G.vertex) },
    {
      weight: 4,
      arbitrary: fc
        .tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("nonEmpty") as fc.Arbitrary<Graph<string>>)
        .map(([g1, g2]) => G.overlay(g1, g2))
    },
    {
      weight: 4,
      arbitrary: fc
        .tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("nonEmpty") as fc.Arbitrary<Graph<string>>)
        .map(([g1, g2]) => G.connect(g1, g2))
    }
  )
})).graph

describe("Algebraic Laws", () => {
  it("Overlay Commutativity: x + y = y + x", () => {
    fc.assert(
      fc.property(graphArb, graphArb, (x, y) => {
        assert.isTrue(G.equals(G.overlay(x, y), G.overlay(y, x)))
      })
    )
  })

  it("Overlay Associativity: x + (y + z) = (x + y) + z", () => {
    fc.assert(
      fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
        assert.isTrue(
          G.equals(G.overlay(x, G.overlay(y, z)), G.overlay(G.overlay(x, y), z))
        )
      })
    )
  })

  it("Connect Associativity: x -> (y -> z) = (x -> y) -> z", () => {
    fc.assert(
      fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
        assert.isTrue(
          G.equals(G.connect(x, G.connect(y, z)), G.connect(G.connect(x, y), z))
        )
      })
    )
  })

  it("Left Distributivity: (x + y) -> z = (x -> z) + (y -> z)", () => {
    fc.assert(
      fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
        const lhs = G.connect(G.overlay(x, y), z)
        const rhs = G.overlay(G.connect(x, z), G.connect(y, z))
        assert.isTrue(G.equals(lhs, rhs))
      })
    )
  })

  it("Right Distributivity: x -> (y + z) = (x -> y) + (x -> z)", () => {
    fc.assert(
      fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
        const lhs = G.connect(x, G.overlay(y, z))
        const rhs = G.overlay(G.connect(x, y), G.connect(x, z))
        assert.isTrue(G.equals(lhs, rhs))
      })
    )
  })

  it("Decomposition: x -> y -> z = (x -> y) + (x -> z) + (y -> z)", () => {
    fc.assert(
      fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
        const lhs = G.connect(G.connect(x, y), z)
        const rhs = G.overlay(
          G.connect(x, y),
          G.overlay(G.connect(x, z), G.connect(y, z))
        )
        assert.isTrue(G.equals(lhs, rhs))
      })
    )
  })

  it("Overlay Identity: x + empty = x", () => {
    fc.assert(
      fc.property(graphArb, (x) => {
        assert.isTrue(G.equals(G.overlay(x, G.empty()), x))
      })
    )
  })

  it("Connect Identity: x -> empty = x, empty -> x = x", () => {
    fc.assert(
      fc.property(graphArb, (x) => {
        assert.isTrue(G.equals(G.connect(x, G.empty()), x))
        assert.isTrue(G.equals(G.connect(G.empty(), x), x))
      })
    )
  })
})
