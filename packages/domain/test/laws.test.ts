import * as fc from "fast-check"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"
import type { Graph } from "../src/apg/Graph.js"

// Graph arbitrary that generates various graph structures
const graphArb = fc.letrec((tie) => ({
  graph: fc.oneof(
    { maxDepth: 5 },
    { weight: 1, arbitrary: fc.constant(G.empty<string>()) },
    { weight: 2, arbitrary: fc.string().map(G.vertex) },
    {
      weight: 2,
      arbitrary: fc
        .tuple(fc.string(), fc.string())
        .map(([from, to]) => G.edge(from, to))
    },
    {
      weight: 1,
      arbitrary: fc
        .array(fc.string(), { minLength: 2, maxLength: 5 })
        .map(G.path)
    },
    {
      weight: 1,
      arbitrary: fc
        .array(fc.string(), { minLength: 2, maxLength: 4 })
        .map(G.clique)
    },
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
  )
})).graph

describe("Algebraic Laws - Implemented API", () => {
  describe("Overlay Laws", () => {
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

    it("Overlay Identity: x + empty = x", () => {
      fc.assert(
        fc.property(graphArb, (x) => {
          assert.isTrue(G.equals(G.overlay(x, G.empty()), x))
          assert.isTrue(G.equals(G.overlay(G.empty(), x), x))
        })
      )
    })
  })

  describe("Connect Laws", () => {
    it("Connect Associativity: x -> (y -> z) = (x -> y) -> z", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
          assert.isTrue(
            G.equals(G.connect(x, G.connect(y, z)), G.connect(G.connect(x, y), z))
          )
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

  describe("Distributivity Laws", () => {
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
  })

  describe("Decomposition Law", () => {
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
  })

  describe("Equality Properties", () => {
    it("Equality is reflexive", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          assert.isTrue(G.equals(g, g))
        })
      )
    })

    it("Equality is symmetric", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (g1, g2) => {
          if (G.equals(g1, g2)) {
            assert.isTrue(G.equals(g2, g1))
          }
        })
      )
    })

    it("Equality is transitive", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (g1, g2, g3) => {
          if (G.equals(g1, g2) && G.equals(g2, g3)) {
            assert.isTrue(G.equals(g1, g3))
          }
        })
      )
    })

    it("Equal graphs have equal hashes", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (g1, g2) => {
          if (G.equals(g1, g2)) {
            assert.equal(G.hash(g1), G.hash(g2))
          }
        })
      )
    })
  })

  describe("Subgraph Properties", () => {
    it("Subgraph relation is reflexive", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          assert.isTrue(G.isSubgraphOf(g, g))
        })
      )
    })

    it("Empty is subgraph of any graph", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          assert.isTrue(G.isSubgraphOf(G.empty(), g))
        })
      )
    })

    it("Subgraph relation is transitive", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (g1, g2, g3) => {
          if (G.isSubgraphOf(g1, g2) && G.isSubgraphOf(g2, g3)) {
            assert.isTrue(G.isSubgraphOf(g1, g3))
          }
        })
      )
    })

    it("x is subgraph of x + y", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (x, y) => {
          assert.isTrue(G.isSubgraphOf(x, G.overlay(x, y)))
        })
      )
    })
  })

  describe("Derived Constructor Properties", () => {
    it("edge(a,b) = vertex(a) -> vertex(b)", () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (a, b) => {
          const edge = G.edge(a, b)
          const constructed = G.connect(G.vertex(a), G.vertex(b))
          assert.isTrue(G.equals(edge, constructed))
        })
      )
    })

    it("path creates sequential connections", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
          (vertices) => {
            const path = G.path(vertices)

            // Build expected graph manually
            let expected = G.vertex(vertices[0])
            for (let i = 1; i < vertices.length; i++) {
              expected = G.connect(expected, G.vertex(vertices[i]))
            }

            assert.isTrue(G.equals(path, expected))
          }
        )
      )
    })
  })

  describe("Graph Kind Properties", () => {
    it("undirected preserves graph structure", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const u = G.undirected(g)
          assert.equal(G.kind(u), "undirected")

          // Check that vertices are preserved
          // (We can't directly check edges without exposing relation API)
          const gVertices = Array.from(g).sort()
          const uVertices = Array.from(u).sort()
          assert.deepEqual(gVertices, uVertices)
        })
      )
    })

    it("directed preserves graph structure", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const d = G.directed(g)
          assert.equal(G.kind(d), "directed")

          // Check that vertices are preserved
          const gVertices = Array.from(g).sort()
          const dVertices = Array.from(d).sort()
          assert.deepEqual(gVertices, dVertices)
        })
      )
    })
  })
})
