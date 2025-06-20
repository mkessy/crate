/**
 * DuckDB Statement Compiler
 *
 * This module provides the SQL statement compiler for DuckDB.
 * It handles identifier escaping and custom type transformations.
 */

import * as Statement from "@effect/sql/Statement"
import type { Primitive } from "@effect/sql/Statement"
import { extractParameterValue } from "./parameters.js"
import type { DuckDbJson, DuckDbList, DuckDbStruct } from "./types.js"

/**
 * Create a DuckDB statement compiler with optional identifier transformation.
 *
 * @param transform - Optional function to transform identifiers (e.g., camelCase to snake_case)
 */
export const makeCompiler = (
  transform?: (_: string) => string
): Statement.Compiler =>
  Statement.makeCompiler({
    // DuckDB uses ? placeholders like SQLite
    dialect: "sqlite",

    // Parameter placeholder generator
    placeholder: () => "?",

    // Identifier escaping with optional transformation
    onIdentifier: transform
      ? (value, withoutTransform) => withoutTransform ? escape(value) : escape(transform(value))
      : escape,

    // Handle custom DuckDB types
    onCustom(type, placeholder) {
      switch (type.kind) {
        case "DuckDbList": {
          const custom = type as DuckDbList
          // Pass the value through - actual binding happens in parameters.ts
          return [placeholder(undefined), [extractParameterValue(custom.i0) as Primitive]]
        }

        case "DuckDbStruct": {
          const custom = type as DuckDbStruct
          // Pass the value through - actual binding happens in parameters.ts
          return [placeholder(undefined), [extractParameterValue(custom.i0) as Primitive]]
        }

        case "DuckDbJson": {
          const custom = type as DuckDbJson
          // JSON is serialized to string during binding
          return [placeholder(undefined), [custom.i0 as Primitive]]
        }

        default:
          throw new Error(`Unknown custom type: ${(type as any).kind}`)
      }
    },

    // Handle record updates (INSERT ... RETURNING, UPDATE ... RETURNING)
    onRecordUpdate(placeholders, valueAlias, valueColumns, values, returning) {
      // DuckDB supports RETURNING clause
      return [
        returning
          ? `${placeholders} RETURNING ${returning[0]}`
          : placeholders,
        values.flat()
      ]
    }
  })

/**
 * Escape identifiers for DuckDB using double quotes.
 * This follows the SQL standard for delimited identifiers.
 */
const escape = Statement.defaultEscape("\"")

/**
 * Default identifier transformations
 */
export const defaultTransforms = {
  /**
   * Transform camelCase to snake_case
   */
  camelToSnake: (str: string): string =>
    str.replace(/([A-Z])/g, (_, char, index) => index === 0 ? char.toLowerCase() : `_${char.toLowerCase()}`),

  /**
   * Transform snake_case to camelCase
   */
  snakeToCamel: (str: string): string => str.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}
