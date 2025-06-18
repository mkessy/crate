import * as Reactivity from "@effect/experimental/Reactivity"
import { describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as assert from "node:assert"
import * as DuckDbClient from "../src/DuckDbClient.js"

const makeTestClient = (testName: string) =>
  DuckDbClient.layer({
    database: ":memory:"
  }).pipe(Layer.provide(Reactivity.layer))

describe("DuckDbClient", () => {
  it.scoped("should create and query tables", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE users (id INTEGER, name VARCHAR(255)); COMMIT;`
      yield* sql`INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')`

      const users = yield* sql`SELECT * FROM users ORDER BY id`

      assert.strictEqual(users.length, 2)
      assert.strictEqual(users[0].name, "Alice")
      assert.strictEqual(users[1].name, "Bob")
    }).pipe(Effect.provide(makeTestClient("basic"))))

  it.scoped("should execute raw queries", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE test (id INTEGER)`
      yield* sql`INSERT INTO test VALUES (42)`

      const results = yield* sql`SELECT * FROM test`
      assert.strictEqual(results[0].id, 42)
    }).pipe(Effect.provide(makeTestClient("raw"))))

  it.scoped("should handle DuckDB-specific queries", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      // Test DuckDB's array functionality
      yield* sql`CREATE TABLE arrays_test (id INTEGER, data INTEGER[])`
      yield* sql`INSERT INTO arrays_test VALUES (1, [1, 2, 3])`

      const results = yield* sql`SELECT * FROM arrays_test`
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].id, 1)
    }).pipe(Effect.provide(makeTestClient("arrays"))))

  it.scoped("withTransaction", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`
      yield* sql.withTransaction(sql`INSERT INTO test (id, name) VALUES (1, 'hello')`)
      const rows = yield* sql`SELECT * FROM test`
      assert.deepStrictEqual(rows, [{ id: 1, name: "hello" }])
    }).pipe(Effect.provide(makeTestClient("withTransaction"))))

  it.scoped("withTransaction rollback", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`
      yield* sql`INSERT INTO test (id, name) VALUES (1, 'hello')`.pipe(
        Effect.andThen(Effect.fail("boom")),
        sql.withTransaction,
        Effect.ignore
      )
      const rows = yield* sql`SELECT * FROM test`
      assert.deepStrictEqual(rows, [])
    }).pipe(Effect.provide(makeTestClient("withTransaction rollback"))))

  it.scoped("should handle empty results", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE empty_test (id INTEGER)`
      const results = yield* sql`SELECT * FROM empty_test`

      assert.deepStrictEqual(results, [])
    }).pipe(Effect.provide(makeTestClient("empty"))))

  it.scoped("should handle errors gracefully", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      const result = yield* Effect.either(
        sql`SELECT * FROM non_existent_table`
      )

      assert.strictEqual(result._tag, "Left")
    }).pipe(Effect.provide(makeTestClient("errors"))))

  it.scoped("should support executeValues", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE values_test (id INTEGER, name VARCHAR(50))`
      yield* sql`INSERT INTO values_test VALUES (1, 'test')`
      yield* sql`INSERT INTO values_test VALUES (2, 'test2')`

      const values = yield* sql`SELECT * FROM values_test`

      assert.strictEqual(values.length, 2)
      assert.deepStrictEqual(values, [
        { id: 1, name: "test" },
        { id: 2, name: "test2" }
      ])
    }).pipe(Effect.provide(makeTestClient("values"))))

  it.scoped("should verify client configuration", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      assert.strictEqual(sql.config.database, ":memory:")
    }).pipe(Effect.provide(makeTestClient("config"))))

  // --- DuckDB‑specific extra cases ----------------------------------------

  it.scoped("should insert & retrieve INTEGER[] using sql.array", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE int_arrays (id INTEGER, data INTEGER[])`
      yield* sql`INSERT INTO int_arrays VALUES (1, ${sql.array([10, 20, 30])})`

      const rows = yield* sql`SELECT * FROM int_arrays`
      assert.deepStrictEqual(rows, [{ id: 1, data: "[10,20,30]" }])
    }).pipe(Effect.provide(makeTestClient("array‑helper"))))

  it.scoped("should round‑trip a BLOB as Uint8Array", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      yield* sql`CREATE TABLE blobs (id INTEGER, bytes BLOB)`
      const buf = new Uint8Array([1, 2, 3, 4])
      yield* sql`INSERT INTO blobs VALUES (1, ${buf})`

      const rows = yield* sql`SELECT * FROM blobs`
      assert.ok(rows[0].bytes instanceof Uint8Array)
      assert.deepStrictEqual(Array.from(rows[0].bytes), [1, 2, 3, 4])
    }).pipe(Effect.provide(makeTestClient("blob‑roundtrip"))))

  it.scoped("withTransaction should commit UPDATE", () =>
    Effect.gen(function*() {
      const sql = yield* DuckDbClient.DuckDbClient

      const value = "Janet"
      yield* sql`CREATE TABLE users_tx (id INTEGER PRIMARY KEY, name TEXT)`.pipe(
        Effect.andThen(sql`INSERT INTO users_tx VALUES (1, 'Jane')`),
        Effect.andThen(sql`UPDATE users_tx SET ${sql.update({ name: value })} WHERE id = 1`),
        sql.withTransaction,
        Effect.ignore
      )

      const rows = yield* sql`SELECT * FROM users_tx`
      assert.deepStrictEqual(rows, [{ id: 1, name: "Janet" }])
    }).pipe(Effect.provide(makeTestClient("update‑tx"))))
})
