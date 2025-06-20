/**
 * DuckDB SQL Fragment Constructors
 *
 * This module provides fragment constructors for DuckDB-specific types.
 * These fragments are used in SQL queries to handle complex data types.
 */

import { listValue, structValue } from "@duckdb/node-api"
import * as Statement from "@effect/sql/Statement"
import type { Fragment, Primitive } from "@effect/sql/Statement"
import type { DuckDbJson, DuckDbList, DuckDbStruct } from "./types.js"

/**
 * Internal custom constructors following the Effect SQL pattern.
 * Custom types require 3 parameters (i0, i1, i2), with unused parameters as void.
 */
const DuckDbListFragment = Statement.custom<DuckDbList>("DuckDbList")
const DuckDbStructFragment = Statement.custom<DuckDbStruct>("DuckDbStruct")
const DuckDbJsonFragment = Statement.custom<DuckDbJson>("DuckDbJson")

/**
 * Create a LIST fragment for variable-length arrays.
 * Lists in DuckDB can contain any number of elements of the same type.
 *
 * @example
 * ```ts
 * sql`INSERT INTO users (id, tags) VALUES (${1}, ${list([1, 2, 3])})`
 * ```
 */
export const list = (items: ReadonlyArray<Primitive>): Fragment => DuckDbListFragment(items, void 0, void 0)

/**
 * Create a STRUCT fragment for nested objects.
 * Structs in DuckDB are like typed records with named fields.
 *
 * @example
 * ```ts
 * sql`INSERT INTO profiles (id, data) VALUES (${1}, ${struct({ name: "Alice", age: 30 })})`
 * ```
 */
export const struct = (fields: Record<string, Primitive>): Fragment => DuckDbStructFragment(fields, void 0, void 0)

/**
 * Create a JSON fragment for JSON data.
 * This serializes the value to JSON for storage in DuckDB's JSON type.
 *
 * @example
 * ```ts
 * sql`INSERT INTO events (id, payload) VALUES (${1}, ${json({ type: "click", x: 100 })})`
 * ```
 */
export const json = (value: unknown): Fragment => DuckDbJsonFragment(value, void 0, void 0)

/**
 * Check if a value is a DuckDB custom fragment
 */
export const isCustomFragment = (value: any): value is Statement.Custom<string, any, any> =>
  value && typeof value === "object" && "_tag" in value && value._tag === "Custom"

/**
 * Helper to create DuckDB list value from primitives.
 * This is used internally during parameter binding.
 */
export const createListValue = (items: ReadonlyArray<Primitive>) => {
  // DuckDB Neo expects DuckDBValue[] but primitives work fine
  return listValue(items as any)
}

/**
 * Helper to create DuckDB struct value from a record.
 * This is used internally during parameter binding.
 */
export const createStructValue = (fields: Record<string, Primitive>) => {
  // DuckDB Neo expects Record<string, DuckDBValue> but primitives work fine
  return structValue(fields as any)
}
