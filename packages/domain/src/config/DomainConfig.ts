import { Config, Context, Effect, Layer } from "effect"
import * as path from "node:path"

/**
 * Domain configuration service for managing application settings.
 * This service provides configuration values needed by domain services,
 * particularly database paths and other runtime settings.
 */
export class DomainConfig extends Context.Tag("DomainConfig")<
  DomainConfig,
  {
    readonly getDatabasePath: Effect.Effect<string>
    readonly getDatabaseSettings: Effect.Effect<{
      readonly path: string
      readonly enableWAL: boolean
    }>
  }
>() {}

// Configuration schema for database settings
const databaseConfigSchema = Config.all({
  path: Config.string("CRATE_DB_PATH").pipe(
    Config.withDefault(path.join(process.cwd(), "data", "music_kb.sqlite"))
  ),
  enableWAL: Config.boolean("CRATE_DB_ENABLE_WAL").pipe(
    Config.withDefault(true)
  )
})

// Configuration schema for the entire domain
const domainConfigSchema = Config.all({
  database: databaseConfigSchema
})

/**
 * Live implementation of DomainConfig that reads from environment variables
 * with sensible defaults.
 *
 * Environment variables:
 * - CRATE_DB_PATH: Absolute path to the SQLite database file
 * - CRATE_DB_ENABLE_WAL: Whether to enable Write-Ahead Logging (default: true)
 */
export const DomainConfigLive = Layer.effect(
  DomainConfig,
  Effect.gen(function*() {
    const config = yield* domainConfigSchema

    return DomainConfig.of({
      getDatabasePath: Effect.succeed(config.database.path),
      getDatabaseSettings: Effect.succeed(config.database)
    })
  })
)

/**
 * Test implementation of DomainConfig with predefined values.
 * Useful for testing without relying on environment variables.
 */
export const DomainConfigTest = Layer.succeed(
  DomainConfig,
  DomainConfig.of({
    getDatabasePath: Effect.succeed(":memory:"),
    getDatabaseSettings: Effect.succeed({
      path: ":memory:",
      enableWAL: false
    })
  })
)

/**
 * Factory function to create a custom DomainConfig layer with specific values.
 * Useful for tests or specific runtime configurations.
 */
export const makeDomainConfig = (settings: {
  databasePath: string
  enableWAL?: boolean
}) =>
  Layer.succeed(
    DomainConfig,
    DomainConfig.of({
      getDatabasePath: Effect.succeed(settings.databasePath),
      getDatabaseSettings: Effect.succeed({
        path: settings.databasePath,
        enableWAL: settings.enableWAL ?? true
      })
    })
  )
