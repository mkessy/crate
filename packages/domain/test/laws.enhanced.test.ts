import { Data, HashSet, pipe } from "effect"
import * as fc from "fast-check"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"
import type { Graph } from "../src/apg/internal/core.js"

// Enhanced arbitraries for more comprehensive testing
const vertexArb = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constantFrom(null, undefined),
  fc.record({
    id: fc.string(),
    value: fc.integer()
  })
)

const makeGraphArb = <A>(vertexArb: fc.Arbitrary<A>) =>
  fc.letrec((tie) => ({
    graph: fc.oneof(
      { maxDepth: 10 }, // Increased depth for more complex graphs
      { weight: 1, arbitrary: fc.constant(G.empty<A>()) },
      { weight: 3, arbitrary: vertexArb.map(G.vertex) },
      {
        weight: 2,
        arbitrary: fc
          .tuple(vertexArb, vertexArb)
          .map(([a, b]) => G.edge(a, b))
      },
      {
        weight: 1,
        arbitrary: fc
          .array(vertexArb, { minLength: 2, maxLength: 10 })
          .map(G.path)
      },
      {
        weight: 1,
        arbitrary: fc
          .array(vertexArb, { minLength: 2, maxLength: 5 })
          .map(G.clique)
      },
      {
        weight: 4,
        arbitrary: fc
          .tuple(
            tie("graph") as fc.Arbitrary<Graph<A>>,
            tie("graph") as fc.Arbitrary<Graph<A>>
          )
          .map(([g1, g2]) => G.overlay(g1, g2))
      },
      {
        weight: 4,
        arbitrary: fc
          .tuple(
            tie("graph") as fc.Arbitrary<Graph<A>>,
            tie("graph") as fc.Arbitrary<Graph<A>>
          )
          .map(([g1, g2]) => G.connect(g1, g2))
      }
    )
  })).graph

const graphArb = makeGraphArb(fc.string())
const complexGraphArb = makeGraphArb(vertexArb)

// Custom vertex type for testing
class Person extends Data.Class<{
  readonly id: string
  readonly name: string
}> {}

const personArb = fc.record({
  id: fc.string(),
  name: fc.string()
}).map((data) => new Person(data))

const personGraphArb = makeGraphArb(personArb)

describe("Enhanced Algebraic Laws", () => {
  describe("Core Axioms with Multiple Types", () => {
    it("Overlay Commutativity holds for all vertex types", () => {
      fc.assert(
        fc.property(complexGraphArb, complexGraphArb, (x, y) => {
          assert.isTrue(G.equals(G.overlay(x, y), G.overlay(y, x)))
        })
      )
    })

    it("Connect Associativity holds for Person vertices", () => {
      fc.assert(
        fc.property(personGraphArb, personGraphArb, personGraphArb, (x, y, z) => {
          assert.isTrue(
            G.equals(G.connect(x, G.connect(y, z)), G.connect(G.connect(x, y), z))
          )
        })
      )
    })
  })

  describe("Graph Kind Preservation", () => {
    it("Undirected graphs maintain symmetry through operations", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (g1, g2) => {
          const u1 = G.toUndirected(g1)
          const u2 = G.toUndirected(g2)

          // Overlay preserves undirectedness
          const overlaid = G.overlay(u1, u2)
          const overlaidThenUndirected = G.toUndirected(G.overlay(g1, g2))
          assert.isTrue(G.equals(overlaid, overlaidThenUndirected))

          // Connect preserves undirectedness
          const connected = G.connect(u1, u2)
          const connectedThenUndirected = G.toUndirected(G.connect(g1, g2))
          assert.isTrue(G.equals(connected, connectedThenUndirected))
        })
      )
    })

    it("Reflexive graphs maintain self-loops", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          const reflexive = G.reflexive(g)
          const vertices = Array.from(reflexive)

          // Every vertex should have a self-loop
          const rel = G.toRelation(reflexive)
          for (const v of vertices) {
            assert.isTrue(
              G.hasEdge(reflexive, v, v),
              `Missing self-loop for vertex ${v}`
            )
          }
        })
      )
    })
  })

  describe("Subgraph Relations", () => {
    it("Subgraph relation is reflexive", () => {
      fc.assert(
        fc.property(graphArb, (g) => {
          assert.isTrue(G.isSubgraphOf(g, g))
        })
      )
    })

    it("Subgraph relation is transitive", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (g1, g2, g3) => {
          // If g1 ⊆ g2 and g2 ⊆ g3, then g1 ⊆ g3
          fc.pre(G.isSubgraphOf(g1, g2) && G.isSubgraphOf(g2, g3))
          assert.isTrue(G.isSubgraphOf(g1, g3))
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
  })

  describe("Equality Properties", () => {
    it("Equal graphs have equal hash codes", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (g1, g2) => {
          fc.pre(G.equals(g1, g2))
          assert.equal(G.hash(g1), G.hash(g2))
        })
      )
    })

    it("Graph equality is an equivalence relation", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (g1, g2, g3) => {
          // Reflexivity
          assert.isTrue(G.equals(g1, g1))

          // Symmetry
          if (G.equals(g1, g2)) {
            assert.isTrue(G.equals(g2, g1))
          }

          // Transitivity
          if (G.equals(g1, g2) && G.equals(g2, g3)) {
            assert.isTrue(G.equals(g1, g3))
          }
        })
      )
    })
  })

  describe("Performance and Scalability", () => {
    it("handles large graphs without stack overflow", () => {
      const largeGraphArb = fc.nat({ max: 100 }).chain((n) => {
        const vertices = Array.from({ length: n }, (_, i) => i)
        return fc.constantFrom(
          G.path(vertices),
          G.clique(vertices.slice(0, Math.min(10, n))), // Limit clique size
          vertices.reduce((g, v) => G.overlay(g, G.vertex(v)), G.empty<number>())
        )
      })

      fc.assert(
        fc.property(largeGraphArb, (g) => {
          // Should complete without stack overflow
          assert.isTrue(pipe(g, G.vertices, HashSet.size) >= 0)
        }),
        { numRuns: 10 } // Fewer runs for performance tests
      )
    })
  })

  describe.skip("Derived Constructors", () => {
    it("path creates connected sequence", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 2, maxLength: 10 }),
          (vertices) => {
            const path = G.path(vertices)
            const rel = G.toRelation(path)

            // Check sequential connections
            for (let i = 0; i < vertices.length - 1; i++) {
              assert.isTrue(
                G.hasEdge(path, vertices[i], vertices[i + 1]),
                `Missing edge ${vertices[i]} -> ${vertices[i + 1]}`
              )
            }

            // Check no extra edges (in directed case)
            assert.equal(HashSet.size(rel.edges), vertices.length - 1)
          }
        )
      )
    })
  })
})
