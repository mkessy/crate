import { Nlp } from "@crate/domain"
import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import * as Wink from "../src/Wink.js"

describe("Pattern Fix Verification", () => {
  const testPatterns = (text: string) =>
    Effect.gen(function*() {
      const nlp = yield* Nlp.Nlp
      const doc = yield* nlp.processText(text)
      const entities = yield* nlp.extractEntities(doc)
      return entities
    }).pipe(Effect.provide(Wink.Default))

  it("should extract artists from attribution phrases", () =>
    Effect.gen(function*() {
      const entities = yield* testPatterns("produced by Dr. Dre featuring Eminem")

      // Check if we have both attribution and artist entities
      const hasArtist = entities.some((e) => e.pattern === "ARTIST")

      expect(hasArtist).toBe(true)
    }).pipe(Effect.runPromise))

  it("should match hip-hop as GENRE", () =>
    Effect.gen(function*() {
      const entities = yield* testPatterns("I love hip-hop music")

      const hasHipHop = entities.some((e) => e.pattern === "GENRE" && e.text === "hip-hop")

      expect(hasHipHop).toBe(true)
    }).pipe(Effect.runPromise))
})
