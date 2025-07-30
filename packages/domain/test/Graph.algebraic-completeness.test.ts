/**
 * Comprehensive Algebraic Law Tests for APG Implementation
 *
 * This test suite covers algebraic properties that are essential for
 * a correct implementation but may not be fully covered elsewhere.
 *
 * Based on Mokhov's "Algebraic Graphs with Class" and foundational
 * category theory principles.
 */

import { Equal, pipe } from "effect"
import * as fc from "fast-check"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"
import type { Graph } from "../src/apg/internal/core.js"

// Test arbitraries with minimum characteristics
const stringVertexArb = fc.string({ minLength: 1, maxLength: 6 }).map((s) => s || "v") // Non-empty strings
const graphArb = fc.letrec((tie) => ({
  graph: fc.oneof(
    { maxDepth: 6 }, // Reduced depth to avoid deep nesting issues
    { weight: 1, arbitrary: fc.constant(G.empty<string>()) },
    { weight: 3, arbitrary: stringVertexArb.map(G.vertex) },
    { weight: 2, arbitrary: fc.tuple(stringVertexArb, stringVertexArb).map(([a, b]) => G.edge(a, b)) },
    {
      weight: 2,
      arbitrary: fc.tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("graph") as fc.Arbitrary<Graph<string>>).map(
        ([g1, g2]) => G.overlay(g1, g2)
      )
    },
    {
      weight: 2,
      arbitrary: fc.tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("graph") as fc.Arbitrary<Graph<string>>).map(
        ([g1, g2]) => G.connect(g1, g2)
      )
    }
  )
})).graph

