/**
 * @effect/sql-duckdb
 * 
 * DuckDB implementation for Effect SQL.
 * Provides a high-performance SQL client with support for DuckDB's
 * advanced features including complex data types (LIST, STRUCT, JSON).
 * 
 * @example
 * ```ts
 * import * as DuckDb from "@effect/sql-duckdb"
 * import { Effect } from "effect"
 * 
 * const program = Effect.gen(function* () {
 *   const sql = yield* DuckDb.DuckDbClient
 *   
 *   // Create table with complex types
 *   yield* sql`
 *     CREATE TABLE users (
 *       id INTEGER PRIMARY KEY,
 *       name VARCHAR,
 *       tags VARCHAR[],
 *       metadata STRUCT(created_at TIMESTAMP, active BOOLEAN)
 *     )
 *   `
 *   
 *   // Insert with LIST and STRUCT
 *   yield* sql`
 *     INSERT INTO users VALUES (
 *       ${1},
 *       ${"Alice"},
 *       ${sql.list(["admin", "user"])},
 *       ${sql.struct({ created_at: new Date(), active: true })}
 *     )
 *   `
 *   
 *   // Query returns native JS objects
 *   const users = yield* sql`SELECT * FROM users`
 *   console.log(users[0].tags) // ["admin", "user"] - native array!
 * })
 * 
 * program.pipe(
 *   Effect.provide(DuckDb.layer({ filename: ":memory:" })),
 *   Effect.runPromise
 * )
 * ```
 */

// Client exports
export {
  make,
  layer,
  DuckDbClient,
} from "./client.js"

// Type exports
export type {
  DuckDbClient as DuckDbClientInterface,
  DuckDbClientConfig,
  DuckDbCustom,
  TypeId
} from "./types.js"

// Fragment constructor exports
export {
  list,
  struct,
  json
} from "./fragments.js"

// Compiler exports (for advanced use)
export {
  makeCompiler,
  defaultTransforms
} from "./compiler.js"
