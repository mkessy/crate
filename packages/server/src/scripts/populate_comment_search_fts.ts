import { BunRuntime } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { Effect, Layer } from "effect"
import { MusicKBSqlLive } from "../../../server/src/sql/Sql.js"
import { DomainConfigLive } from "../config/DomainConfig.js"

const query = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Populating comment search fts")

  yield* sql`INSERT INTO comment_search_fts(chunk_id, chunk_text, search_text)
SELECT chunk_id, chunk_text, search_text
FROM comments
WHERE search_text IS NOT NULL AND search_text != '';`

  yield* Effect.log("Done populating comment search fts")
})

query.pipe(
  Effect.provide(MusicKBSqlLive),
  Effect.provide(DomainConfigLive),
  Effect.provide(Layer.scope),
  BunRuntime.runMain
)
