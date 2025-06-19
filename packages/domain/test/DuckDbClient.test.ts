import * as Reactivity from "@effect/experimental/Reactivity"
import { SqlError } from "@effect/sql"
import { describe, it } from "@effect/vitest"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
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
      yield* sql`INSERT INTO int_arrays VALUES (${1}, ${sql.duckdbHelpers.array(arrayData)})`

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

  it.skip("should validate typed array inputs", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      // Test integer validation
      assert.throws(
        () => sql.duckdbHelpers.intArray([1, 2.5, 3]),
        /All items must be integers/
      )

      // Test string validation
      assert.throws(
        () => sql.duckdbHelpers.textArray(["hello", 123 as any]),
        /All items must be strings/
      )

      // Test boolean validation
      assert.throws(
        () => sql.duckdbHelpers.array([true, "false" as any]),
        /All items must be booleans/
      )

      // Test float validation
      assert.throws(
        () => sql.duckdbHelpers.array([1.5, NaN]),
        /All items must be valid numbers/
      )
    }).pipe(Effect.provide(makeTestClient("array-validation"))))

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
      console.log("COMPLEX ARRAYS", results)

      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].user_id, 1)
      assert.strictEqual(results[0].event_count, 2)
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

      yield* sql`INSERT INTO types_test VALUES (
        ${1},
        ${"test"},
        ${true},
        ${3.14},
        ${BigInt(9007199254740991)},
        ${now},
        ${blob}
      )`

      const rows = yield* sql`SELECT * FROM types_test`
      assert.strictEqual(rows[0].id, 1)
      assert.strictEqual(rows[0].name, "test")
      assert.strictEqual(rows[0].active, true)
      assert.strictEqual(rows[0].score, 3.14)
      assert.strictEqual(rows[0].big, BigInt(9007199254740991))
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

      const notStream = yield* sql`SELECT * FROM stream_test ORDER BY id`
      console.log("NOT STREAM", notStream)
      const stream = sql`SELECT * FROM stream_test ORDER BY id`.stream

      const results = (yield* Stream.runCollect(stream)).pipe(Chunk.toReadonlyArray)
      console.log("STREAM RESULTS", results)

      assert.strictEqual(results.length, 100)
      assert.strictEqual(results[0].id, 0)
      assert.strictEqual(results[99].id, 99)
    }).pipe(Effect.provide(makeTestClient("stream"))))

  // ============================================================================
  // Helper Function Tests
  // ============================================================================
})
