import { Reactivity } from "@effect/experimental"
import { BunContext } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-bun"
import { Effect, Layer } from "effect"
import { fileURLToPath } from "node:url"
import { DomainConfig } from "./config/DomainConfig.js"

/**
 * Creates a SQLite client layer using configuration from DomainConfig.
 * This layer depends on DomainConfig to get the database path.
 */
const MusicKBClientLive = Layer.effect(
  SqlClient.SqlClient,
  Effect.gen(function*() {
    const config = yield* DomainConfig
    const dbSettings = yield* config.getDatabaseSettings
    yield* Effect.log(dbSettings)

    return yield* SqliteClient.make({
      filename: dbSettings.path,
      create: true,
      readwrite: true
    })
  })
)

export const MusicKBMigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(
    fileURLToPath(new URL("knowledge_base/migrations", import.meta.url))
  ),
  schemaDirectory: fileURLToPath(new URL("knowledge_base/migrations", import.meta.url))
}).pipe(Layer.provide(BunContext.layer))

export const MusicKBSqlLive = MusicKBMigratorLive.pipe(
  Layer.provideMerge(MusicKBClientLive),
  Layer.provide(Reactivity.layer)
)
