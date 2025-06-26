import { BunRuntime } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"
import { MusicKBSqlLive } from "./Sql.js"

const runMigrations = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`SELECT 1`)
})

runMigrations.pipe(Effect.provide(MusicKBSqlLive), BunRuntime.runMain)
