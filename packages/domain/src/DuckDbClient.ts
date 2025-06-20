import * as duckdb from "@duckdb/node-api"
import * as Reactivity from "@effect/experimental/Reactivity"
import * as Client from "@effect/sql/SqlClient"
import type { Connection, Row } from "@effect/sql/SqlConnection"
import { SqlError } from "@effect/sql/SqlError"
import type { Custom, Primitive } from "@effect/sql/Statement"
import * as Statement from "@effect/sql/Statement"
import * as Otel from "@opentelemetry/semantic-conventions"
import { Duration } from "effect"
import * as Chunk from "effect/Chunk"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Pool from "effect/Pool"
import * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"

// ============================================================================
// Module 1: Type System Foundation
// ============================================================================

namespace DuckDbTypes {
  /**
   * Native value wrapper that preserves DuckDB types through Effect SQL pipeline
   */
  export interface NativeValue<T extends duckdb.DuckDBValue = duckdb.DuckDBValue> {
    readonly _tag: "DuckDbNativeValue"
    readonly value: T
    readonly type: duckdb.DuckDBType
  }

  export const NativeValue = <T extends duckdb.DuckDBValue>(
    value: T,
    type: duckdb.DuckDBType
  ): NativeValue<T> => ({
    _tag: "DuckDbNativeValue",
    value,
    type
  })

  export const isNativeValue = (u: unknown): u is NativeValue =>
    typeof u === "object" && u !== null && "_tag" in u && u._tag === "DuckDbNativeValue"

  // Custom types for Effect SQL integration
  export interface DuckDbArray extends Custom<"DuckDbArray", NativeValue<duckdb.DuckDBArrayValue>> {}
  export interface DuckDbStruct extends Custom<"DuckDbStruct", NativeValue<duckdb.DuckDBStructValue>> {}
  export interface DuckDbDecimal extends Custom<"DuckDbDecimal", NativeValue<duckdb.DuckDBDecimalValue>> {}
  export interface DuckDbUUID extends Custom<"DuckDbUUID", NativeValue<duckdb.DuckDBUUIDValue>> {}

  export type DuckDbCustom = DuckDbArray | DuckDbStruct | DuckDbDecimal | DuckDbUUID
}

// ============================================================================
// Module 2: Value Construction (Pure Effect)
// ============================================================================

namespace DuckDbValues {
  import NativeValue = DuckDbTypes.NativeValue

  /**
   * Create array value with type inference
   */
  export const array = <T extends Primitive>(
    items: ReadonlyArray<T>
  ): Statement.Fragment => {
    const arrayValue = duckdb.arrayValue(items as Array<any>)

    const native = NativeValue(arrayValue, duckdb.ARRAY(duckdb.DuckDBAnyType.create(), items.length))
    return Statement.custom<DuckDbTypes.DuckDbArray>("DuckDbArray")(native)
  }

  /**
   * Create struct value with field type mapping
   */
  export const struct = (
    fields: Record<string, Primitive>
  ): Statement.Fragment => {
    const structValue = duckdb.structValue(fields as any)

    // Build struct type from fields
    const entryTypes: Record<string, duckdb.DuckDBType> = {}
    for (const [key, value] of Object.entries(fields)) {
      entryTypes[key] = (value as unknown as duckdb.DuckDBAnyType).toLogicalType().asType()
    }

    const native = NativeValue(structValue, duckdb.STRUCT(entryTypes))
    return Statement.custom<DuckDbTypes.DuckDbStruct>("DuckDbStruct")(native)
  }

  /**
   * Create decimal value with precision
   */
  export const decimal = (
    value: string | number | bigint,
    width = 18,
    scale = 3
  ): Statement.Fragment => {
    const decimalValue = duckdb.decimalValue(BigInt(value), width, scale)

    const native = NativeValue(decimalValue, duckdb.DECIMAL(width, scale))
    return Statement.custom<DuckDbTypes.DuckDbDecimal>("DuckDbDecimal")(native)
  }

  /**
   * Create UUID value
   */
  export const uuid = (
    value: string | bigint
  ): Statement.Fragment => {
    const uuidValue = duckdb.uuidValue(BigInt(value))

    const native = NativeValue(uuidValue, duckdb.UUID)
    return Statement.custom<DuckDbTypes.DuckDbUUID>("DuckDbUUID")(native)
  }
}

// ============================================================================
// Module 3: Parameter Management (Effect-based)
// ============================================================================

