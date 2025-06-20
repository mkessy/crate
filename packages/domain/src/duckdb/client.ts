/**
 * DuckDB SQL Client Implementation
 *
 * This module provides the main DuckDB client implementation for Effect SQL.
 * It integrates with the Effect ecosystem providing connection pooling,
 * transaction management, and reactive queries.
 */

import { DuckDBInstance } from "@duckdb/node-api"
import * as Reactivity from "@effect/experimental/Reactivity"
import * as Client from "@effect/sql/SqlClient"
import { SqlError } from "@effect/sql/SqlError"
import * as Statement from "@effect/sql/Statement"
import * as Otel from "@opentelemetry/semantic-conventions"
import * as Context from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Pool from "effect/Pool"
import type * as Scope from "effect/Scope"
import { makeCompiler } from "./compiler.js"
import { makeConnection, makeTransactionConnection } from "./connection.js"
import { json, list, struct } from "./fragments.js"
import type { DuckDbClient as DuckDbClientInterface, DuckDbClientConfig, TypeId as DuckDbTypeId } from "./types.js"
import { TypeId } from "./types.js"

/**
 * DuckDB Client Context Tag
 */
export const DuckDbClient = Context.GenericTag<DuckDbClientInterface>("@effect/sql-duckdb/DuckDbClient")

/**
 * Create a DuckDB client instance
 */
export const make = (
  config: DuckDbClientConfig
): Effect.Effect<DuckDbClientInterface, SqlError, Scope.Scope | Reactivity.Reactivity> =>
  Effect.gen(function*() {
    // Create DuckDB instance
    const instance = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => DuckDBInstance.create(config.filename ?? ":memory:"),
        catch: (error) =>
          new SqlError({
            cause: error,
            message: "Failed to create DuckDB instance"
          })
      }),
      (instance) => Effect.sync(() => instance.closeSync())
    )

    // Create connection pool
    const connectionPool = yield* Pool.makeWithTTL({
      acquire: Effect.tryPromise({
        try: () => instance.connect(),
        catch: (error) =>
          new SqlError({
            cause: error,
            message: "Failed to create connection"
          })
      }),
      min: 1,
      max: config.maxConnections ?? 10,
      timeToLive: config.connectionTTL
        ? Duration.millis(config.connectionTTL)
        : Duration.minutes(5)
    })

    // Connection acquirer for the SQL client
    const acquirer = Effect.map(
      Pool.get(connectionPool),
      (conn) => makeConnection(conn, config)
    )

    // Transaction acquirer - uses a dedicated connection
    const transactionAcquirer = Effect.map(
      Effect.tryPromise({
        try: () => instance.connect(),
        catch: (error) =>
          new SqlError({
            cause: error,
            message: "Failed to create transaction connection"
          })
      }),
      (conn) => makeTransactionConnection(conn, config)
    )

    // Create the base SQL client
    const compiler = makeCompiler(config.transformQueryNames)

    const sqlClient = yield* Client.make({
      acquirer,
      transactionAcquirer,
      compiler,
      spanAttributes: [
        [Otel.SEMATTRS_DB_SYSTEM, "duckdb"],
        ...(config.spanAttributes
          ? Object.entries(config.spanAttributes)
          : [])
      ],
      transformRows: config.transformResultNames
        ? Statement.defaultTransforms(config.transformResultNames).array
        : undefined
    })

    // Extend with DuckDB-specific functionality
    return Object.assign(sqlClient, {
      [TypeId]: TypeId as DuckDbTypeId,
      config,
      list,
      struct,
      json
    }) as DuckDbClientInterface
  })

/**
 * Create a DuckDB client layer with configuration
 */
export const layer = (
  config: DuckDbClientConfig
): Layer.Layer<DuckDbClientInterface | Client.SqlClient, SqlError, Reactivity.Reactivity> =>
  Layer.scopedContext(
    Effect.map(
      make(config),
      (client) =>
        Context.make(DuckDbClient, client).pipe(
          Context.add(Client.SqlClient, client)
        )
    )
  ).pipe(Layer.provide(Reactivity.layer))
