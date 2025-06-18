import * as duckdb from "@duckdb/node-api"
import * as Reactivity from "@effect/experimental/Reactivity"
import * as Client from "@effect/sql/SqlClient"
import type { Connection } from "@effect/sql/SqlConnection"
import { SqlError } from "@effect/sql/SqlError"
import type { Custom, Primitive } from "@effect/sql/Statement"
import * as Statement from "@effect/sql/Statement"
import * as Otel from "@opentelemetry/semantic-conventions"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"

// --- DuckDB ↔ Effect value conversion helpers (built‑in JS converter) ------
const JSConverter = (js: duckdb.JS): Primitive => {
  if (
    js === null ||
    typeof js === "string" || typeof js === "number" || typeof js === "bigint" || typeof js === "boolean" ||
    js instanceof Date || js instanceof Int8Array || js instanceof Uint8Array
  ) {
    return js as Primitive
  }
  return JSON.stringify(js) as Primitive
}

export type DuckDbCustom = DuckDbArray
export interface DuckDbArray extends Custom<"DuckDbArray", ReadonlyArray<Primitive>> {}
export const DuckDbArray = Statement.custom<DuckDbArray>("DuckDbArray")

export const TypeId: unique symbol = Symbol.for("@effect/sql-duckdb/DuckDbClient")
export type TypeId = typeof TypeId

export interface DuckDbClient extends Client.SqlClient {
  readonly [TypeId]: TypeId
  readonly config: DuckDbClientConfig
  readonly array: (_: ReadonlyArray<Primitive>) => DuckDbArray
}

export interface DuckDbClientConfig {
  readonly database?: string
  readonly spanAttributes?: Record<string, unknown>
  readonly transformResultNames?: (str: string) => string
  readonly transformQueryNames?: (str: string) => string
}

export const DuckDbClient = Context.GenericTag<DuckDbClient>("@effect/sql-duckdb/DuckDbClient")

export const make = (
  options: DuckDbClientConfig
): Effect.Effect<DuckDbClient, SqlError, Scope.Scope | Reactivity.Reactivity> =>
  Effect.gen(function*() {
    const compiler = makeCompiler(options.transformQueryNames)

    const makeConnection: Effect.Effect<Connection, SqlError, Scope.Scope> = Effect.gen(function*() {
      const db = yield* Effect.promise(() => duckdb.DuckDBInstance.create(options.database ?? ":memory:"))
      const scope = yield* Effect.scope
      const dbConnection: duckdb.DuckDBConnection = yield* Effect.promise(() => db.connect())
      yield* Scope.addFinalizer(scope, Effect.sync(() => dbConnection.disconnectSync()))

      return Object.assign({}, {
        execute(sql, params, transformRows) {
          return Effect.tryPromise({
            try: async () => {
              // Split on semicolons outside of quotes to support multi‑statement strings
              const statements = sql
                .split(/;(?![^'"]*['"][^'"]*['"])/g)
                .map((s) => s.trim())
                .filter((s) => s.length > 0)

              let rows: Array<Record<string, Primitive>> = []
              for (const statement of statements) {
                const upper = statement.toUpperCase()
                if (upper === "COMMIT" || upper === "ROLLBACK") {
                  // Skip redundant commit / rollback if no active transaction
                  try {
                    await dbConnection.run(statement)
                  } catch {
                    /* ignore */
                  }
                  continue
                }
                const reader = await dbConnection.runAndReadAll(statement)
                rows = reader.getRowObjectsJS().map((row) => {
                  return Object.fromEntries(
                    Object.entries(row).map(([key, value]) => {
                      return [key, JSConverter(value)]
                    })
                  )
                })
              }
              return transformRows ? transformRows(rows) : rows
            },
            catch: (cause) => new SqlError({ cause, message: "Failed to execute statement" })
          })
        },
        executeRaw(sql, params) {
          return Effect.tryPromise({
            try: () =>
              dbConnection
                .runAndReadAll(sql, params as Array<duckdb.DuckDBValue>)
                .then((reader) => reader.getRowsJS()),
            catch: (cause) => new SqlError({ cause, message: "Failed to execute statement" })
          })
        },
        executeValues(sql, params) {
          return Effect.map(
            this.execute(sql, params, undefined),
            (rows) => (rows as Array<Record<string, Primitive>>).map((row) => Object.values(row))
          )
        },
        executeUnprepared(sql, params) {
          return this.execute(sql, params, undefined)
        },
        executeStream(sql, params, transformRows) {
          return Stream.fromEffect(
            this.execute(sql, params, transformRows)
          ).pipe(Stream.map((rows) => Stream.fromIterable(rows)))
        }
      } as Connection)
    })

    const semaphore = yield* Effect.makeSemaphore(1)
    const connection = yield* makeConnection
    const acquirer = semaphore.withPermits(1)(Effect.succeed(connection))

    const transactionAcquirer = Effect.uninterruptibleMask((restore) =>
      Effect.as(
        Effect.zipRight(
          restore(semaphore.take(1)),
          Effect.tap(
            Effect.scope,
            (scope) => Scope.addFinalizer(scope, semaphore.release(1))
          )
        ),
        connection
      )
    )

    return Object.assign(
      (yield* Client.make({
        acquirer,
        transactionAcquirer,
        compiler,
        spanAttributes: [
          ...(options.spanAttributes ? Object.entries(options.spanAttributes) : []),
          [Otel.ATTR_DB_SYSTEM_NAME, "duckdb"]
        ]
      })) as DuckDbClient,
      {
        [TypeId]: TypeId as TypeId,
        config: options,
        array: (_: ReadonlyArray<Primitive>) => DuckDbArray(_)
      }
    )
  })

export const makeCompiler = (
  transform?: (_: string) => string
): Statement.Compiler =>
  Statement.makeCompiler<DuckDbCustom>({
    dialect: "sqlite",
    placeholder: (_) => `$${_}`,
    onIdentifier: transform
      ? (value, withoutTransform) => withoutTransform ? escape(value) : escape(transform(value))
      : escape,
    onCustom(type, placeholder, withoutTransform) {
      switch (type.kind) {
        case "DuckDbArray": {
          const values = type.i0
          if (values.length === 0) {
            return ["[]", []]
          }
          const placeholders = values.map((_, idx) => placeholder(idx + 1)).join(", ")
          return [`[${placeholders}]`, values]
        }
      }
    },
    onRecordUpdate(placeholders, valueAlias, valueColumns, values) {
      return [
        `(values ${placeholders}) AS ${valueAlias}${valueColumns}`,
        values.flat()
      ]
    }
  })

const escape = Statement.defaultEscape("\"")

export const layer = (
  config: DuckDbClientConfig
): Layer.Layer<DuckDbClient | Client.SqlClient, SqlError, Reactivity.Reactivity> =>
  Layer.scopedContext(
    make(config).pipe(
      Effect.map((client) =>
        Context.make(DuckDbClient, client).pipe(
          Context.add(Client.SqlClient, client)
        )
      )
    )
  ).pipe(Layer.provide(Reactivity.layer))