namespace ParameterManager {
  /**
   * Parameter processor that handles both primitives and native values
   */
  export const processParameters = (
    params: ReadonlyArray<any> | undefined
  ): ReadonlyArray<any> => {
    if (!params) return []

    return params.map((param) => {
      if (DuckDbTypes.isNativeValue(param)) {
        return param.value
      }
      return param
    })
  }

  /**
   * Bind parameters with full type awareness
   */
  export const bindParameters = (
    prepared: duckdb.DuckDBPreparedStatement,
    params: ReadonlyArray<any>
  ): void => {
    const paramCount = prepared.parameterCount

    if (params.length !== paramCount) {
      throw new SqlError({
        cause: new Error(`Parameter count mismatch: expected ${paramCount}, got ${params.length}`),
        message: `Parameter count mismatch: expected ${paramCount}, got ${params.length}`
      })
    }

    // Create type array for all parameters
    const types: Array<duckdb.DuckDBType | undefined> = []

    for (let i = 0; i < params.length; i++) {
      const param = params[i]

      if (DuckDbTypes.isNativeValue(param)) {
        types.push(param.type)
      } else {
        // Let DuckDB infer the type
        types.push(undefined)
      }
    }

    // Use DuckDB's object-based binding
    const bindObject: Record<string, any> = {}
    const typeObject: Record<string, duckdb.DuckDBType | undefined> = {}

    for (let i = 0; i < params.length; i++) {
      const key = `$${i + 1}`
      bindObject[key] = params[i]
      typeObject[key] = types[i]
    }

    console.log("BINDING", bindObject, typeObject)
    prepared.bind(params as any)
  }

  /**
   * Validate parameter types against prepared statement
   */
  export const validateParameterTypes = (
    prepared: duckdb.DuckDBPreparedStatement,
    params: ReadonlyArray<any>
  ): void => {
    for (let i = 0; i < params.length; i++) {
      const expectedType = prepared.parameterType(i + 1)
      const param = params[i]

      if (DuckDbTypes.isNativeValue(param)) {
        // Validate type compatibility
        if (!isTypeCompatible(param.type, expectedType)) {
          throw new SqlError({
            cause: new Error(
              `Parameter ${i + 1}: Type mismatch. Expected ${expectedType.toString()}, got ${param.type.toString()}`
            ),
            message: `Parameter ${
              i + 1
            }: Type mismatch. Expected ${expectedType.toString()}, got ${param.type.toString()}`
          })
        }
      }
    }
  }

  const isTypeCompatible = (
    actual: duckdb.DuckDBType,
    expected: duckdb.DuckDBType
  ): boolean => {
    if (actual.typeId === expected.typeId) return true
    if (expected.typeId === duckdb.DuckDBTypeId.ANY) return true

    // Add more compatibility rules as needed
    return false
  }
}

// ============================================================================
// Module 4: Result Processing (DuckDB Native)
// ============================================================================

namespace ResultProcessor {
  /**
   * Process results using DuckDB's native converters
   */
  export const processResults = (
    result: duckdb.DuckDBResult,
    config: { converter?: "JS" | "Json" }
  ): Effect.Effect<ReadonlyArray<Row>, SqlError> =>
    Effect.tryPromise({
      try: async () => {
        const converter = config.converter || "JS"

        // Use DuckDB's native conversion
        if (converter === "JS") {
          // JS converter handles arrays, structs, etc. natively
          return await result.getRowObjectsJS() as ReadonlyArray<Row>
        } else {
          // JSON converter for serializable output
          return await result.getRowObjectsJson() as ReadonlyArray<Row>
        }
      },
      catch: (error) =>
        new SqlError({
          cause: error,
          message: "Failed to process results"
        })
    })

  /**
   * Stream results with chunked processing
   */
  export const streamResults = (
    pendingResult: duckdb.DuckDBPendingResult,
    _config: { chunkSize?: number } = {}
  ): Stream.Stream<ReadonlyArray<Row>, SqlError> => {
    const chunkIterator = async function*() {
      const result = await pendingResult.getResult()
      const columnNames = result.deduplicatedColumnNames()
      while (true) {
        const chunk = await result.fetchChunk()
        if (!chunk || chunk.rowCount === 0) break

        console.log("CHUNK", chunk)
        yield chunk.getRowObjects(columnNames) as ReadonlyArray<Row>
      }
    }

    return Stream.fromAsyncIterable<ReadonlyArray<Row>, SqlError>(
      chunkIterator(),
      (error) => new SqlError({ cause: error, message: "Stream processing failed" })
    )
  }
}

// ============================================================================
// Module 5: Connection Implementation
// ============================================================================

