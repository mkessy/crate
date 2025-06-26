import { Effect, Console, Option } from "effect"
import { FactPlaysService } from "./fact_plays/index.js"

// Example usage of the FactPlaysService
const program = Effect.gen(function*() {
  const factPlaysService = yield* FactPlaysService

  // Example 1: Get a specific play by ID
  yield* Console.log("=== Example 1: Get play by ID ===")
  const singlePlay = yield* factPlaysService.getPlayById(1 as any) // Cast to PlayId
  yield* Console.log("Single play:", Option.isSome(singlePlay) ? singlePlay.value : "Not found")

  // Example 2: Get plays by artist with pagination
  yield* Console.log("\n=== Example 2: Get plays by artist ===")
  const artistPlays = yield* factPlaysService.getPlaysByArtist("Nirvana", { limit: 10, offset: 0 })
  yield* Console.log(`Found ${artistPlays.length} plays for Nirvana`)

  // Example 3: Get plays within a date range
  yield* Console.log("\n=== Example 3: Get plays by date range ===")
  const datePlays = yield* factPlaysService.getPlaysByDateRange(
    { start_date: "2024-01-01", end_date: "2024-01-31" },
    { limit: 20, offset: 0 }
  )
  yield* Console.log(`Found ${datePlays.length} plays in January 2024`)

  // Example 4: Get local plays
  yield* Console.log("\n=== Example 4: Get local plays ===")
  const localPlays = yield* factPlaysService.getLocalPlays(true, { limit: 5, offset: 0 })
  yield* Console.log(`Found ${localPlays.length} local plays`)
  
  // Example 5: Get recent plays
  yield* Console.log("\n=== Example 5: Get recent plays ===")
  const recentPlays = yield* factPlaysService.getRecentPlays(5)
  yield* Console.log(`Most recent ${recentPlays.length} plays:`)
  for (const play of recentPlays) {
    yield* Console.log(`  - ${play.artist} - ${play.song} (${play.airdate})`)
  }

  // Example 6: Search plays
  yield* Console.log("\n=== Example 6: Search plays ===")
  const searchResults = yield* factPlaysService.searchPlays("jazz", { limit: 10, offset: 0 })
  yield* Console.log(`Found ${searchResults.length} plays matching 'jazz'`)

  // Example 7: Get plays with MB data (joins)
  yield* Console.log("\n=== Example 7: Get plays with MB enrichment ===")
  const enrichedPlays = yield* factPlaysService.getPlaysWithMBData({ limit: 5, offset: 0 })
  yield* Console.log(`Found ${enrichedPlays.length} enriched plays`)
  for (const play of enrichedPlays) {
    yield* Console.log(`  - KEXP: ${play.artist} | MB: ${play.mb_artist_name || "N/A"}`)
  }

  // Example 8: Get artist plays with related entities
  yield* Console.log("\n=== Example 8: Get artist plays with related entities ===")
  const artistRelatedPlays = yield* factPlaysService.getArtistPlaysWithRelatedEntities(
    "The Beatles",
    { limit: 10, offset: 0 }
  )
  yield* Console.log(`Found ${artistRelatedPlays.length} plays with related entities for The Beatles`)
})

// Run the program
const runnable = program.pipe(
  Effect.provide(FactPlaysService.Default),
  Effect.tapError((error) => Console.error("Error:", error))
)

// Execute
Effect.runPromise(runnable).catch(console.error)
