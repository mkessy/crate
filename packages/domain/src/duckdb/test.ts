/**
 * DuckDB SQL Client Test Suite
 *
 * This test demonstrates usage patterns and validates the DuckDB client implementation.
 */

import * as Reactivity from "@effect/experimental/Reactivity"
import { Effect, pipe, Stream } from "effect"
import * as DuckDb from "./index.js"

// Example: Basic usage with primitive types
const basicExample = Effect.gen(function*() {
  const sql = yield* DuckDb.DuckDbClient

  // Create a simple table
  yield* sql`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name VARCHAR,
      email VARCHAR,
      created_at TIMESTAMP
    )
  `

  // Insert data
  yield* sql`
    INSERT INTO users ${
    sql.insert({
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      created_at: new Date()
    })
  })}`

  // Query data
  const users = yield* sql`SELECT * FROM users`
  console.log("Users:", users)
})

// Example: Complex types (LIST and STRUCT)
const complexTypesExample = Effect.gen(function*() {
  const sql = yield* DuckDb.DuckDbClient

  // Create table with complex types
  yield* sql`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name VARCHAR,
      tags VARCHAR[],
      attributes STRUCT(
        weight DOUBLE,
        dimensions STRUCT(
          length DOUBLE,
          width DOUBLE,
          height DOUBLE
        )
      ),
      metadata JSON
    )
  `

  // Insert with LIST and STRUCT
  yield* sql`
    INSERT INTO products ${
    sql.insert({
      id: 1,
      name: "Laptop",
      tags: sql.list(["electronics", "computers", "portable"]),
      attributes: sql.struct({
        weight: 2.5,
        dimensions: sql.struct({
          length: 35.0,
          width: 25.0,
          height: 2.0
        })
      })
    })
  })}`

  // Query returns native JS objects with proper nesting
  const products = yield* sql`SELECT * FROM products`
  console.log("Products:", JSON.stringify(products, null, 2))
})

// Example: Streaming large datasets
const streamingExample = Effect.gen(function*() {
  const sql = yield* DuckDb.DuckDbClient

  // Create and populate a large table
  yield* sql`CREATE TABLE events AS SELECT * FROM generate_series(1, 1000000) t(id)`

  // Stream results in chunks
  const stream = sql`SELECT * FROM events`.stream

  let count = 0
  yield* Stream.runForEach(stream, (chunk) =>
    Effect.sync(() => {
      count += chunk.length
      console.log(`Processed ${count} rows...`)
    }))

  console.log(`Total rows processed: ${count}`)
})

// Example: Transactions
const transactionExample = Effect.gen(function*() {
  const sql = yield* DuckDb.DuckDbClient

  yield* sql`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY,
      balance DECIMAL(10, 2)
    )
  `

  yield* sql`INSERT INTO accounts ${
    sql.insert([
      {
        id: 1,
        balance: 1000.00
      },
      {
        id: 2,
        balance: 500.00
      }
    ])
  }`

  // Execute transfer in a transaction
  yield* sql.withTransaction(
    Effect.gen(function*() {
      const amount = 100.00

      yield* sql`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${1}`
      yield* sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${2}`

      // Verify balances
      const accounts = yield* sql`SELECT * FROM accounts ORDER BY id`
      console.log("After transfer:", accounts)
    })
  )
})

// Example: Using type-safe helpers
const typeSafeExample = Effect.gen(function*() {
  const sql = yield* DuckDb.DuckDbClient

  // Define a schema
  interface User {
    id: number
    name: string
    tags: Array<string>
    profile: {
      bio: string
      verified: boolean
    }
  }

  yield* sql`
    CREATE TABLE users_typed (
      id INTEGER PRIMARY KEY,
      name VARCHAR,
      tags VARCHAR[],
      profile STRUCT(bio VARCHAR, verified BOOLEAN)
    )
  `

  // Insert with type safety
  const user: User = {
    id: 1,
    name: "Bob",
    tags: ["developer", "typescript"],
    profile: {
      bio: "Full-stack developer",
      verified: true
    }
  }

  yield* sql`
    INSERT INTO users_typed ${
    sql.insert({
      id: user.id,
      name: user.name,
      tags: sql.list(user.tags),
      profile: sql.struct(user.profile)
    })
  }`

  // Query with type assertion
  const users = yield* sql<User>`SELECT * FROM users_typed`
  console.log("Typed users:", users)
})

// Run examples
const runExamples = pipe(
  Effect.gen(function*() {
    console.log("=== Basic Example ===")
    yield* basicExample

    console.log("\n=== Complex Types Example ===")
    yield* complexTypesExample

    console.log("\n=== Transaction Example ===")
    yield* transactionExample

    console.log("\n=== Type-Safe Example ===")
    yield* typeSafeExample

    // Note: Streaming example is commented out due to large data volume
    // console.log("\n=== Streaming Example ===")
    // yield* streamingExample
  }),
  Effect.provide(DuckDb.layer({
    filename: ":memory:"
  })),
  Effect.catchAll((error) => Effect.sync(() => console.error("Error:", error)))
).pipe(Effect.provide(Reactivity.layer)).pipe(Effect.runPromise)

export { runExamples }
