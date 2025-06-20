# DuckDB SQL Client Implementation

## Overview

This implementation provides a DuckDB client for the Effect SQL ecosystem, following established patterns from `@effect/sql-pg` and `@effect/sql-sqlite-node` while leveraging DuckDB Neo's native capabilities.

## Key Design Decisions

### 1. Minimal Custom Types
- Only three custom fragment types: `DuckDbList`, `DuckDbStruct`, `DuckDbJson`
- No wrapper objects - fragments directly contain values
- Leverages DuckDB Neo's automatic type conversion

### 2. Native Parameter Binding
- Uses DuckDB Neo's type-specific binding methods (`bindBoolean`, `bindInteger`, etc.)
- Automatic type inference for primitives
- Special handling for LIST and STRUCT types using `listValue()` and `structValue()`

### 3. Data Flow

**JS → DuckDB:**
```
Primitive/Fragment → Compiler → Parameter Binding → DuckDB Neo API
```

**DuckDB → JS:**
```
DuckDB Result → getRowObjectsJS() → Native JS Objects → Optional Transform
```

### 4. Architecture

```
index.ts          - Public API exports
├── types.ts      - Type definitions
├── fragments.ts  - Fragment constructors (list, struct, json)
├── parameters.ts - Parameter binding logic
├── compiler.ts   - SQL statement compiler
├── connection.ts - Connection implementation
└── client.ts     - Main client with pooling
```

## Usage Examples

### Basic Queries
```ts
const sql = yield* DuckDb.DuckDbClient
yield* sql`SELECT * FROM users WHERE id = ${userId}`
```

### Complex Types
```ts
// LIST type (variable-length arrays)
yield* sql`INSERT INTO products (tags) VALUES (${sql.list(["electronics", "sale"])})`

// STRUCT type (nested objects)
yield* sql`INSERT INTO users (profile) VALUES (${sql.struct({ 
  name: "Alice", 
  verified: true 
})})`

// JSON type
yield* sql`INSERT INTO events (payload) VALUES (${sql.json({ 
  type: "click", 
  timestamp: Date.now() 
})})`
```

### Configuration
```ts
const layer = DuckDb.layer({
  filename: "mydb.duckdb",           // or ":memory:"
  maxConnections: 10,                // connection pool size
  connectionTTL: 300000,             // 5 minutes
  transformResultNames: snakeToCamel, // user_id → userId
  transformQueryNames: camelToSnake   // userId → user_id
})
```

## Implementation Details

### Parameter Binding Strategy
1. Check for null/undefined → `bindNull()`
2. Check for custom fragments → extract and bind with appropriate method
3. Bind primitives based on JavaScript type:
   - `boolean` → `bindBoolean()`
   - `number` → `bindDouble()` (DuckDB handles conversion)
   - `bigint` → `bindBigInt()`
   - `string` → `bindVarchar()`
   - `Date` → `bindTimestamp()` with microsecond conversion
   - `Uint8Array` → `bindBlob()`

### Streaming Support
- Uses DuckDB's chunk-based streaming API
- Converts chunks to Effect Streams
- Supports backpressure and cancellation

### Transaction Management
- Leverages Effect SQL's transaction semantics
- Uses dedicated connections for transaction isolation
- Automatic rollback on errors

## Differences from Current Implementation

1. **Removed `NativeValue` wrapper** - Unnecessary complexity
2. **Simplified parameter processing** - Direct binding instead of type mapping
3. **Proper resource management** - Uses Effect.scoped for prepared statements
4. **Standard fragment pattern** - Follows pg/sqlite examples
5. **Native result conversion** - Uses `getRowObjectsJS()` for automatic type handling

## Testing

Run the test suite:
```bash
npx tsx src/duckdb/test.ts
```

The test demonstrates:
- Basic CRUD operations
- Complex type handling (LIST, STRUCT, JSON)
- Transactions
- Streaming large datasets
- Type-safe queries

## Future Enhancements

1. **Appender API** - High-performance bulk inserts
2. **COPY support** - Import/export CSV, Parquet files
3. **Extension management** - Load DuckDB extensions
4. **Spatial types** - Support for DuckDB's spatial extension
5. **UNION type** - Currently unsupported by DuckDB Neo
