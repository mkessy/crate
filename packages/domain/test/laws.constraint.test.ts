import { Data, Order } from "effect"
import * as fc from "fast-check"
import { assert, describe, it } from "vitest"
import * as G from "../src/apg/Graph.js"
import type { Graph } from "../src/apg/Graph.js"

// Vertex types with different constraint requirements
class Person extends Data.Class<{
  readonly id: string
  readonly name: string
  readonly age: number
}> {}

class Coord extends Data.Class<{
  readonly x: number
  readonly y: number
}> {
  static Order: Order.Order<Coord> = Order.make((a, b) => {
    const xComp = Order.number(a.x, b.x)
    return xComp !== 0 ? xComp : Order.number(a.y, b.y)
  })
}

// String graph with minimum characteristics to avoid edge cases
const distinctStringArb = fc.string({ minLength: 1, maxLength: 8 }).map((s) => s || "a") // Ensure non-empty
const graphArb = fc.letrec((tie) => ({
  graph: fc.oneof(
    { maxDepth: 4 },
    { weight: 1, arbitrary: fc.constant(G.empty<string>()) },
    { weight: 2, arbitrary: distinctStringArb.map(G.vertex) },
    {
      weight: 2,
      arbitrary: fc
        .tuple(distinctStringArb, distinctStringArb)
        .map(([from, to]) => G.edge(from, to))
    },
    {
      weight: 3,
      arbitrary: fc
        .tuple(tie("graph") as fc.Arbitrary<Graph<string>>, tie("graph") as fc.Arbitrary<Graph<string>>)
        .map(([g1, g2]) => G.overlay(g1, g2))
    }
  )
})).graph

