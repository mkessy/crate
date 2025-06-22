import { BunContext } from "@effect/platform-bun"
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-bun"
import { Layer } from "effect"
import { fileURLToPath } from "node:url"

// Base SQLite client configurations
const ClientLive = SqliteClient.layer({
  filename: "data/kexp_kb.db",
  create: true,
  readwrite: true
})

// Migrator configurations
export const MigratorLive = SqliteMigrator.layer({
  loader: SqliteMigrator.fromFileSystem(
    fileURLToPath(new URL("migrations", import.meta.url))
  ),
  schemaDirectory: fileURLToPath(new URL("migrations", import.meta.url))
}).pipe(Layer.provide(BunContext.layer))

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(ClientLive))
