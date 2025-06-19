import * as Reactivity from "@effect/experimental/Reactivity"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as DuckDbClient from "./DuckDbClient.js"

// Create a test client
const testClient = DuckDbClient.layer({
  database: ":memory:"
}).pipe(Layer.provide(Reactivity.layer))

// Minimal test to verify template literal works
const program = Effect.gen(function*() {
  const sql = yield* DuckDbClient.DuckDbClient

  // Test that sql is a function (template literal)
  console.log("Is sql a function?", typeof sql === "function")

  // Test basic query
  yield* sql`CREATE TABLE test (id INTEGER, name VARCHAR)`
  yield* sql`INSERT INTO test VALUES (1, 'test')`
  const results = yield* sql`SELECT * FROM test`

  console.log("Results:", results)

  // Test array functionality
  yield* sql`CREATE TABLE array_test (id INTEGER, data INTEGER[])`
  yield* sql`INSERT INTO array_test VALUES (1, ${sql.duckdbHelpers.array([1, 2, 3])})`
  const arrayResults = yield* sql`SELECT * FROM array_test`

  console.log("Array results:", arrayResults)
  console.log("Is data an array?", Array.isArray(arrayResults[0].data))
})

program.pipe(
  Effect.provide(testClient),
  Effect.runPromise
).then(
  () => console.log("✅ Test passed"),
  (error) => console.error("❌ Test failed:", error)
)
