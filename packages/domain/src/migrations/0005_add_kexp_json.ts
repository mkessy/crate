import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) =>
    Effect.all([
      Effect.logInfo("Adding kexp_json column to fact_plays"),

      sql`ALTER TABLE fact_plays ADD COLUMN kexp_json JSON`,

      Effect.logInfo("Added kexp_json column to fact_plays")
    ])
)
