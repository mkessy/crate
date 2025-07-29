import { assert, describe, it } from "@effect/vitest"
import { Schema } from "effect"
import { APGBuilder, type GetEdgeLabels, type GetVertexLabels } from "../src/apg/index.js"

describe("APG Library", () => {
  // Define a reusable APG API for testing
  const testApg = APGBuilder.make()
    .addVertex(
      "Person",
      Schema.Struct({
        name: Schema.String,
        age: Schema.Number
      })
    )
    .addVertex(
      "Company",
      Schema.Struct({
        name: Schema.String,
        employees: Schema.Number
      })
    )
    .addEdge(
      "WorksFor",
      Schema.Struct({
        since: Schema.Number,
        role: Schema.String
      }),
      "Person",
      "Company"
    )
    .build()

  it("should build a valid APG API", () => {
    assert.isDefined(testApg)
    assert.isDefined(testApg.vertices.Person)
    assert.isDefined(testApg.vertices.Company)
    assert.isDefined(testApg.edges.WorksFor)
    assert.isDefined(testApg.graph)
  })

  it("should create type-safe vertices and edges", () => {
    const person = testApg.vertices.Person({ name: "Alice", age: 30 })
    const company = testApg.vertices.Company({ name: "Acme Corp", employees: 100 })
    const worksFor = testApg.edges.WorksFor({ since: 2020, role: "Engineer" })

    assert.strictEqual(person.label, "Person")
    assert.strictEqual(person.value.name, "Alice")

    assert.strictEqual(company.label, "Company")
    assert.strictEqual(company.value.employees, 100)

    assert.strictEqual(worksFor.label, "WorksFor")
    assert.strictEqual(worksFor.value.role, "Engineer")
    assert.strictEqual(worksFor.from, "Person")
    assert.strictEqual(worksFor.to, "Company")
  })

  it("should create a valid graph with connect", () => {
    const person = testApg.vertices.Person({ name: "Alice", age: 30 })
    const company = testApg.vertices.Company({ name: "Acme Corp", employees: 100 })
    const worksFor = testApg.edges.WorksFor({ since: 2020, role: "Engineer" })

    const graph = testApg.connect(
      testApg.vertex(person),
      testApg.vertex(company),
      worksFor
    )

    assert.strictEqual(graph._tag, "Connect")
    if (graph._tag === "Connect") {
      assert.strictEqual(graph.edge.label, "WorksFor")
    }
  })

  it("should combine graphs with overlay", () => {
    const person = testApg.vertices.Person({ name: "Alice", age: 30 })
    const company = testApg.vertices.Company({ name: "Acme Corp", employees: 100 })

    const graph1 = testApg.vertex(person)
    const graph2 = testApg.vertex(company)

    const overlayGraph = testApg.overlay(graph1, graph2)

    assert.strictEqual(overlayGraph._tag, "Overlay")
    if (overlayGraph._tag === "Overlay") {
      assert.isDefined(overlayGraph.left)
      assert.isDefined(overlayGraph.right)
    }
  })

  it("should extract vertex and edge labels from a graph type", () => {
    const person = testApg.vertices.Person({ name: "Alice", age: 30 })
    const company = testApg.vertices.Company({ name: "Acme Corp", employees: 100 })
    const worksFor = testApg.edges.WorksFor({ since: 2020, role: "Engineer" })

    const _graph = testApg.connect(
      testApg.vertex(person),
      testApg.vertex(company),
      worksFor
    )

    type VertexLabels = GetVertexLabels<typeof _graph>
    type EdgeLabels = GetEdgeLabels<typeof _graph>

    // These assertions are at the type level, but we can assert something at runtime to make the test valid
    const assertVertexLabels = (label: VertexLabels) => assert.isTrue(["Person", "Company"].includes(label))
    const assertEdgeLabels = (label: EdgeLabels) => assert.isTrue(["WorksFor"].includes(label))

    // @ts-expect-error - This is a test
    assertVertexLabels("Person")
    // @ts-expect-error - This is a test
    assertVertexLabels("Company")
    // @ts-expect-error - This is a test
    assertEdgeLabels("WorksFor")
  })
})
