// packages/server/src/knowledge_base/migrations/0025_create_artist_popularity_view.ts
import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient

  yield* Effect.log("Creating artist_popularity view")

  yield* sql`CREATE VIEW IF NOT EXISTS artist_popularity AS
    SELECT 
      artist_id,
      'crate://artist/' || artist_id as entity_uri,
      COUNT(*) as total_plays,
      SUM(CASE WHEN date(airdate) >= date('now', '-30 days') THEN 1 ELSE 0 END) as recent_plays,
      MAX(airdate) as last_played,
      COUNT(DISTINCT album) as unique_albums,
      COUNT(DISTINCT release_id) as unique_releases,
      -- Use play_year for annual metrics since it's pre-computed
      COUNT(DISTINCT CASE WHEN play_year = CAST(strftime('%Y', 'now') AS INTEGER) THEN fact_play_rowid END) as plays_this_year,
      -- Simple cache score
      CAST(
        (SUM(CASE WHEN date(airdate) >= date('now', '-30 days') THEN 1 ELSE 0 END) * 0.7) + 
        (COUNT(*) * 0.3)
      AS REAL) as cache_score
    FROM artist_fact_plays
    WHERE play_year >= CAST(strftime('%Y', 'now') AS INTEGER) - 2  -- Last 2 years using indexed column
    GROUP BY artist_id
    HAVING COUNT(*) > 0;`
})