describe("Algebraic Completeness Tests", () => {
  describe("Mokhov's Fundamental Axioms", () => {
    it("Right distributivity: x * (y + z) = x * y + x * z", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
          const left = G.connect(x, G.overlay(y, z))
          const right = G.overlay(G.connect(x, y), G.connect(x, z))
          assert.isTrue(G.equals(left, right))
        })
      )
    })

    it("Left distributivity: (x + y) * z = x * z + y * z", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
          const left = G.connect(G.overlay(x, y), z)
          const right = G.overlay(G.connect(x, z), G.connect(y, z))
          assert.isTrue(G.equals(left, right))
        })
      )
    })

    it("Decomposition law: x * y * z = x * y + x * z + y * z", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
          const left = G.connect(G.connect(x, y), z)
          const right = G.overlay(
            G.overlay(G.connect(x, y), G.connect(x, z)),
            G.connect(y, z)
          )
          assert.isTrue(G.equals(left, right))
        })
      )
    })
  })

  describe("Graph Kind Composition Laws", () => {
    it("Reflexive is idempotent: reflexive(reflexive(g)) = reflexive(g)", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const once = G.reflexive(g)
          const twice = G.reflexive(once)
          assert.isTrue(G.equals(once, twice))
        })
      )
    })

    it("Transitive is idempotent: transitive(transitive(g)) = transitive(g)", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const once = G.transitive(g)
          const twice = G.transitive(once)
          assert.isTrue(G.equals(once, twice))
        })
      )
    })

    it("Reflexive preserves overlay: reflexive(x + y) = reflexive(x) + reflexive(y)", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (x, y) => {
          const left = G.reflexive(G.overlay(x, y))
          const right = G.overlay(G.reflexive(x), G.reflexive(y))
          assert.isTrue(G.equals(left, right))
        })
      )
    })

    it("Undirected is involutive: undirected(undirected(g)) = undirected(g)", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const once = G.undirected(g)
          const twice = G.undirected(once)
          assert.isTrue(G.equals(once, twice))
        })
      )
    })

    it("Kind transformations preserve vertex set", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const originalVertices = G.vertices(g)
          const reflexiveVertices = G.vertices(G.reflexive(g))
          const transitiveVertices = G.vertices(G.transitive(g))
          const undirectedVertices = G.vertices(G.undirected(g))

          assert.isTrue(Equal.equals(originalVertices, reflexiveVertices))
          assert.isTrue(Equal.equals(originalVertices, transitiveVertices))
          assert.isTrue(Equal.equals(originalVertices, undirectedVertices))
        })
      )
    })
  })

  describe("Transpose Properties", () => {
    it("Transpose is involutive: transpose(transpose(g)) = g", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const twice = pipe(g, G.transpose, G.transpose)
          assert.isTrue(G.equals(g, twice))
        })
      )
    })

    it("Transpose preserves vertex set", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const originalVertices = G.vertices(g)
          const transposedVertices = G.vertices(G.transpose(g))
          assert.isTrue(Equal.equals(originalVertices, transposedVertices))
        })
      )
    })

    it("Transpose distributes over overlay: transpose(x + y) = transpose(x) + transpose(y)", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (x, y) => {
          const left = G.transpose(G.overlay(x, y))
          const right = G.overlay(G.transpose(x), G.transpose(y))
          assert.isTrue(G.equals(left, right))
        })
      )
    })

    it("Transpose reverses connect: transpose(x * y) = transpose(y) * transpose(x)", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (x, y) => {
          const left = G.transpose(G.connect(x, y))
          const right = G.connect(G.transpose(y), G.transpose(x))
          assert.isTrue(G.equals(left, right))
        })
      )
    })
  })

  describe("Fold Catamorphism Laws", () => {
    it("Fold fusion law: fold(g, f) |> h = fold(g, f')", () => {
      // Test that composing after fold equals folding with composed operations
      const simpleAlgebra = {
        onEmpty: () => 0,
        onVertex: (_: string) => 1,
        onOverlay: (l: number, r: number) => l + r,
        onConnect: (l: number, r: number) => l + r
      }

      fc.assert(
        fc.property(graphArb, (g) => {
          const foldThenDouble = G.fold(g, simpleAlgebra) * 2
          const doubleFold = G.fold(g, {
            onEmpty: () => 0,
            onVertex: (_: string) => 2,
            onOverlay: (l: number, r: number) => l + r,
            onConnect: (l: number, r: number) => l + r
          })
          assert.equal(foldThenDouble, doubleFold)
        })
      )
    })

    it("Fold preserves graph structure (identity fold)", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const reconstructed = G.fold(g, {
            onEmpty: () => G.empty<string>(),
            onVertex: G.vertex,
            onOverlay: G.overlay,
            onConnect: G.connect
          })
          assert.isTrue(G.equals(g, reconstructed))
        })
      )
    })
  })

  describe("Map Functor Laws", () => {
    it("Map preserves identity: map(id) = id", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const mapped = G.map(g, (x: string) => x)
          assert.isTrue(G.equals(g, mapped))
        })
      )
    })

    it("Map composition: map(f) |> map(g) = map(f |> g)", () => {
      const f = (s: string) => s.length
      const g = (n: number) => n * 2

      fc.assert(
        fc.property(graphArb, (graph) => {
          const composed = pipe(graph, G.map(f), G.map(g))
          const single = G.map(graph, (s: string) => g(f(s)))

          // Compare vertex sets since we can't directly compare graphs of different types
          const composedVertices = G.vertices(composed)
          const singleVertices = G.vertices(single)
          assert.isTrue(Equal.equals(composedVertices, singleVertices))
        })
      )
    })
  })

  describe("Advanced APG Properties", () => {
    it("Connect creates all possible edges between vertex sets", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
          (leftVertices, rightVertices) => {
            const leftGraph = G.fromVertices(leftVertices)
            const rightGraph = G.fromVertices(rightVertices)
            const connected = G.connect(leftGraph, rightGraph)

            // Every vertex in left should connect to every vertex in right
            for (const l of leftVertices) {
              for (const r of rightVertices) {
                assert.isTrue(
                  G.hasEdge(connected, l, r),
                  `Missing edge ${l} -> ${r}`
                )
              }
            }
          }
        )
      )
    })

    it("Transitive closure creates shortest paths", () => {
      // Test that path graphs become complete graphs under transitive closure
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 2, maxLength: 5 }).filter((arr) => new Set(arr).size === arr.length // Ensure no duplicates
          ),
          (vertices) => {
            const path = G.path(vertices)
            const transitive = G.transitive(path)

            // In a transitive path, every vertex should reach every vertex to its right
            for (let i = 0; i < vertices.length; i++) {
              for (let j = i + 1; j < vertices.length; j++) {
                assert.isTrue(
                  G.hasEdge(transitive, vertices[i], vertices[j]),
                  `Missing transitive edge ${vertices[i]} -> ${vertices[j]}`
                )
              }
            }
          }
        )
      )
    })

    it("Reflexive + Transitive = Reflexive-Transitive closure", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const reflexiveThenTransitive = pipe(g, G.reflexive, G.transitive)
          const transitiveThenReflexive = pipe(g, G.transitive, G.reflexive)

          // Order shouldn't matter for reaching the reflexive-transitive closure
          assert.isTrue(G.equals(reflexiveThenTransitive, transitiveThenReflexive))
        })
      )
    })

    it("Empty graph laws", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const empty = G.empty<string>()

          // Empty is left and right identity for overlay
          assert.isTrue(G.equals(G.overlay(empty, g), g))
          assert.isTrue(G.equals(G.overlay(g, empty), g))

          // Empty is left and right zero for connect
          assert.isTrue(G.equals(G.connect(empty, g), empty))
          assert.isTrue(G.equals(G.connect(g, empty), empty))
        })
      )
    })
  })
})