describe("Constraint-Based Graph Laws", () => {
  describe("Data.Class Vertices with Built-in Equal/Hash", () => {
    it("Person graphs respect Equal trait", () => {
      const p1 = new Person({ id: "1", name: "Alice", age: 30 })
      const p2 = new Person({ id: "1", name: "Alice", age: 30 })
      const p3 = new Person({ id: "2", name: "Bob", age: 25 })

      const g1 = G.vertex(p1)
      const g2 = G.vertex(p2) // Same data as p1
      const g3 = G.vertex(p3) // Different data

      // Equal vertices produce equal graphs
      assert.isTrue(G.equals(g1, g2))
      assert.isFalse(G.equals(g1, g3))

      // Overlay with equal vertices is idempotent
      assert.isTrue(G.equals(G.overlay(g1, g2), g1))
      assert.isFalse(G.equals(G.overlay(g1, g3), g1))
    })

    it("Coord graphs with custom Order work correctly", () => {
      const c1 = new Coord({ x: 1, y: 2 })
      const c2 = new Coord({ x: 1, y: 2 }) // Same coordinates
      const c3 = new Coord({ x: 2, y: 1 }) // Different coordinates

      const g1 = G.vertex(c1)
      const g2 = G.vertex(c2)
      const g3 = G.vertex(c3)

      // Equal coordinates produce equal graphs
      assert.isTrue(G.equals(g1, g2))
      assert.isFalse(G.equals(g1, g3))

      // Can create valid edges between coordinates
      const edge = G.edge(c1, c3)
      assert.isTrue(G.hasEdge(edge, c1, c3))
    })
  })

  describe("Core Algebraic Laws with Mixed Types", () => {
    it("Overlay Commutativity with strings", () => {
      fc.assert(
        fc.property(graphArb, graphArb, (x, y) => {
          assert.isTrue(G.equals(G.overlay(x, y), G.overlay(y, x)))
        })
      )
    })

    it("Overlay Identity with custom types", () => {
      const person = new Person({ id: "test", name: "Test", age: 25 })
      const g = G.vertex(person)

      assert.isTrue(G.equals(G.overlay(g, G.empty()), g))
      assert.isTrue(G.equals(G.overlay(G.empty(), g), g))
    })

    it("Connect preserves vertex equality", () => {
      const p1 = new Person({ id: "1", name: "Alice", age: 30 })
      const p2 = new Person({ id: "2", name: "Bob", age: 25 })

      const edge1 = G.edge(p1, p2)
      const edge2 = G.connect(G.vertex(p1), G.vertex(p2))

      assert.isTrue(G.equals(edge1, edge2))
    })
  })

  describe("Coordinate Graph with Order Constraint", () => {
    it("Coordinates can be sorted using custom Order", () => {
      const points = [
        new Coord({ x: 3, y: 1 }),
        new Coord({ x: 1, y: 2 }),
        new Coord({ x: 2, y: 3 })
      ]

      const sorted = points.sort((a, b) => Coord.Order(a, b))

      // Should be sorted by x, then y
      assert.equal(sorted[0].x, 1)
      assert.equal(sorted[1].x, 2)
      assert.equal(sorted[2].x, 3)
    })

    it("Graph operations work with ordered coordinates", () => {
      const c1 = new Coord({ x: 0, y: 0 })
      const c2 = new Coord({ x: 1, y: 1 })
      const c3 = new Coord({ x: 2, y: 2 })

      const path = G.path([c1, c2, c3])
      const vertices = Array.from(path)

      assert.isTrue(vertices.includes(c1))
      assert.isTrue(vertices.includes(c2))
      assert.isTrue(vertices.includes(c3))
      assert.equal(vertices.length, 3)
    })
  })

  describe("Essential Algebraic Laws (Reduced Set)", () => {
    it("Right Distributivity with string graphs", () => {
      fc.assert(
        fc.property(graphArb, graphArb, graphArb, (x, y, z) => {
          const lhs = G.connect(x, G.overlay(y, z))
          const rhs = G.overlay(G.connect(x, y), G.connect(x, z))
          assert.isTrue(G.equals(lhs, rhs))
        })
      )
    })

    it("Empty is identity for overlay", () => {
      fc.assert(
        fc.property(graphArb, (x) => {
          assert.isTrue(G.equals(G.overlay(x, G.empty()), x))
          assert.isTrue(G.equals(G.overlay(G.empty(), x), x))
        })
      )
    })
  })

  describe("Graph Kind Type Guards & Equivalences", () => {
    it("isDirected works with different vertex types", () => {
      const personGraph = G.vertex(new Person({ id: "1", name: "Alice", age: 30 }))
      const coordGraph = G.vertex(new Coord({ x: 1, y: 2 }))
      const stringGraph = G.vertex("test")

      assert.isTrue(G.isDirected(personGraph))
      assert.isTrue(G.isDirected(coordGraph))
      assert.isTrue(G.isDirected(stringGraph))
    })

    it("GraphKindEquivalence respects string equality", () => {
      assert.isTrue(G.GraphKindEquivalences.Directed("directed", "directed"))
      assert.isTrue(G.GraphKindEquivalences.Undirected("undirected", "undirected"))
      assert.isFalse(G.GraphKindEquivalences.Directed("directed", "undirected"))
      assert.isFalse(G.GraphKindEquivalences.Reflexive("reflexive", "transitive"))
    })

    it("GraphKindCompatibilityEquivalence allows mixed directed/undirected", () => {
      // Same kinds are compatible
      assert.isTrue(G.GraphKindEquivalences.Compatibility("directed", "directed"))
      assert.isTrue(G.GraphKindEquivalences.Compatibility("undirected", "undirected"))

      // Mixed directed/undirected is compatible
      assert.isTrue(G.GraphKindEquivalences.Compatibility("directed", "undirected"))
      assert.isTrue(G.GraphKindEquivalences.Compatibility("undirected", "directed"))

      // Other combinations may not be compatible
      assert.isFalse(G.GraphKindEquivalences.Compatibility("directed", "reflexive"))
      assert.isFalse(G.GraphKindEquivalences.Compatibility("reflexive", "transitive"))
    })

    it("areKindsCompatible uses derived equivalence", () => {
      const directedGraph = G.vertex("a")
      const undirectedGraph = G.undirected(G.vertex("b"))
      const reflexiveGraph = G.reflexive(G.vertex("c"))

      // Same kinds
      assert.isTrue(G.areKindsCompatible(directedGraph, directedGraph))

      // Mixed directed/undirected
      // @ts-expect-error
      assert.isFalse(G.GraphKindEquivalences.Compatibility(directedGraph, undirectedGraph))
      // @ts-expect-error
      assert.isFalse(G.GraphKindEquivalences.Compatibility(undirectedGraph, directedGraph))

      // Incompatible kinds
      // @ts-expect-error
      assert.isFalse(G.GraphKindEquivalences.Compatibility(directedGraph, reflexiveGraph))
    })

    it("undirected transformation preserves vertex equality", () => {
      const p1 = new Person({ id: "1", name: "Alice", age: 30 })
      const p2 = new Person({ id: "1", name: "Alice", age: 30 })

      const directed = G.edge(p1, p2)
      const undirected = G.undirected(directed)

      assert.isTrue(G.isUndirected(undirected))
      // Both directions should exist in undirected graph
      assert.isTrue(G.hasEdge(undirected, p1, p2))
      assert.isTrue(G.hasEdge(undirected, p2, p1))
    })
  })
})
