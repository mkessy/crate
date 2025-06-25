import { BunRuntime } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"
import { MusicKBSqlLive, SqlLive } from "./Sql.js"

const runMigrations = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`SELECT 1`)
})

const runMigrations2 = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`SELECT 1`)
})

runMigrations.pipe(
  Effect.provide(SqlLive),
  BunRuntime.runMain
)

runMigrations2.pipe(
  Effect.provide(MusicKBSqlLive),
  BunRuntime.runMain
)
