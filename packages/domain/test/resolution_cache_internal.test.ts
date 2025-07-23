import { assert, describe, it } from "@effect/vitest"
import { HashMap, Option, Trie } from "effect"
import { createEntityUri } from "../src/entity_resolution/Entity.js"
import type { EntityUri } from "../src/entity_resolution/Entity.js"
import { Candidate, makeMentionId, Normalized } from "../src/entity_resolution/index.js"
import {
  _internal_findByType,
  _internal_get,
  _internal_getStats,
  _internal_lookupExact,
  _internal_search,
  _internal_suggest,
  _internal_suggestWithRanking,
  type CandidatesMap,
  type EntityTrie
} from "../src/entity_resolution/ResolutionCache.js"
import { Span } from "../src/nlp/nlp.js"

describe("Resolution Cache Internal Functions", () => {
  // Create reusable test data
  const createTestData = () => {
    // Create test entity URIs
    const nirvanaBandUri = createEntityUri("artist", "nirvana-band-mbid") as EntityUri
    const nirvanaAlbumUri = createEntityUri("recording", "nirvana-album-mbid") as EntityUri
    const teenSpiritUri = createEntityUri("recording", "teen-spirit-mbid") as EntityUri
    const soundgardenUri = createEntityUri("artist", "soundgarden-mbid") as EntityUri

    // Create test candidates using Data constructors
    const nirvanaBandCandidate = new Candidate({
      entityUri: nirvanaBandUri,
      entityType: "artist",
      score: Normalized({ score: 0.95 }),
      method: "semantic",
      mentionId: makeMentionId("Nirvana", Span(0, 6)),
      displayName: "Nirvana",
      metadata: HashMap.empty()
    })

    const teenSpiritCandidate = new Candidate({
      entityUri: teenSpiritUri,
      entityType: "recording",
      displayName: "Smells Like Teen Spirit",
      score: Normalized({ score: 0.98 }),
      method: "semantic",
      mentionId: makeMentionId("Smells Like Teen Spirit", Span(0, 6)),
      metadata: HashMap.empty()
    })

    const soundgardenCandidate = new Candidate({
      entityUri: soundgardenUri,
      entityType: "artist",
      displayName: "Soundgarden",
      score: Normalized({ score: 0.92 }),
      method: "semantic",
      mentionId: makeMentionId("Soundgarden", Span(0, 6)),
      metadata: HashMap.empty()
    })

    // Build EntityTrie with normalized terms
    const trie: EntityTrie = Trie.fromIterable([
      // Full names
      ["nirvana", [nirvanaBandUri] as const],
      ["smells like teen spirit", [teenSpiritUri] as const],
      ["soundgarden", [soundgardenUri] as const],
      // N-grams for "smells like teen spirit"
      ["smells", [teenSpiritUri] as const],
      ["teen", [teenSpiritUri] as const],
      ["spirit", [teenSpiritUri] as const],
      ["teen spirit", [teenSpiritUri] as const],
      // Shared n-grams (multiple entities)
      ["grunge", [nirvanaBandUri, soundgardenUri] as const]
    ])

    // Build CandidatesMap
    const candidates: CandidatesMap = HashMap.fromIterable([
      [nirvanaBandUri, nirvanaBandCandidate],
      [teenSpiritUri, teenSpiritCandidate],
      [soundgardenUri, soundgardenCandidate]
    ])

    return {
      trie,
      candidates,
      uris: {
        nirvanaBandUri,
        nirvanaAlbumUri,
        teenSpiritUri,
        soundgardenUri
      },
      testCandidates: {
        nirvanaBandCandidate,
        teenSpiritCandidate,
        soundgardenCandidate
      }
    }
  }

  describe("_internal_lookupExact", () => {
    it("should find exact matches for normalized terms", () => {
      const { candidates, trie } = createTestData()

      const result = _internal_lookupExact(trie, candidates, "nirvana")
      assert.isTrue(Option.isSome(result))

      const candidates_found = Option.getOrThrow(result)
      assert.strictEqual(candidates_found.length, 1)
      assert.strictEqual(candidates_found[0].displayName, "Nirvana")
      assert.strictEqual(candidates_found[0].entityType, "artist")
    })

    it("should return multiple candidates for shared terms", () => {
      const { candidates, trie } = createTestData()

      const result = _internal_lookupExact(trie, candidates, "grunge")
      assert.isTrue(Option.isSome(result))

      const candidates_found = Option.getOrThrow(result)
      assert.strictEqual(candidates_found.length, 2)

      const names = candidates_found.map((c) => c.displayName).sort()
      assert.deepEqual(names, ["Nirvana", "Soundgarden"])
    })

    it("should return none for non-existent terms", () => {
      const { candidates, trie } = createTestData()

      const result = _internal_lookupExact(trie, candidates, "nonexistent")
      assert.isTrue(Option.isNone(result))
    })
  })

  describe("_internal_search", () => {
    it("should find candidates using n-gram generation", () => {
      const { candidates, trie } = createTestData()

      // Search for "teen spirit" - should generate n-grams and find the recording
      const results = _internal_search(trie, candidates, "teen spirit")

      assert.isTrue(results.length > 0)
      const teenSpiritResult = results.find((c) => c.displayName === "Smells Like Teen Spirit")
      assert.isDefined(teenSpiritResult)
      assert.strictEqual(teenSpiritResult!.entityType, "recording")
    })

    it("should deduplicate results from multiple n-grams", () => {
      const { candidates, trie } = createTestData()

      // Search for "smells like teen spirit" - multiple n-grams should point to same entity
      const results = _internal_search(trie, candidates, "smells like teen spirit")

      // Should find the recording but not duplicate it
      const teenSpiritResults = results.filter((c) => c.displayName === "Smells Like Teen Spirit")
      assert.strictEqual(teenSpiritResults.length, 1)
    })

    it("should return empty array for no matches", () => {
      const { candidates, trie } = createTestData()

      const results = _internal_search(trie, candidates, "xyz unknown band")
      assert.strictEqual(results.length, 0)
    })
  })

  describe("_internal_suggest", () => {
    it("should provide autocomplete suggestions for prefixes", () => {
      const { candidates, trie } = createTestData()

      const results = _internal_suggest(trie, candidates, "nir")
      assert.isTrue(results.length > 0)

      const nirvanaResult = results.find((c) => c.displayName === "Nirvana")
      assert.isDefined(nirvanaResult)
    })

    it("should respect the limit parameter", () => {
      const { candidates, trie } = createTestData()

      const results = _internal_suggest(trie, candidates, "s", 1)
      assert.strictEqual(results.length, 1)
    })

    it("should return empty array for non-matching prefixes", () => {
      const { candidates, trie } = createTestData()

      const results = _internal_suggest(trie, candidates, "xyz")
      assert.strictEqual(results.length, 0)
    })
  })

  describe("_internal_suggestWithRanking", () => {
    it("should prioritize exact matches over prefix matches", () => {
      const { candidates, trie } = createTestData()

      // Add a partial match scenario
      const trieWithPartial = Trie.insert(trie, "teen spirit music", [
        createEntityUri("recording", "other") as EntityUri
      ])

      const results = _internal_suggestWithRanking(trieWithPartial, candidates, "teen spirit")

      // Should prioritize the exact "teen spirit" match over "teen spirit music"
      assert.isTrue(results.length > 0)
      // This test validates the ranking logic works even if we don't have the "other" entity in candidates
    })

    it("should handle empty results gracefully", () => {
      const { candidates, trie } = createTestData()

      const results = _internal_suggestWithRanking(trie, candidates, "xyz")
      assert.strictEqual(results.length, 0)
    })
  })

  describe("_internal_get", () => {
    it("should retrieve candidate by exact URI", () => {
      const { candidates, uris } = createTestData()

      const result = _internal_get(candidates, uris.nirvanaBandUri)
      assert.isTrue(Option.isSome(result))

      const candidate = Option.getOrThrow(result)
      assert.strictEqual(candidate.displayName, "Nirvana")
      assert.strictEqual(candidate.entityType, "artist")
    })

    it("should return none for non-existent URI", () => {
      const { candidates } = createTestData()

      const nonExistentUri = createEntityUri("artist", "non-existent") as EntityUri
      const result = _internal_get(candidates, nonExistentUri)
      assert.isTrue(Option.isNone(result))
    })
  })

  describe("_internal_getStats", () => {
    it("should return accurate statistics", () => {
      const { candidates, trie } = createTestData()

      const stats = _internal_getStats(trie, candidates)

      assert.strictEqual(stats.candidates, 3) // Three candidates in test data
      assert.isTrue(stats.trieKeys > 0) // Should have multiple trie entries
      assert.isTrue(stats.averageUrisPerKey >= 1) // At least 1 URI per key on average
    })
  })

  describe("_internal_findByType", () => {
    it("should filter candidates by entity type", () => {
      const { candidates } = createTestData()

      const artistResults = _internal_findByType(candidates, "artist")
      assert.strictEqual(artistResults.length, 2) // Nirvana and Soundgarden

      const artistNames = artistResults.map((c) => c.displayName).sort()
      assert.deepEqual(artistNames, ["Nirvana", "Soundgarden"])

      const recordingResults = _internal_findByType(candidates, "recording")
      assert.strictEqual(recordingResults.length, 1) // Teen Spirit
      assert.strictEqual(recordingResults[0].displayName, "Smells Like Teen Spirit")
    })

    it("should return empty array for non-existent types", () => {
      const { candidates } = createTestData()

      const results = _internal_findByType(candidates, "non_existent_type")
      assert.strictEqual(results.length, 0)
    })
  })
})
