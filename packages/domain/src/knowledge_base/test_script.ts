import { SqlClient, SqlSchema } from "@effect/sql"
import { Effect, Schema } from "effect"
import { FactPlays } from "../data/schemas/fact-tables.js"
import { MusicKBSqlLive } from "../Sql.js"
import * as MusicBrainzService from "./repo/entities.js"
import { ArtistMBEntityMaster } from "./repo/schemas.js"

const p = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const selectOne = SqlSchema.single({
    Request: Schema.String,
    Result: ArtistMBEntityMaster,
    execute: (request) => sql`SELECT * FROM mb_master_lookup WHERE artist_mb_id = ${request} LIMIT 1`
  })

  const selectOnePlay = SqlSchema.single({
    Request: Schema.String,
    Result: FactPlays,
    execute: (request) => sql`SELECT * FROM fact_plays WHERE id = ${request} LIMIT 1`
  })

  const result = yield* selectOne("82799747-1c25-4df6-92e1-6803e330b7f7")
  yield* Effect.log(result)

  const result2 = yield* selectOnePlay("1185851")
  yield* Effect.log(result2.show)
}).pipe(Effect.provide(MusicKBSqlLive))

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

export const exampleUsage = Effect.gen(function*() {
  const mb = yield* MusicBrainzService.MusicBrainzService

  // B1.2: Get all recordings for Bruce Springsteen using template literal DSL
  // TypeScript will enforce the correct template literal format!
  const recordings = yield* mb.artistEntity(
    "artist:70248960-cb53-4ea4-943a-edb18f7d336f entity:recording"
  )
  yield* Effect.logInfo(`Found ${recordings.length} recordings`)

  // B1.3: Get all vocal performances using template literal DSL
  const vocals = yield* mb.artistRelation(
    "artist:70248960-cb53-4ea4-943a-edb18f7d336f relation:vocal"
  )
  yield* Effect.logInfo(`Found ${vocals.length} vocal performances`)

  // B1.4: Get all instrument recordings using template literal DSL
  const instruments = yield* mb.artistEntityRelation(
    "artist:70248960-cb53-4ea4-943a-edb18f7d336f entity:recording relation:instrument"
  )
  yield* Effect.logInfo(`Found ${instruments.length} instrument performances`)

  // B2.1: Discover artists on a recording using template literal DSL
  const artists = yield* mb.entityDiscovery(
    "entity:d27fdd10-e1df-4208-8e2e-62187866246f type:recording"
  )
  yield* Effect.logInfo(`Found ${artists.length} artists on recording`)

  return {
    recordings: recordings.length,
    vocals: vocals.length,
    instruments: instruments.length,
    artists: artists.length
  }
}).pipe(Effect.provide(MusicBrainzService.MusicBrainzService.Default))

// =============================================================================
// SIMPLE TEST & EXAMPLES
// =============================================================================

// Basic test you can run to validate the approach
export const testTemplateLiteralParsing = Effect.gen(function*() {
  // Test the parsing without SQL - just validate the DSL works
  yield* Effect.logInfo("Testing template literal parsing...")

  // Test artist + entity query parsing
  const artistEntityResult = yield* Schema.decodeUnknown(MusicBrainzService.ArtistEntityQuerySchema)(
    "artist:70248960-cb53-4ea4-943a-edb18f7d336f entity:recording"
  )
  yield* Effect.logInfo(`Parsed artist+entity: ${JSON.stringify(artistEntityResult)}`)

  // Test artist + relation query parsing
  const artistRelationResult = yield* Schema.decodeUnknown(MusicBrainzService.ArtistRelationQuerySchema)(
    "artist:70248960-cb53-4ea4-943a-edb18f7d336f relation:vocal"
  )
  yield* Effect.logInfo(`Parsed artist+relation: ${JSON.stringify(artistRelationResult)}`)

  // Test full query parsing
  const fullQueryResult = yield* Schema.decodeUnknown(MusicBrainzService.ArtistEntityRelationQuerySchema)(
    "artist:70248960-cb53-4ea4-943a-edb18f7d336f entity:recording relation:instrument"
  )
  yield* Effect.logInfo(`Parsed full query: ${JSON.stringify(fullQueryResult)}`)

  return { success: true }
}).pipe(Effect.provide(MusicBrainzService.MusicBrainzService.Default))

// Type-safe query examples - users get compile-time errors for malformed queries!
export const typeSafeQueryExamples = {
  // ✅ These will compile (correct format)
  validArtistEntity: "artist:70248960-cb53-4ea4-943a-edb18f7d336f entity:recording",
  validArtistRelation: "artist:70248960-cb53-4ea4-943a-edb18f7d336f relation:vocal",
  // ❌ These would cause TypeScript compile errors (wrong format)
  invalidQuery1: "artist:abc entity:xyz", // Wrong entity type
  invalidQuery2: "wrong:format", // Wrong structure
  invalidQuery3: "artist: entity:recording" // Missing artist ID
}

// Quick tests you can run
export const runParsingTest = () => testTemplateLiteralParsing.pipe(Effect.runPromise)
export const runExampleUsage = () => exampleUsage.pipe(Effect.runPromise)

runParsingTest()
runExampleUsage()
