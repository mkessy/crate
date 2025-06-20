/**
 * DuckDB Parameter Binding
 * 
 * This module handles parameter binding for DuckDB prepared statements.
 * It maps Effect SQL primitives and custom types to DuckDB's native binding methods.
 */

import { SqlError } from "@effect/sql/SqlError"
import type { Primitive } from "@effect/sql/Statement"
import * as Statement from "@effect/sql/Statement"
import type { DuckDBPreparedStatement } from "@duckdb/node-api"
import * as Effect from "effect/Effect"
import { createListValue, createStructValue } from "./fragments.js"

/**
 * Bind parameters to a prepared statement.
 * Handles both primitives and custom DuckDB types.
 */
export const bindParameters = (
  prepared: DuckDBPreparedStatement,
  params: ReadonlyArray<Primitive>
): Effect.Effect<void, SqlError> =>
  Effect.try({
    try: () => {
      const paramCount = prepared.parameterCount
      
      if (params.length !== paramCount) {
        throw new Error(
          `Parameter count mismatch: expected ${paramCount}, got ${params.length}`
        )
      }

      // Bind each parameter using the appropriate method
      params.forEach((param, index) => {
        const paramIndex = index + 1 // DuckDB uses 1-based indexing
        bindParameter(prepared, paramIndex, param)
      })
    },
    catch: (error) => new SqlError({ 
      cause: error, 
      message: "Failed to bind parameters" 
    })
  })

/**
 * Bind a single parameter based on its type
 */
const bindParameter = (
  prepared: DuckDBPreparedStatement,
  index: number,
  value: Primitive
): void => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    prepared.bindNull(index)
    return
  }

  // Check if it's a custom fragment
  if (Statement.isFragment(value)) {
    const segment = value.segments[0]
    if (segment._tag === "Custom") {
      bindCustomParameter(prepared, index, segment)
      return
    }
  }

  // Bind primitive types
  if (typeof value === "boolean") {
    prepared.bindBoolean(index, value)
  } else if (typeof value === "number") {
    // Use bindDouble for all numbers - DuckDB will convert as needed
    prepared.bindDouble(index, value)
  } else if (typeof value === "bigint") {
    prepared.bindBigInt(index, value)
  } else if (typeof value === "string") {
    prepared.bindVarchar(index, value)
  } else if (value instanceof Date) {
    // Convert Date to DuckDB timestamp
    prepared.bindTimestamp(index, dateToTimestamp(value))
  } else if (value instanceof Uint8Array) {
    prepared.bindBlob(index, value)
  } else if (value instanceof Int8Array) {
    // Convert Int8Array to Uint8Array for blob binding
    prepared.bindBlob(index, new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
  } else {
    // Fallback: treat as JSON string
    prepared.bindVarchar(index, JSON.stringify(value))
  }
}

/**
 * Bind custom DuckDB types
 */
const bindCustomParameter = (
  prepared: DuckDBPreparedStatement,
  index: number,
  segment: Statement.Custom<string, any, any>
): void => {
  switch (segment.kind) {
    case "DuckDbList": {
      const items = segment.i0
      if (Array.isArray(items)) {
        // Convert primitive array to DuckDBListValue
        prepared.bindList(index, createListValue(items))
      } else {
        // Already a DuckDBListValue
        prepared.bindList(index, items)
      }
      break
    }
    
    case "DuckDbStruct": {
      const fields = segment.i0
      if (fields && typeof fields === "object" && !("entries" in fields)) {
        // Convert plain object to DuckDBStructValue
        prepared.bindStruct(index, createStructValue(fields))
      } else {
        // Already a DuckDBStructValue
        prepared.bindStruct(index, fields)
      }
      break
    }
    
    case "DuckDbJson": {
      // Serialize to JSON string
      prepared.bindVarchar(index, JSON.stringify(segment.i0))
      break
    }
    
    default:
      throw new Error(`Unknown custom parameter type: ${segment.kind}`)
  }
}

/**
 * Convert JavaScript Date to DuckDB timestamp value.
 * DuckDB timestamps are microseconds since epoch.
 */
const dateToTimestamp = (date: Date): any => {
  // Import at runtime to avoid circular dependency
  const { timestampValue } = require("@duckdb/node-api")
  const micros = BigInt(date.getTime()) * 1000n // Convert milliseconds to microseconds
  return timestampValue(micros)
}

/**
 * Extract parameter value from a Primitive or Fragment.
 * Used by the compiler to get the actual value for binding.
 */
export const extractParameterValue = (
  value: Primitive | Statement.Fragment | any
): Primitive => {
  if (Statement.isFragment(value)) {
    const segment = value.segments[0]
    if (segment._tag === "Custom") {
      // Return the original value for custom types
      return segment.i0
    } else if (segment._tag === "Parameter") {
      return segment.value
    }
    // For other segment types, return null as a fallback
    return null
  }
  return value as Primitive
}
