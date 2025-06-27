import { BunRuntime } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"
import { DomainConfigLive } from "./config/DomainConfig.js"
import { MusicKBSqlLive } from "./Sql.js"

const runMigrations = Effect.scoped(
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    yield* sql.unsafe(`SELECT 1`)
  }).pipe(Effect.provide(MusicKBSqlLive), Effect.provide(DomainConfigLive))
)

runMigrations.pipe(BunRuntime.runMain)
