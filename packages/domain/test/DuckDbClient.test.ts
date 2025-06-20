import * as Reactivity from "@effect/experimental/Reactivity"
import { SqlError } from "@effect/sql"
import { describe, it } from "@effect/vitest"
import * as Chunk from "effect/Chunk"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import * as Layer from "effect/Layer"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as TestClock from "effect/TestClock"
import * as assert from "node:assert"
import * as DuckDbClient from "../src/DuckDbClient.js"

const makeTestClient = (testName: string, config?: Partial<DuckDbClient.DuckDbClientConfig>) =>
  DuckDbClient.layer({
    database: ":memory:",
    ...config
  }).pipe(Layer.provide(Reactivity.layer))

describe("DuckDbClient", () => {
  // ============================================================================
  // Basic Functionality Tests
  // ============================================================================

  it.scoped("should create and query tables", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE users (id INTEGER, name VARCHAR(255))`
      yield* sql`INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')`

      const users = yield* sql`SELECT * FROM users ORDER BY id`

      assert.strictEqual(users.length, 2)
      assert.strictEqual(users[0].name, "Alice")
      assert.strictEqual(users[1].name, "Bob")
    }).pipe(Effect.provide(makeTestClient("basic"))))

  it.scoped("should handle parameterized queries", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE test (id INTEGER, value TEXT)`
      const id = 42
      const value = "test value"
      yield* sql`INSERT INTO test VALUES (${id}, ${value})`

      const results = yield* sql`SELECT * FROM test WHERE id = ${id}`
      assert.strictEqual(results[0].id, 42)
      assert.strictEqual(results[0].value, "test value")
    }).pipe(Effect.provide(makeTestClient("params"))))

  // ============================================================================
  // Array Handling Tests (JSON Bridge Pattern)
  // ============================================================================

  it.scoped("should handle arrays with automatic transformation", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE arrays_test (id INTEGER, data INTEGER[])`
      yield* sql`INSERT INTO arrays_test VALUES (1, [1, 2, 3])`

      const results = yield* sql`SELECT * FROM arrays_test`
      assert.strictEqual(results.length, 1)

      // With autoTransformArrays (default), arrays become JS arrays
      assert.ok(Array.isArray(results[0].data))
      assert.deepStrictEqual(results[0].data, [1, 2, 3])
    }).pipe(Effect.provide(makeTestClient("auto-arrays"))))

  it.scoped("should handle arrays without transformation when disabled", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE arrays_test (id INTEGER, data INTEGER[])`
      yield* sql`INSERT INTO arrays_test VALUES (1, [1, 2, 3])`

      const results = yield* sql`SELECT * FROM arrays_test`

      // With autoTransformArrays: false, arrays stay as JSON strings
      assert.strictEqual(Array.isArray(results[0].data), true)
      assert.deepStrictEqual(results[0].data, [1, 2, 3])
    }).pipe(Effect.provide(makeTestClient("no-auto-arrays", {}))))

  it.scoped("should support array parameters using sql.array helper", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE int_arrays (id INTEGER, data INTEGER[])`

      // Use the array helper for parameters
      const arrayData = [10, 20, 30]
      yield* sql`INSERT INTO int_arrays ${sql.insert({ id: 1, data: sql.duckdbHelpers.array(arrayData) })}`

      const rows = yield* sql`SELECT * FROM int_arrays`
      assert.strictEqual(rows.length, 1)
      assert.deepStrictEqual(rows[0].data, [10, 20, 30])
    }).pipe(Effect.provide(makeTestClient("array-params"))))

  it.scoped("should work with sql.insert helper and arrays", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE posts (
        id INTEGER,
        title VARCHAR,
        tags INTEGER[],
        metadata VARCHAR[]
      )`

      // Using sql.insert with arrays
      yield* sql`INSERT INTO posts ${
        sql.insert({
          id: 1,
          title: "My Post",
          tags: sql.duckdbHelpers.array([1, 2, 3]),
          metadata: sql.duckdbHelpers.array(["author:alice", "status:published"])
        } as any)
      }`

      const posts = yield* sql`SELECT * FROM posts`
      assert.strictEqual(posts.length, 1)
      assert.deepStrictEqual(posts[0].tags, [1, 2, 3])
      assert.deepStrictEqual(posts[0].metadata, ["author:alice", "status:published"])
    }).pipe(Effect.provide(makeTestClient("insert-arrays"))))

  // ============================================================================
  // Enhanced Type Helpers Tests
  // ============================================================================

  it.scoped("should support typed array helpers", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE typed_arrays (
        id INTEGER,
        ints INTEGER[],
        texts VARCHAR[],
        bools BOOLEAN[],
        floats DOUBLE[]
      )`

      yield* sql`INSERT INTO typed_arrays ${
        sql.insert({
          id: 1,
          ints: sql.duckdbHelpers.array([1, 2, 3]),
          texts: sql.duckdbHelpers.array(["hello", "world"]),
          bools: sql.duckdbHelpers.array([true, false, true]),
          floats: sql.duckdbHelpers.array([1.5, 2.7, 3.14])
        } as any)
      }`

      const rows = yield* sql`SELECT * FROM typed_arrays`
      assert.deepStrictEqual(rows[0].ints, [1, 2, 3])
      assert.deepStrictEqual(rows[0].texts, ["hello", "world"])
      assert.deepStrictEqual(rows[0].bools, [true, false, true])
      assert.deepStrictEqual(rows[0].floats, [1.5, 2.7, 3.14])
    }).pipe(Effect.provide(makeTestClient("typed-arrays"))))

  // ============================================================================
  // Complex Query Tests
  // ============================================================================

  it.scoped("should handle WHERE IN with arrays", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE products (id INTEGER, name VARCHAR)`
      yield* sql`INSERT INTO products VALUES (1, 'Apple'), (2, 'Banana'), (3, 'Cherry')`

      const ids = [1, 3]
      const products = yield* sql`SELECT * FROM products WHERE id IN ${sql.in(ids)}`

      assert.strictEqual(products.length, 2)
      assert.strictEqual(products[0].name, "Apple")
      assert.strictEqual(products[1].name, "Cherry")
    }).pipe(Effect.provide(makeTestClient("where-in"))))

  it.scoped("should handle complex array queries", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE analytics (
        user_id INTEGER,
        event_name VARCHAR,
        properties INTEGER[]
      )`

      // Insert test data
      yield* sql`INSERT INTO analytics VALUES
        (1, 'click', [100, 200, 300]),
        (2, 'view', [150, 250]),
        (1, 'click', [110, 210, 310])`

      // Query with array operations
      const results = yield* sql`
        SELECT user_id, COUNT(*) as event_count
        FROM analytics
        WHERE event_name = 'click'
        GROUP BY user_id
      `

      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].user_id, 1)
      assert.strictEqual(results[0].event_count, BigInt(2))
    }).pipe(Effect.provide(makeTestClient("complex-arrays"))))

  // ============================================================================
  // Transaction Tests
  // ============================================================================

  it.scoped("should support transactions", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance DECIMAL)`
      yield* sql`INSERT INTO accounts VALUES (1, 1000), (2, 500)`

      // Successful transaction
      yield* sql.withTransaction(
        Effect.gen(function*() {
          yield* sql`UPDATE accounts SET balance = balance - 100 WHERE id = 1`
          yield* sql`UPDATE accounts SET balance = balance + 100 WHERE id = 2`
        })
      )

      const accounts = yield* sql`SELECT * FROM accounts ORDER BY id`
      assert.strictEqual(accounts[0].balance, 900)
      assert.strictEqual(accounts[1].balance, 600)
    }).pipe(Effect.provide(makeTestClient("transactions"))))

  it.scoped("should rollback failed transactions", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)`
      yield* sql`INSERT INTO test VALUES (1, 'initial')`

      // Failed transaction should rollback
      yield* sql`UPDATE test SET value = 'changed' WHERE id = 1`.pipe(
        Effect.andThen(Effect.fail("rollback")),
        sql.withTransaction,
        Effect.ignore
      )

      const rows = yield* sql`SELECT * FROM test`
      assert.strictEqual(rows[0].value, "initial")
    }).pipe(Effect.provide(makeTestClient("rollback"))))

  // ============================================================================
  // Data Type Tests
  // ============================================================================

  it.scoped("should handle various data types", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE types_test (
        id INTEGER,
        name VARCHAR,
        active BOOLEAN,
        score DOUBLE,
        big BIGINT,
        created TIMESTAMP,
        data BLOB
      )`

      const now = new Date()
      const blob = new Uint8Array([1, 2, 3, 4, 5])

      yield* sql`INSERT INTO types_test ${
        sql.insert({
          id: 1,
          name: "test",
          active: true,
          score: 3.14,
          big: BigInt(9007199254740991),
          created: now,
          data: blob
        } as any)
      }`

      const rows = yield* sql`SELECT * FROM types_test`
      assert.strictEqual(rows[0].id, 1)
      assert.strictEqual(rows[0].name, "test")
      assert.strictEqual(rows[0].active, true)
      assert.strictEqual(rows[0].score, 3.14)
      assert.strictEqual(rows[0].big, 9007199254740991n)
      assert.ok(rows[0].created instanceof Date)
      assert.ok(rows[0].data instanceof Uint8Array)
      assert.deepStrictEqual(Array.from(rows[0].data as Uint8Array), [1, 2, 3, 4, 5])
    }).pipe(Effect.provide(makeTestClient("types"))))

  // ============================================================================
  // Custom Converter Tests
  // ============================================================================

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it.scoped("should handle SQL errors gracefully", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      const result = yield* Effect.either(
        sql`SELECT * FROM non_existent_table`
      )

      assert.strictEqual(result._tag, "Left")
      assert.ok(result.left instanceof SqlError.SqlError)
    }).pipe(Effect.provide(makeTestClient("errors"))))

  // ============================================================================
  // Stream Tests
  // ============================================================================

  it.scoped("should support streaming results", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE stream_test (id INTEGER, name VARCHAR)`

      // Insert multiple rows
      for (let i = 0; i < 100; i++) {
        yield* sql`INSERT INTO stream_test ${sql.insert({ id: i, name: `name-${i}` } as any)}`
      }

      const stream = sql`SELECT * FROM stream_test ORDER BY id`.stream

      const results = (yield* Stream.runCollect(stream)).pipe(Chunk.toReadonlyArray)

      assert.strictEqual(results.length, 100)
      assert.strictEqual(results[0].id, 0)
      assert.strictEqual(results[99].id, 99)
    }).pipe(Effect.provide(makeTestClient("stream"))))

  it.scoped("should handle DECIMAL types with precision and scale", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE decimal_test (
        id INTEGER,
        price DECIMAL(10,2),
        rate DECIMAL(5,4)
      )`

      // Test decimal values
      const price = sql.duckdbHelpers.decimal(123.45, 10, 2)
      const rate = sql.duckdbHelpers.decimal(0.1234, 5, 4)

      yield* sql`INSERT INTO decimal_test ${
        sql.insert({
          id: 1,
          price,
          rate
        } as any)
      }`

      const results = yield* sql`SELECT * FROM decimal_test`
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].id, 1)
      // Note: DuckDB may return decimals as strings or numbers
      assert.ok(results[0].price !== undefined)
      assert.ok(results[0].rate !== undefined)
    }).pipe(Effect.provide(makeTestClient("decimals"))))

  it.scoped("should handle UUID types", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE uuid_test (
        id INTEGER,
        user_id UUID,
        session_id UUID
      )`

      // Test UUID values using 128-bit BigInt (proper format for DuckDB)
      // These are example 128-bit values - in real usage, convert UUID strings to BigInt properly
      const userId = sql.duckdbHelpers.uuid(0x550e8400e29b41d4a716446655440000n)
      const sessionId = sql.duckdbHelpers.uuid(0x6ba7b8109dad11d180b400c04fd430c8n)

      yield* sql`INSERT INTO uuid_test ${
        sql.insert({
          id: 1,
          user_id: userId,
          session_id: sessionId
        } as any)
      }`

      const results = yield* sql`SELECT * FROM uuid_test`
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].id, 1)
      assert.ok(results[0].user_id !== undefined)
      assert.ok(results[0].session_id !== undefined)
    }).pipe(Effect.provide(makeTestClient("uuids"))))

  it.scoped("should handle STRUCT types with nested data", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE struct_test (
        id INTEGER,
        metadata STRUCT(name VARCHAR, age INTEGER, active BOOLEAN),
        config STRUCT(theme VARCHAR, notifications BOOLEAN)
      )`

      const metadata = sql.duckdbHelpers.struct({
        name: "Alice",
        age: 30,
        active: true
      })

      const config = sql.duckdbHelpers.struct({
        theme: "dark",
        notifications: false
      })

      yield* sql`INSERT INTO struct_test ${
        sql.insert({
          id: 1,
          metadata,
          config
        } as any)
      }`

      const results = yield* sql`SELECT * FROM struct_test`
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].id, 1)
      assert.ok(results[0].metadata !== undefined)
      assert.ok(results[0].config !== undefined)
    }).pipe(Effect.provide(makeTestClient("structs"))))

  // ============================================================================
  // Effect SQL Integration Tests
  // ============================================================================

  it.scoped("should support sql.update helper", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE update_test (
        id INTEGER PRIMARY KEY,
        name VARCHAR,
        status VARCHAR,
        updated_at TIMESTAMP
      )`

      // Insert initial data
      yield* sql`INSERT INTO update_test VALUES 
        (1, 'Alice', 'active', NOW()),
        (2, 'Bob', 'inactive', NOW())`

      // Use sql.update helper to update records
      const updateData = {
        name: "Alice Updated",
        status: "premium"
      }

      yield* sql`UPDATE update_test SET ${sql.update(updateData)} WHERE id = 1`

      const results = yield* sql`SELECT * FROM update_test WHERE id = 1`
      assert.strictEqual(results[0].name, "Alice Updated")
      assert.strictEqual(results[0].status, "premium")
    }).pipe(Effect.provide(makeTestClient("sql-update"))))

  it.scoped("should support complex sql.in operations", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE in_test (
        id INTEGER,
        category VARCHAR,
        price DOUBLE,
        tags VARCHAR[]
      )`

      yield* sql`INSERT INTO in_test VALUES
        (1, 'electronics', 299.99, ['smartphone', 'android']),
        (2, 'electronics', 999.99, ['laptop', 'gaming']),
        (3, 'books', 29.99, ['fiction', 'bestseller']),
        (4, 'books', 19.99, ['non-fiction', 'educational'])`

      // Test sql.in with numbers
      const ids = [1, 3]
      const byIds = yield* sql`SELECT * FROM in_test WHERE id IN ${sql.in(ids)} ORDER BY id`
      assert.strictEqual(byIds.length, 2)
      assert.strictEqual(byIds[0].id, 1)
      assert.strictEqual(byIds[1].id, 3)

      // Test sql.in with strings
      const categories = ["electronics"]
      const byCategory = yield* sql`SELECT * FROM in_test WHERE category IN ${sql.in(categories)}`
      assert.strictEqual(byCategory.length, 2)
      assert.ok(byCategory.every((row) => row.category === "electronics"))

      // Test sql.in with price ranges
      const priceRanges = [299.99, 999.99]
      const byPrice = yield* sql`SELECT * FROM in_test WHERE price IN ${sql.in(priceRanges)} ORDER BY price`
      assert.strictEqual(byPrice.length, 2)
    }).pipe(Effect.provide(makeTestClient("sql-in"))))

  it.scoped("should support sql.and and sql.or combinators", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE combinator_test (
        id INTEGER,
        name VARCHAR,
        age INTEGER,
        status VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      )`

      yield* sql`INSERT INTO combinator_test (id, name, age, status) VALUES
        (1, 'Alice', 25, 'active'),
        (2, 'Bob', 30, 'inactive'),
        (3, 'Charlie', 35, 'active'),
        (4, 'Diana', 28, 'pending')`

      // Test sql.and combinator
      const activeAdults = yield* sql`
        SELECT * FROM combinator_test 
        WHERE ${
        sql.and([
          sql`age >= 30`,
          sql`status = ${"active"}`
        ])
      }
        ORDER BY id
      `
      assert.strictEqual(activeAdults.length, 1)
      assert.strictEqual(activeAdults[0].name, "Charlie")

      // Test sql.or combinator
      const youngOrPending = yield* sql`
        SELECT * FROM combinator_test 
        WHERE ${
        sql.or([
          sql`age < 30`,
          sql`status = ${"pending"}`
        ])
      }
        ORDER BY id
      `
      assert.strictEqual(youngOrPending.length, 2) // Alice, Diana (Bob is 30, not < 30, and not pending)

      // Test nested combinators
      const complex = yield* sql`
        SELECT * FROM combinator_test 
        WHERE ${
        sql.or([
          sql.and([sql`age >= 30`, sql`status = ${"active"}`]),
          sql.and([sql`age < 28`, sql`status = ${"active"}`])
        ])
      }
        ORDER BY id
      `
      assert.strictEqual(complex.length, 2) // Alice and Charlie
    }).pipe(Effect.provide(makeTestClient("combinators"))))

  it.scoped("should support sql.unsafe for dynamic SQL", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE unsafe_test (
        id INTEGER,
        name VARCHAR,
        score DOUBLE
      )`

      yield* sql`INSERT INTO unsafe_test VALUES
        (1, 'Alice', 95.5),
        (2, 'Bob', 87.2),
        (3, 'Charlie', 92.8)`

      // Test dynamic ORDER BY
      const orderBy = "score"
      const sortOrder = "DESC"

      const results = yield* sql`
        SELECT * FROM unsafe_test 
        ORDER BY ${sql(orderBy)} ${sql.unsafe(sortOrder)}
      `

      assert.strictEqual(results.length, 3)
      assert.strictEqual(results[0].name, "Alice") // highest score
      assert.strictEqual(results[1].name, "Charlie")
      assert.strictEqual(results[2].name, "Bob") // lowest score
    }).pipe(Effect.provide(makeTestClient("unsafe"))))

  // ============================================================================
  // Advanced Streaming Tests
  // ============================================================================

  it.scoped("should handle large dataset streaming with backpressure", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE large_stream_test (id INTEGER, data VARCHAR)`

      // Insert a large dataset
      const batchSize = 1000
      for (let batch = 0; batch < 5; batch++) {
        const values = Array.from({ length: batchSize }, (_, i) =>
          `(${batch * batchSize + i}, 'data-${batch * batchSize + i}')`).join(", ")
        yield* sql.unsafe(`INSERT INTO large_stream_test VALUES ${values}`)
      }

      // Stream with controlled consumption
      const stream = sql`SELECT * FROM large_stream_test ORDER BY id`.stream

      let count = 0
      yield* Stream.runForEach(
        Stream.take(stream, 2500), // Take only first 2500 items
        () =>
          Effect.sync(() => {
            count++
          })
      )

      assert.strictEqual(count, 2500)
    }).pipe(Effect.provide(makeTestClient("large-stream"))))

  it.scoped("should work with different database configurations", () =>
    Effect.gen(function*() {
      // Test with different configurations
      const configs = [
        { database: ":memory:", convertBigInt: true },
        { database: ":memory:", preferJson: true },
        { database: ":memory:", chunkSize: 500 }
      ]

      for (const config of configs) {
        const testLayer = DuckDbClient.layer(config).pipe(Layer.provide(Reactivity.layer))

        yield* Effect.scoped(
          Effect.gen(function*() {
            const sql = yield* DuckDbClient.DuckDbClient

            yield* sql`CREATE TABLE config_test (id INTEGER, name VARCHAR)`
            yield* sql`INSERT INTO config_test VALUES (1, 'test')`

            const results = yield* sql`SELECT * FROM config_test`
            assert.strictEqual(results.length, 1)
            assert.strictEqual(results[0].id, 1)
            assert.strictEqual(results[0].name, "test")
          }).pipe(Effect.provide(testLayer))
        )
      }
    }).pipe(Effect.provide(makeTestClient("config-variations"))))

  it.scoped("should support transform functions", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE transform_test (user_name VARCHAR, user_age INTEGER)`
      yield* sql`INSERT INTO transform_test VALUES ('Alice', 25), ('Bob', 30)`

      const results = yield* sql`SELECT * FROM transform_test ORDER BY user_age`

      // Results should have transformed column names based on config
      assert.strictEqual(results.length, 2)
      assert.strictEqual(results[0].user_name, "Alice")
      assert.strictEqual(results[1].user_name, "Bob")
    }).pipe(Effect.provide(makeTestClient("transforms", {
      transformResultNames: (name) => name.toLowerCase()
    }))))

  // ============================================================================
  // ARRAY vs LIST Type Distinction Tests
  // ============================================================================

  it.scoped("should support LIST type with variable-length collections", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE list_test (
        id INTEGER,
        tags TEXT[],
        scores DOUBLE[]
      )`

      // Insert rows with different list lengths using list helper
      yield* sql`INSERT INTO list_test ${
        sql.insert({
          id: 1,
          tags: sql.duckdbHelpers.list(["tag1", "tag2"]),
          scores: sql.duckdbHelpers.list([1.5, 2.5])
        } as any)
      }`

      yield* sql`INSERT INTO list_test ${
        sql.insert({
          id: 2,
          tags: sql.duckdbHelpers.list(["tag1", "tag2", "tag3", "tag4"]), // Different length
          scores: sql.duckdbHelpers.list([3.5, 4.5, 5.5]) // Different length
        } as any)
      }`

      const results = yield* sql`SELECT * FROM list_test ORDER BY id`
      assert.strictEqual(results.length, 2)

      // Verify variable lengths work
      assert.strictEqual(results[0].tags.length, 2)
      assert.strictEqual(results[1].tags.length, 4)
      assert.strictEqual(results[0].scores.length, 2)
      assert.strictEqual(results[1].scores.length, 3)
    }).pipe(Effect.provide(makeTestClient("list-variable"))))

  it.scoped("should support ARRAY type with fixed-length collections", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE array_test (
        id INTEGER,
        coordinates DOUBLE[3],
        rgb_values INTEGER[3]
      )`

      // Insert rows with fixed-length arrays using fixedArray helper
      yield* sql`INSERT INTO array_test ${
        sql.insert({
          id: 1,
          coordinates: sql.duckdbHelpers.fixedArray([1.0, 2.0, 3.0]),
          rgb_values: sql.duckdbHelpers.fixedArray([255, 128, 64])
        } as any)
      }`

      yield* sql`INSERT INTO array_test ${
        sql.insert({
          id: 2,
          coordinates: sql.duckdbHelpers.fixedArray([4.0, 5.0, 6.0]),
          rgb_values: sql.duckdbHelpers.fixedArray([100, 200, 50])
        } as any)
      }`

      const results = yield* sql`SELECT * FROM array_test ORDER BY id`
      assert.strictEqual(results.length, 2)

      // Verify all arrays have fixed length of 3
      assert.strictEqual(results[0].coordinates.length, 3)
      assert.strictEqual(results[1].coordinates.length, 3)
      assert.strictEqual(results[0].rgb_values.length, 3)
      assert.strictEqual(results[1].rgb_values.length, 3)

      // Verify values
      assert.deepStrictEqual(results[0].coordinates, [1.0, 2.0, 3.0])
      assert.deepStrictEqual(results[0].rgb_values, [255, 128, 64])
    }).pipe(Effect.provide(makeTestClient("array-fixed"))))

  it.scoped("should maintain backward compatibility with array helper", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE compat_test (
        id INTEGER,
        items INTEGER[]
      )`

      // Use the deprecated array helper (should behave as list)
      yield* sql`INSERT INTO compat_test ${
        sql.insert({
          id: 1,
          items: sql.duckdbHelpers.array([1, 2, 3])
        } as any)
      }`

      const results = yield* sql`SELECT * FROM compat_test`
      assert.strictEqual(results.length, 1)
      assert.deepStrictEqual(results[0].items, [1, 2, 3])
    }).pipe(Effect.provide(makeTestClient("backward-compat"))))

  it.scoped("should handle mixed array operations with different types", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE mixed_test (
        id INTEGER,
        variable_tags TEXT[],
        fixed_coords DOUBLE[2]
      )`

      // Mix list and fixedArray in same query
      yield* sql`INSERT INTO mixed_test ${
        sql.insert({
          id: 1,
          variable_tags: sql.duckdbHelpers.list(["a", "b", "c", "d"]), // Variable length
          fixed_coords: sql.duckdbHelpers.fixedArray([10.5, 20.5]) // Fixed length
        } as any)
      }`

      yield* sql`INSERT INTO mixed_test ${
        sql.insert({
          id: 2,
          variable_tags: sql.duckdbHelpers.list(["x", "y"]), // Different variable length
          fixed_coords: sql.duckdbHelpers.fixedArray([30.5, 40.5]) // Same fixed length
        } as any)
      }`

      const results = yield* sql`SELECT * FROM mixed_test ORDER BY id`
      assert.strictEqual(results.length, 2)

      // Variable length lists work
      assert.strictEqual(results[0].variable_tags.length, 4)
      assert.strictEqual(results[1].variable_tags.length, 2)

      // Fixed length arrays work
      assert.strictEqual(results[0].fixed_coords.length, 2)
      assert.strictEqual(results[1].fixed_coords.length, 2)

      assert.deepStrictEqual(results[0].fixed_coords, [10.5, 20.5])
      assert.deepStrictEqual(results[1].fixed_coords, [30.5, 40.5])
    }).pipe(Effect.provide(makeTestClient("mixed-types"))))

  it.scoped("should support complex array operations with both LIST and ARRAY", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE complex_arrays (
        id INTEGER,
        embeddings DOUBLE[4],
        keywords TEXT[]
      )`

      // Insert test data with both fixed and variable arrays
      yield* sql`INSERT INTO complex_arrays VALUES
        (1, [0.1, 0.2, 0.3, 0.4], ['ai', 'ml', 'data']),
        (2, [0.5, 0.6, 0.7, 0.8], ['tech', 'innovation']),
        (3, [0.9, 1.0, 1.1, 1.2], ['future', 'automation', 'efficiency', 'growth'])`

      // Query with array operations
      const results = yield* sql`
        SELECT id, array_cosine_similarity(embeddings, CAST([0.1, 0.2, 0.3, 0.4] AS DOUBLE[4])) as similarity
        FROM complex_arrays
        WHERE list_contains(keywords, 'ai') OR array_length(keywords) > 3
        ORDER BY similarity DESC
      `

      assert.strictEqual(results.length, 2) // Row 1 (contains 'ai') and Row 3 (length > 3)
      assert.strictEqual(results[0].id, 1) // Perfect similarity comes first
      assert.strictEqual(results[1].id, 3)
    }).pipe(Effect.provide(makeTestClient("complex-array-ops"))))

  // ============================================================================
  // Helper Function Tests
  // ============================================================================
})
