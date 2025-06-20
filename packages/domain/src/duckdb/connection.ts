/**
 * DuckDB Connection Implementation
 * 
 * This module implements the Effect SQL Connection interface for DuckDB.
 * It provides methods for executing queries, handling streams, and managing transactions.
 */

import type { Connection } from "@effect/sql/SqlConnection"
import { SqlError } from "@effect/sql/SqlError"
import type { Primitive } from "@effect/sql/Statement"
import type { DuckDBConnection, DuckDBPreparedStatement, DuckDBDataChunk } from "@duckdb/node-api"
import * as Chunk from "effect/Chunk"
import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import * as Scope from "effect/Scope"
import { bindParameters } from "./parameters.js"
import type { DuckDbClientConfig } from "./types.js"

/**
 * Create a Connection implementation for DuckDB
 */
export const makeConnection = (
  conn: DuckDBConnection,
  config: DuckDbClientConfig
): Connection => {
  /**
   * Prepare and execute a statement with resource management
   */
  const executePrepared = <T>(
    sql: string,
    params: ReadonlyArray<Primitive> | undefined,
    handler: (prepared: DuckDBPreparedStatement) => Effect.Effect<T, SqlError>
  ): Effect.Effect<T, SqlError> =>
    Effect.acquireUseRelease(
      // Acquire: prepare the statement
      Effect.tryPromise({
        try: () => conn.prepare(sql),
        catch: (error) => new SqlError({ 
          cause: error, 
          message: `Failed to prepare statement: ${sql}` 
        })
      }),
      // Use: bind parameters and execute handler
      (prepared) =>
        params && params.length > 0
          ? Effect.flatMap(bindParameters(prepared, params), () => handler(prepared))
          : handler(prepared),
      // Release: destroy the prepared statement
      (prepared) => Effect.sync(() => prepared.destroySync())
    )

  return {
    /**
     * Execute a query and return all rows
     */
    execute(sql, params, transformRows) {
      return executePrepared(sql, params, (prepared) =>
        Effect.gen(function* () {
          // Run the query
          const result = yield* Effect.tryPromise({
            try: () => prepared.run(),
            catch: (error) => new SqlError({ 
              cause: error, 
              message: "Failed to execute statement" 
            })
          })

          // Get rows as native JS objects
          const rows = yield* Effect.tryPromise({
            try: () => result.getRowObjectsJS(),
            catch: (error) => new SqlError({ 
              cause: error, 
              message: "Failed to retrieve results" 
            })
          })

          // Apply optional row transformation
          return transformRows ? transformRows(rows) : rows
        })
      )
    },

    /**
     * Execute a query and return raw results
     */
    executeRaw(sql, params) {
      return executePrepared(sql, params, (prepared) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () => prepared.run(),
            catch: (error) => new SqlError({ 
              cause: error, 
              message: "Failed to execute statement" 
            })
          })

          // Return raw DuckDB result
          return result as unknown
        })
      )
    },

    /**
     * Execute a query and stream results
     */
    executeStream(sql, params, transformRows) {
      return Stream.unwrapScoped(
        Effect.gen(function* () {
          const scope = yield* Scope.Scope
          
          // Prepare statement with scope management
          const prepared = yield* Effect.tryPromise({
            try: () => conn.prepare(sql),
            catch: (error) => new SqlError({ 
              cause: error, 
              message: `Failed to prepare statement: ${sql}` 
            })
          })
          
          yield* Scope.addFinalizer(scope, Effect.sync(() => prepared.destroySync()))

          // Bind parameters if provided
          if (params && params.length > 0) {
            yield* bindParameters(prepared, params)
          }

          // Start streaming execution
          const pendingResult = prepared.startStream()

          // Create async generator for chunks
          async function* streamChunks(): AsyncGenerator<ReadonlyArray<any>, void, unknown> {
            const result = await pendingResult.getResult()
            const columnNames = result.deduplicatedColumnNames()
            
            while (true) {
              const chunk = await result.fetchChunk()
              if (!chunk || chunk.rowCount === 0) break
              
              // Get rows from chunk
              const rows = chunk.getRowObjects(columnNames)
              yield rows
            }
          }

          // Create stream from async generator
          const stream = Stream.fromAsyncIterable(
            streamChunks(),
            (error) => new SqlError({ cause: error, message: "Stream error" })
          )

          // Apply transformation if provided
          return transformRows
            ? Stream.mapChunks(stream, (chunk) =>
                Chunk.unsafeFromArray(
                  transformRows(Chunk.toReadonlyArray(chunk))
                )
              )
            : stream
        })
      )
    },

    /**
     * Execute a query and return values (arrays instead of objects)
     */
    executeValues(sql, params) {
      return executePrepared(sql, params, (prepared) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () => prepared.run(),
            catch: (error) => new SqlError({ 
              cause: error, 
              message: "Failed to execute statement" 
            })
          })

          // Get rows as arrays of values
          const rows = yield* Effect.tryPromise({
            try: () => result.getRowsJS(),
            catch: (error) => new SqlError({ 
              cause: error, 
              message: "Failed to retrieve results" 
            })
          })

          return rows as ReadonlyArray<ReadonlyArray<Primitive>>
        })
      )
    },

    /**
     * Execute without preparing (same as execute for DuckDB)
     */
    executeUnprepared(sql, params, transformRows) {
      // DuckDB Neo always prepares statements, so this is the same as execute
      return this.execute(sql, params, transformRows)
    }
  }
}

/**
 * Create a transaction-aware connection.
 * Transactions in DuckDB are managed at the connection level.
 */
export const makeTransactionConnection = (
  conn: DuckDBConnection,
  config: DuckDbClientConfig
): Connection => {
  const base = makeConnection(conn, config)
  
  // Transaction connections use the same implementation
  // as DuckDB manages transactions automatically
  return base
}