const makeConnection = (
  conn: duckdb.DuckDBConnection,
  config: DuckDbClientConfig
): Connection => ({
  execute(sql, params, transformRows) {
    return Effect.gen(function*() {
      const result = yield* Effect.acquireUseRelease(
        Effect.tryPromise({
          try: () => conn.prepare(sql),
          catch: (error) => new SqlError({ cause: error, message: `Failed to prepare: ${sql}` })
        }),
        (prepared) =>
          Effect.gen(function*() {
            // Process parameters
            const processed = ParameterManager.processParameters(params)

            // Bind parameters
            ParameterManager.bindParameters(prepared, processed)

            // Execute
            const result = yield* Effect.tryPromise({
              try: () => prepared.run(),
              catch: (error) => new SqlError({ cause: error, message: `Execution failed` })
            })

            // Process results
            const rows = yield* ResultProcessor.processResults(result, {
              converter: config.preferJson ? "Json" : "JS"
            })

            // Apply transforms
            return transformRows ? transformRows(rows) : rows
          }),
        (prepared) => Effect.sync(() => prepared.destroySync())
      )

      return result
    })
  },

  executeRaw(sql, params) {
    return Effect.gen(function*() {
      const prepared = yield* Effect.acquireUseRelease(
        Effect.tryPromise({
          try: () => conn.prepare(sql),
          catch: (error) => new SqlError({ cause: error, message: `Failed to prepare: ${sql}` })
        }),
        (prepared) =>
          Effect.gen(function*() {
            const processed = ParameterManager.processParameters(params)
            ParameterManager.bindParameters(prepared, processed)

            const result = yield* Effect.tryPromise({
              try: () => prepared.run(),
              catch: (error) => new SqlError({ cause: error, message: `Execution failed` })
            })

            return result.getRowsJS()
          }),
        (prepared) => Effect.sync(() => prepared.destroySync())
      )

      return prepared
    })
  },

  executeStream(sql, params, transformRows) {
    return Stream.unwrapScoped(
      Effect.gen(function*() {
        const scope = yield* Scope.Scope
        const prepared = yield* Effect.tryPromise({
          try: () => conn.prepare(sql),
          catch: (error) => new SqlError({ cause: error, message: `Failed to prepare: ${sql}` })
        })

        yield* Scope.addFinalizer(scope, Effect.sync(() => prepared.destroySync()))

        const processed = ParameterManager.processParameters(params)
        ParameterManager.bindParameters(prepared, processed)

        const pendingResult = prepared.start()

        const stream = ResultProcessor.streamResults(pendingResult)

        if (transformRows) {
          return Stream.mapChunks(stream, (chunk) =>
            Chunk.unsafeFromArray(
              transformRows(Chunk.toReadonlyArray(chunk))
            ))
        }

        return stream
      })
    )
  },

  executeValues(sql, params) {
    return Effect.map(
      this.execute(sql, params, undefined),
      (rows) => rows.map((row) => Object.values(row))
    )
  },

  executeUnprepared(sql, params, transformRows) {
    return this.execute(sql, params, transformRows)
  }
})

// ============================================================================
// Module 6: Compiler Integration
// ============================================================================

const makeCompiler = (transform?: (_: string) => string): Statement.Compiler =>
  Statement.makeCompiler<DuckDbTypes.DuckDbCustom>({
    dialect: "sqlite",
    placeholder: () => "?",
    onIdentifier: transform
      ? (value, withoutTransform) => withoutTransform ? escape(value) : escape(transform(value))
      : escape,
    onCustom(type, placeholder) {
      switch (type.kind) {
        case "DuckDbArray":
        case "DuckDbStruct":
        case "DuckDbDecimal":
        case "DuckDbUUID":
          // Pass native value through the pipeline
          return [placeholder(undefined), [type.i0.value.toString()]]
      }
    },
    onRecordUpdate(placeholders, valueAlias, valueColumns, values, returning) {
      return [
        returning ? `${placeholders} RETURNING ${returning}` : placeholders,
        values.flat()
      ]
    }
  })

const escape = Statement.defaultEscape("\"")

// ============================================================================
// Module 7: Client Definition
// ============================================================================

export const TypeId: unique symbol = Symbol.for("@effect/sql-duckdb/DuckDbClient")
export type TypeId = typeof TypeId

export interface DuckDbClient extends Client.SqlClient {
  readonly [TypeId]: TypeId
  readonly config: DuckDbClientConfig
  readonly array: <T extends Primitive>(items: ReadonlyArray<T>) => DuckDbTypes.DuckDbArray
  readonly duckdbHelpers: DuckDbHelpers
}

