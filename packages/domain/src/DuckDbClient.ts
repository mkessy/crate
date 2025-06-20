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
  // Custom types for Effect SQL integration - simplified to just hold the value
  export interface DuckDbList extends Custom<"DuckDbList", ReadonlyArray<Primitive>, void, void> {}
  export interface DuckDbFixedArray extends Custom<"DuckDbFixedArray", ReadonlyArray<Primitive>, void, void> {}
  export interface DuckDbStruct extends Custom<"DuckDbStruct", Record<string, Primitive>, void, void> {}
  export interface DuckDbDecimal
    extends Custom<"DuckDbDecimal", { value: bigint; width: number; scale: number }, void, void>
  {}
  export interface DuckDbUUID extends Custom<"DuckDbUUID", bigint, void, void> {}

  // Backward compatibility alias
  export interface DuckDbArray extends DuckDbList {}

  export type DuckDbCustom = DuckDbList | DuckDbFixedArray | DuckDbStruct | DuckDbDecimal | DuckDbUUID | DuckDbArray
}

// ============================================================================
// Module 2: Value Construction (Pure Effect)
// ============================================================================

namespace DuckDbValues {
  /**
   * Create list value for variable-length LIST type
   */
  export const list = <T extends Primitive>(
    items: ReadonlyArray<T>
  ): Statement.Fragment => {
    return Statement.custom<DuckDbTypes.DuckDbList>("DuckDbList")(items, void 0, void 0)
  }

  /**
   * Create fixed-size array value for ARRAY type
   */
  export const fixedArray = <T extends Primitive>(
    items: ReadonlyArray<T>
  ): Statement.Fragment => {
    return Statement.custom<DuckDbTypes.DuckDbFixedArray>("DuckDbFixedArray")(items, void 0, void 0)
  }

  /**
   * Create array value for LIST type (backward compatibility)
   * @deprecated Use list() for variable-length lists or fixedArray() for fixed-size arrays
   */
  export const array = <T extends Primitive>(
    items: ReadonlyArray<T>
  ): Statement.Fragment => {
    return Statement.custom<DuckDbTypes.DuckDbList>("DuckDbList")(items, void 0, void 0)
  }

  /**
   * Create struct value with field type mapping
   */
  export const struct = (
    fields: Record<string, Primitive>
  ): Statement.Fragment => {
    return Statement.custom<DuckDbTypes.DuckDbStruct>("DuckDbStruct")(fields, void 0, void 0)
  }

  /**
   * Create decimal value with precision - uses native DuckDB decimal handling
   */
  export const decimal = (
    value: number | bigint,
    width = 18,
    scale = 3
  ): Statement.Fragment => {
    // Use the appropriate native DuckDB method based on input type
    let duckdbValue: duckdb.DuckDBDecimalValue
    if (typeof value === "bigint") {
      // For bigint, assume it's already scaled (user provides scaled value)
      duckdbValue = new duckdb.DuckDBDecimalValue(value, width, scale)
    } else {
      // For number, use the native fromDouble method
      duckdbValue = duckdb.DuckDBDecimalValue.fromDouble(value, width, scale)
    }

    return Statement.custom<DuckDbTypes.DuckDbDecimal>("DuckDbDecimal")(
      { value: duckdbValue.value, width: duckdbValue.width, scale: duckdbValue.scale },
      void 0,
      void 0
    )
  }

  /**
   * Create UUID value - only accepts 128-bit BigInt as per DuckDB native API
   * For string UUIDs, user must convert to BigInt manually to avoid data loss
   */
  export const uuid = (
    uint128: bigint
  ): Statement.Fragment => {
    return Statement.custom<DuckDbTypes.DuckDbUUID>("DuckDbUUID")(uint128, void 0, void 0)
  }
}

// ============================================================================
// Module 3: Parameter Management (Effect-based)
// ============================================================================

namespace ParameterManager {
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

