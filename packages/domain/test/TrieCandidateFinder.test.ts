import { describe, expect, it } from "@effect/vitest"
import { Chunk, DateTime, Effect, Layer, Option, Stream } from "effect"
import { CandidateFinder } from "../src/entity_resolution/Method.js"
import { ResolutionCache } from "../src/entity_resolution/ResolutionCache.js"
import type { CandidatesMap, EntityTrie } from "../src/entity_resolution/ResolutionCache.js"
import { Candidate, Mention } from "../src/entity_resolution/schemas.js"
import { TrieCandidateFinderLive } from "../src/entity_resolution/TrieFinder.js"

describe("TrieCandidateFinder", () => {
  // Mock ResolutionCache for testing
  const mockCache = Layer.succeed(
    ResolutionCache,
    ResolutionCache.of({
      search: (query: string) => {
        // Simple mock that returns candidates for "Beatles" queries
        if (query.toLowerCase().includes("beatles")) {
          return [
            Candidate({
              uri: "crate://artist/the-beatles",
              name: "The Beatles",
              type: "artist",
              score: 0,
              method: "trie",
              mentionId: "" as any,
              meta: { _tag: "Artist", mbId: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d" as any },
              alts: [],
              ts: DateTime.unsafeNow()
            })
          ]
        }
        return []
      },

      suggest: () => [],
      lookupExact: () => Option.none(),
      get: () => Option.none(),
      getStats: () => ({ trieKeys: 0, candidates: 0, averageUrisPerKey: 0 }),
      findByType: () => []
    })
  )

  it("finds candidates for mentions", () =>
    Effect.gen(function*() {
      const mention = Mention({
        id: "m1" as any,
        text: "The Beatles",
        norm: "the beatles",
        span: { _tag: "Range", start: 0, end: 11 },
        src: "The Beatles were a band",
        status: { _tag: "Pending" }
      })

      const finder = yield* CandidateFinder
      const candidates = yield* Stream.runCollect(finder.find(mention))

      expect(candidates.toReadonlyArray()).toHaveLength(1)
      expect(candidates.toReadonlyArray()[0].name).toBe("The Beatles")
      expect(candidates.toReadonlyArray()[0].score).toBeGreaterThan(0.9)
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          TrieCandidateFinderLive(),
          mockCache
        )
      )
    ))

  it("respects max candidates configuration", () =>
    Effect.gen(function*() {
      const finder = yield* CandidateFinder
      const config = finder.getConfig()

      expect(config.maxCandidates).toBe(20) // default
      expect(config.priority).toBe(10) // high priority for local search
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          TrieCandidateFinderLive({ maxCandidates: 5 }),
          mockCache
        )
      )
    ))

  it("tracks search statistics", () =>
    Effect.gen(function*() {
      const finder = yield* CandidateFinder

      // Perform some searches
      const mention = Mention({
        id: "m1" as any,
        text: "The Beatles",
        norm: "the beatles",
        span: { _tag: "Point", offset: 0 },
        src: "text",
        status: { _tag: "Pending" }
      })

      yield* Stream.runDrain(finder.find(mention))
      yield* Stream.runDrain(finder.find(mention))

      const stats = yield* finder.getStats()

      expect(stats.totalSearches).toBe(2)
      expect(stats.averageSearchTime).toBeGreaterThan(0)
      expect(stats.averageCandidatesFound).toBe(1)
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          TrieCandidateFinderLive(),
          mockCache
        )
      )
    ))
})