export interface DuckDbClientConfig {
  readonly database?: string
  readonly preferJson?: boolean
  readonly spanAttributes?: Record<string, unknown>
  readonly transformResultNames?: (str: string) => string
  readonly transformQueryNames?: (str: string) => string
}

export interface DuckDbHelpers {
  readonly array: typeof DuckDbValues.array
  readonly struct: typeof DuckDbValues.struct
  readonly decimal: typeof DuckDbValues.decimal
  readonly uuid: typeof DuckDbValues.uuid
  readonly intArray: (items: ReadonlyArray<number>) => Effect.Effect<DuckDbTypes.DuckDbArray, SqlError>
  readonly textArray: (items: ReadonlyArray<string>) => Effect.Effect<DuckDbTypes.DuckDbArray, SqlError>
}

export const DuckDbClient = Context.GenericTag<DuckDbClient>("@effect/sql-duckdb/DuckDbClient")

// ============================================================================
// Module 8: Client Factory
// ============================================================================

export const make = (
  config: DuckDbClientConfig
): Effect.Effect<DuckDbClient, SqlError, Scope.Scope | Reactivity.Reactivity> =>
  Effect.gen(function*() {
    // Create instance
    const instance = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => duckdb.DuckDBInstance.create(config.database ?? ":memory:"),
        catch: (error) => new SqlError({ cause: error, message: "Failed to create instance" })
      }),
      (instance) => Effect.sync(() => instance.closeSync())
    )

    // Create connection pool
    const connectionPool = yield* Pool.makeWithTTL({
      acquire: Effect.tryPromise({
        try: () => instance.connect(),
        catch: (error) => new SqlError({ cause: error, message: "Failed to connect" })
      }),
      min: 1,
      max: 10,
      timeToLive: Duration.minutes(5)
    })

    // Get connection from pool
    const connection = yield* Pool.get(connectionPool)
    const wrappedConnection = makeConnection(connection, config)

    // Create acquirer functions
    const acquirer = Effect.succeed(wrappedConnection)
    const transactionAcquirer = acquirer // Simplified for now

    // Create base SQL client
    const sqlClient = yield* Client.make({
      acquirer,
      transactionAcquirer,
      compiler: makeCompiler(config.transformQueryNames),
      spanAttributes: [
        [Otel.SEMATTRS_DB_SYSTEM, "duckdb"],
        ...(config.spanAttributes ? Object.entries(config.spanAttributes) : [])
      ],
      transformRows: config.transformResultNames
        ? Statement.defaultTransforms(config.transformResultNames).array
        : undefined
    })

    const duckdbHelpers = {
      array: DuckDbValues.array,
      struct: DuckDbValues.struct,
      decimal: DuckDbValues.decimal,
      uuid: DuckDbValues.uuid
    } as DuckDbHelpers

    return Object.assign(sqlClient, {
      [TypeId]: TypeId as TypeId,
      config,
      duckdbHelpers
    }) as DuckDbClient
  })

// ============================================================================
// Module 9: Layer
// ============================================================================

export const layer = (
  config: DuckDbClientConfig
): Layer.Layer<DuckDbClient | Client.SqlClient, SqlError, Reactivity.Reactivity> =>
  Layer.scopedContext(
    Effect.map(
      make(config),
      (client) =>
        Context.make(DuckDbClient, client).pipe(
          Context.add(Client.SqlClient, client)
        )
    )
  ).pipe(Layer.provide(Reactivity.layer))

// ============================================================================
// Usage Example
// ============================================================================

/**
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const sql = yield* DuckDbClient.DuckDbClient
 *
 *   // Basic usage - synchronous array creation
 *   yield* sql`CREATE TABLE users (id INTEGER, tags INTEGER[])`
 *   yield* sql`INSERT INTO users VALUES (${1}, ${sql.array([1, 2, 3])})`
 *
 *   // Advanced usage - Effect-based with validation
 *   const tags = yield* sql.duckdb.intArray([10, 20, 30])
 *   yield* sql`INSERT INTO users VALUES (${2}, ${tags})`
 *
 *   // Structs
 *   const profile = yield* sql.duckdb.struct({
 *     name: "Alice",
 *     age: 30,
 *     active: true
 *   })
 *   yield* sql`INSERT INTO profiles VALUES (${1}, ${profile})`
 *
 *   // Results are automatically converted
 *   const users = yield* sql`SELECT * FROM users`
 *   console.log(users[0].tags) // [1, 2, 3] - native array!
 * })
 * ```
 */