    // Bind each parameter individually with proper type handling
    for (let i = 0; i < params.length; i++) {
      const paramIndex = i + 1 // DuckDB uses 1-based indexing
      const param = params[i]

      bindParameter(prepared, paramIndex, param)
    }
  }

  /**
   * Bind a single parameter with type-specific method
   */
  const bindParameter = (
    prepared: duckdb.DuckDBPreparedStatement,
    index: number,
    value: any
  ): void => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      prepared.bindNull(index)
      return
    }

    // Handle DuckDB special values first
    if (value instanceof duckdb.DuckDBArrayValue) {
      prepared.bindArray(index, value)
      return
    }

    if (value instanceof duckdb.DuckDBListValue) {
      prepared.bindList(index, value)
      return
    }

    if (value instanceof duckdb.DuckDBStructValue) {
      prepared.bindStruct(index, value)
      return
    }

    if (value instanceof duckdb.DuckDBDecimalValue) {
      prepared.bindDecimal(index, value)
      return
    }

    if (value instanceof duckdb.DuckDBUUIDValue) {
      prepared.bindUUID(index, value)
      return
    }

    // Handle primitives
    if (typeof value === "boolean") {
      prepared.bindBoolean(index, value)
    } else if (typeof value === "number") {
      if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) {
        prepared.bindInteger(index, value)
      } else {
        prepared.bindDouble(index, value)
      }
    } else if (typeof value === "bigint") {
      prepared.bindBigInt(index, value)
    } else if (typeof value === "string") {
      prepared.bindVarchar(index, value)
    } else if (value instanceof Date) {
      // Convert Date to timestamp microseconds
      const micros = BigInt(value.getTime()) * 1000n
      prepared.bindTimestamp(index, duckdb.timestampValue(micros))
    } else if (value instanceof Uint8Array) {
      prepared.bindBlob(index, value)
    } else if (value instanceof Int8Array) {
      prepared.bindBlob(index, new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    } else if (Array.isArray(value)) {
      // Direct array binding
      prepared.bindList(index, duckdb.listValue(value))
    } else {
      // Fallback: treat as JSON
      prepared.bindVarchar(index, JSON.stringify(value))
    }
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
    config: { converter?: "JS" | "Json"; convertBigInt?: boolean }
  ): Effect.Effect<ReadonlyArray<Row>, SqlError> =>
    Effect.tryPromise({
      try: async () => {
        const converter = config.converter || "JS"

        // Use DuckDB's native conversion
        let rows: ReadonlyArray<Row>
        if (converter === "JS") {
          rows = await result.getRowObjectsJS() as ReadonlyArray<Row>
        } else {
          rows = await result.getRowObjectsJson() as ReadonlyArray<Row>
        }

        // Convert BigInt to number for aggregate functions if needed
        if (config.convertBigInt !== false) {
          return rows.map((row) => {
            const converted: any = {}
            for (const [key, value] of Object.entries(row)) {
              if (typeof value === "bigint" && value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER) {
                converted[key] = Number(value)
              } else {
                converted[key] = value
              }
            }
            return converted
          })
        }

        return rows
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
    pendingResult: duckdb.DuckDBPendingResult
  ): Stream.Stream<Row, SqlError> => {
    const chunkIterator = async function*() {
      const result = await pendingResult.getResult()
      const columnNames = result.deduplicatedColumnNames()

      while (true) {
        const chunk = await result.fetchChunk()
        if (!chunk || chunk.rowCount === 0) break

        const rows = chunk.getRowObjects(columnNames) as ReadonlyArray<Row>

        for (const row of rows) {
          yield row
        }
      }
    }

    return Stream.fromAsyncIterable<Row, SqlError>(
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
            // Bind parameters directly - they're already processed by the compiler
            if (params && params.length > 0) {
              ParameterManager.bindParameters(prepared, params)
            }

            // Execute
            const result = yield* Effect.tryPromise({
              try: () => prepared.run(),
              catch: (error) => new SqlError({ cause: error, message: `Execution failed` })
            })

            // Process results
            const rows = yield* ResultProcessor.processResults(result, {
              converter: config.preferJson ? "Json" : "JS",
              convertBigInt: config.convertBigInt ?? false
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
            if (params && params.length > 0) {
              ParameterManager.bindParameters(prepared, params)
            }

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

        if (params && params.length > 0) {
          ParameterManager.bindParameters(prepared, params)
        }

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
      // Extract the actual value from the custom type
      switch (type.kind) {
        case "DuckDbList": {
          // Convert array to DuckDB LIST value
          const listValue = duckdb.listValue(type.i0 as Array<any>)
          return [placeholder(listValue), [listValue]]
        }
        case "DuckDbFixedArray": {
          // Convert array to DuckDB ARRAY value
          const arrayValue = duckdb.arrayValue(type.i0 as Array<any>)
          return [placeholder(arrayValue), [arrayValue]]
        }
        // Backward compatibility
        case "DuckDbArray": {
          // Convert array to DuckDB LIST value (for backward compatibility)
          const listValue = duckdb.listValue(type.i0 as Array<any>)
          return [placeholder(listValue), [listValue]]
        }
        case "DuckDbStruct": {
          // Convert object to DuckDB STRUCT value
          const structValue = duckdb.structValue(type.i0 as any)
          return [placeholder(structValue), [structValue]]
        }
        case "DuckDbDecimal": {
          const { scale, value, width } = type.i0
          const decimalValue = duckdb.decimalValue(value, width, scale)
          return [placeholder(decimalValue), [decimalValue]]
        }
        case "DuckDbUUID": {
          const uuidValue = duckdb.uuidValue(type.i0)
          return [placeholder(uuidValue), [uuidValue]]
        }
        default:
          throw new Error(`Unknown custom type: ${(type as any).kind}`)
      }
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
  readonly duckdbHelpers: DuckDbHelpers
}

export interface DuckDbClientConfig {
  readonly database?: string
  readonly preferJson?: boolean
  readonly convertBigInt?: boolean
  readonly chunkSize?: number
  readonly spanAttributes?: Record<string, unknown>
  readonly transformResultNames?: (str: string) => string
  readonly transformQueryNames?: (str: string) => string
}

export interface DuckDbHelpers {
  readonly list: typeof DuckDbValues.list
  readonly fixedArray: typeof DuckDbValues.fixedArray
  readonly array: typeof DuckDbValues.array // backward compatibility
  readonly struct: typeof DuckDbValues.struct
  readonly decimal: typeof DuckDbValues.decimal
  readonly uuid: typeof DuckDbValues.uuid
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

    // Create acquirer functions
    const acquirer = Effect.map(
      Pool.get(connectionPool),
      (conn) => makeConnection(conn, config)
    )

    // Create base SQL client
    const sqlClient = yield* Client.make({
      acquirer,
      transactionAcquirer: acquirer,
      compiler: makeCompiler(config.transformQueryNames),
      spanAttributes: [
        [Otel.SEMATTRS_DB_SYSTEM, "duckdb"],
        ...(config.spanAttributes ? Object.entries(config.spanAttributes) : [])
      ],
      transformRows: config.transformResultNames
        ? Statement.defaultTransforms(config.transformResultNames).array
        : undefined
    })

    const duckdbHelpers: DuckDbHelpers = {
      list: DuckDbValues.list,
      fixedArray: DuckDbValues.fixedArray,
      array: DuckDbValues.array, // backward compatibility
      struct: DuckDbValues.struct,
      decimal: DuckDbValues.decimal,
      uuid: DuckDbValues.uuid
    }

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
