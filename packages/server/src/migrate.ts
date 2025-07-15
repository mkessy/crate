import { BunContext, BunRuntime } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"
import { DomainConfigLive } from "./config/DomainConfig.js"
import { MusicKBMigratorLive, MusicKBSqlLive } from "./sql/Sql.js"

const runMigrations = Effect.scoped(
  Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    yield* sql.unsafe(`SELECT 1`)
  }).pipe(
    Effect.provide(MusicKBMigratorLive),
    Effect.provide(DomainConfigLive),
    Effect.provide(BunContext.layer),
    Effect.provide(MusicKBSqlLive)
  )
)

runMigrations.pipe(BunRuntime.runMain)
