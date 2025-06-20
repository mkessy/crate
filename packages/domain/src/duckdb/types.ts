/**
 * DuckDB SQL Client Type Definitions
 *
 * This module defines the core types for DuckDB SQL client integration with Effect.
 * We use minimal custom types, leveraging DuckDB Neo's native type handling.
 */

import type { DuckDBListValue, DuckDBStructValue } from "@duckdb/node-api"
import type { SqlClient } from "@effect/sql/SqlClient"
import type { Custom, Fragment, Primitive } from "@effect/sql/Statement"

/**
 * Type identifier for the DuckDB client
 */
export const TypeId: unique symbol = Symbol.for("@effect/sql-duckdb/DuckDbClient")
export type TypeId = typeof TypeId

/**
 * Custom SQL fragment types for DuckDB-specific data structures.
 * These follow the Effect SQL pattern of extending Custom with the type name and value type.
 */
export interface DuckDbList extends Custom<"DuckDbList", ReadonlyArray<Primitive> | DuckDBListValue> {
  readonly i0: ReadonlyArray<Primitive> | DuckDBListValue
}
export interface DuckDbStruct extends Custom<"DuckDbStruct", Record<string, Primitive> | DuckDBStructValue> {
  readonly i0: Record<string, Primitive> | DuckDBStructValue
}
export interface DuckDbJson extends Custom<"DuckDbJson", unknown> {
  readonly i0: unknown
}

/**
 * Union of all DuckDB custom types
 */
export type DuckDbCustom = DuckDbList | DuckDbStruct | DuckDbJson

/**
 * DuckDB client configuration
 */
export interface DuckDbClientConfig {
  /**
   * Database file path or ":memory:" for in-memory database
   */
  readonly filename?: string

  /**
   * Transform column names in results (e.g., snake_case to camelCase)
   */
  readonly transformResultNames?: (str: string) => string

  /**
   * Transform identifiers in queries (e.g., camelCase to snake_case)
   */
  readonly transformQueryNames?: (str: string) => string

  /**
   * Additional span attributes for OpenTelemetry tracing
   */
  readonly spanAttributes?: Record<string, unknown>

  /**
   * Maximum number of connections in the pool
   */
  readonly maxConnections?: number

  /**
   * Connection time-to-live in milliseconds
   */
  readonly connectionTTL?: number
}

/**
 * DuckDB-specific SQL client interface
 */
export interface DuckDbClient extends SqlClient {
  readonly [TypeId]: TypeId
  readonly config: DuckDbClientConfig

  /**
   * Create a LIST fragment for variable-length arrays
   */
  readonly list: (items: ReadonlyArray<Primitive>) => Fragment

  /**
   * Create a STRUCT fragment for nested objects
   */
  readonly struct: (fields: Record<string, Primitive>) => Fragment

  /**
   * Create a JSON fragment for JSON data
   */
  readonly json: (value: unknown) => Fragment
}
