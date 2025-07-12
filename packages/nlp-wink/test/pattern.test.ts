import { Nlp } from "@crate/domain"
import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import { inspectPatterns } from "../src/pattern.js"
import * as Wink from "../src/Wink.js"

describe("Corrected Patterns V2 - Final Verification", () => {
  // Log pattern details for debugging
  console.log("\n=== PATTERN INSPECTION ===")
  inspectPatterns()

  const testPatterns = (text: string) =>
    Effect.gen(function*() {
      const nlp = yield* Nlp.Nlp
      const doc = yield* nlp.processText(text)
      const entities = yield* nlp.extractEntities(doc)

      // Log for debugging
      console.log(`\nText: "${text}"`)
      console.log("Entities:", entities.map((e) => `${e.text} (${e.pattern})`))

      return entities
    }).pipe(Effect.provide(Wink.Default))

  describe("Tokenization Tests", () => {
    it("should correctly match hyphenated genres", () =>
      Effect.gen(function*() {
        // Test both hyphenated forms
        const entities1 = yield* testPatterns("I love hip-hop music")
        const hipHop = entities1.find((e) => e.pattern === "GENRE" && e.text === "hip-hop")
        expect(hipHop).toBeDefined()

        const entities2 = yield* testPatterns("She plays r&b and soul")
        const rnb = entities2.find((e) => e.pattern === "GENRE" && e.text === "r&b")
        expect(rnb).toBeDefined()
      }).pipe(Effect.runPromise))

    it("should correctly match punctuated attributions", () =>
      Effect.gen(function*() {
        const entities = yield* testPatterns("A song feat. Drake")
        const feat = entities.find((e) => e.pattern === "ATTRIBUTION" && e.text === "feat.")
        expect(feat).toBeDefined()
      }).pipe(Effect.runPromise))
  })

  describe("Single Token Patterns", () => {
    it("should match all single-token vocabularies", () =>
      Effect.gen(function*() {
        const text = "The vocalist, drummer, and guitarist played rock, jazz, and electronic music"
        const entities = yield* testPatterns(text)

        const roles = entities.filter((e) => e.pattern === "ROLE")
        expect(roles.length).toBe(3)

        const genres = entities.filter((e) => e.pattern === "GENRE")
        expect(genres.length).toBe(3)
      }).pipe(Effect.runPromise))
  })

  describe("Multi-Token Patterns", () => {
    it("should match multi-word attribution phrases", () =>
      Effect.gen(function*() {
        const entities = yield* testPatterns("A track produced by Kanye West, written by Drake")

        const attributions = entities.filter((e) => e.pattern === "ATTRIBUTION")
        expect(attributions.some((a) => a.text.includes("produced by"))).toBe(true)
        expect(attributions.some((a) => a.text.includes("written by"))).toBe(true)
      }).pipe(Effect.runPromise))

    it("should match multi-token roles", () =>
      Effect.gen(function*() {
        const entities = yield* testPatterns("She's a singer-songwriter from Nashville")

        const roles = entities.filter((e) => e.pattern === "ROLE")
        expect(roles.some((r) => r.text === "singer-songwriter")).toBe(true)
      }).pipe(Effect.runPromise))
  })

  describe("Combined Patterns", () => {
    it("should match recording patterns", () =>
      Effect.gen(function*() {
        const text = "Their debut album \"OK Computer\" and new single \"Karma Police\""
        const entities = yield* testPatterns(text)

        const recordings = entities.filter((e) => e.pattern === "RECORDING")
        expect(recordings.length).toBeGreaterThan(0)
        expect(recordings.some((r) => r.text.includes("debut album"))).toBe(true)
        expect(recordings.some((r) => r.text.includes("single") && r.text.includes("\""))).toBe(true)
      }).pipe(Effect.runPromise))

    it("should match artist patterns", () =>
      Effect.gen(function*() {
        const text = "DJ Shadow, vocalist Taylor Swift, and Dr. Dre performed"
        const entities = yield* testPatterns(text)

        const artists = entities.filter((e) => e.pattern === "ARTIST")
        expect(artists.length).toBeGreaterThan(0)
      }).pipe(Effect.runPromise))

    it("should match modified genres", () =>
      Effect.gen(function*() {
        const text = "They play post-punk and neo-soul with some dark ambient"
        const entities = yield* testPatterns(text)

        const modifiedGenres = entities.filter((e) => e.pattern === "GENRE_MODIFIED")
        expect(modifiedGenres.length).toBeGreaterThan(0)
      }).pipe(Effect.runPromise))
  })

  describe("Real-World Examples", () => {
    it("should handle KEXP radio commentary", () =>
      Effect.gen(function*() {
        const text = "That was a hip-hop track produced by Dr. Dre featuring Eminem from their debut album"
        const entities = yield* testPatterns(text)

        expect(entities.length).toBeGreaterThan(0)

        console.log("Entities:", entities.map((e) => `${e.text} (${e.pattern})`))

        // Check we found the key entities
        const hasGenre = entities.some((e) => e.pattern === "GENRE")
        const hasAttribution = entities.some((e) => e.pattern === "ATTRIBUTION")
        const hasRecording = entities.some((e) => e.pattern === "RECORDING")
        const hasArtist = entities.some((e) => e.pattern === "ARTIST")

        expect(hasGenre).toBe(true)
        expect(hasAttribution).toBe(true)
        expect(hasRecording).toBe(true)
        expect(hasArtist).toBe(true)
      }).pipe(Effect.runPromise))

    it("should handle music journalism", () =>
      Effect.gen(function*() {
        const text =
          "The singer-songwriter's latest album \"Blue\" was produced by Mitchell Froom, featuring guitarist Marc Ribot"
        const entities = yield* testPatterns(text)

        expect(entities.length).toBeGreaterThan(0)

        // Verify key extractions
        const hasRole = entities.some((e) => e.pattern === "ROLE")
        const hasRecording = entities.some((e) => e.pattern === "RECORDING")
        const hasAttribution = entities.some((e) => e.pattern === "ATTRIBUTION")

        expect(hasRole).toBe(true)
        expect(hasRecording).toBe(true)
        expect(hasAttribution).toBe(true)
      }).pipe(Effect.runPromise))
  })
})
