import { Nlp } from "@crate/domain"
import { Effect } from "effect"
import { describe, expect, it } from "vitest"
import * as Wink from "../src/Wink.js"

describe("Wink NLP Service", () => {
  const testText = "Nirvana released Nevermind in 1991. Kurt Cobain was the lead singer."

  describe("Core Functionality", () => {
    it("should create service with default config", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        expect(nlp.processText).toBeInstanceOf(Function)
        expect(nlp.extractTokens).toBeInstanceOf(Function)
        expect(nlp.extractEntities).toBeInstanceOf(Function)
      }).pipe(Effect.provide(Wink.Default), Effect.runPromise))

    it("should process text and extract tokens", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const doc = yield* nlp.processText(testText)
        const tokens = yield* nlp.extractTokens(doc)

        expect(tokens.length).toBeGreaterThan(0)
        expect(tokens[0]).toBeInstanceOf(Nlp.Token)
        expect(tokens[0].text).toBe("Nirvana")
        expect(tokens[0].start).toBe(0)
      }).pipe(Effect.provide(Wink.Default), Effect.runPromise))

    it("should process text and extract entities", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const doc = yield* nlp.processText(testText)
        const entities = yield* nlp.extractEntities(doc)
        console.log(entities)

        expect(entities.length).toBeGreaterThan(0)
        expect(entities.some((e) => e.text.includes("Nirvana") || e.text.includes("Kurt"))).toBe(true)
      }).pipe(
        Effect.provide(Wink.Make({
          includeCustomEntities: true,
          customEntities: [
            { name: "NIRVANA", patterns: ["Nirvana"] },
            { name: "KURT_COBAIN", patterns: ["Kurt Cobain"] }
          ]
        })),
        Effect.runPromise
      ))
  })

  describe("Configuration", () => {
    it("should work with custom entities disabled", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const doc = yield* nlp.processText(testText)
        const entities = yield* nlp.extractEntities(doc)

        expect(Array.isArray(entities)).toBe(true)
      }).pipe(
        Effect.provide(Wink.Make({ includeCustomEntities: false, customEntities: [] })),
        Effect.runPromise
      ))

    it("should work with custom entities enabled", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const doc = yield* nlp.processText(testText)
        const entities = yield* nlp.extractEntities(doc)

        expect(entities.length).toBeGreaterThan(0)
      }).pipe(
        Effect.provide(Wink.Make({
          includeCustomEntities: true,
          customEntities: [
            { name: "NIRVANA", patterns: ["Nirvana"] },
            { name: "KURT_COBAIN", patterns: ["Kurt Cobain"] }
          ]
        })),
        Effect.runPromise
      ))
  })

  describe("Performance", () => {
    it("should handle empty input efficiently", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const doc = yield* nlp.processText("")
        const tokens = yield* nlp.extractTokens(doc)
        const entities = yield* nlp.extractEntities(doc)

        expect(tokens).toEqual([])
        expect(entities).toEqual([])
      }).pipe(Effect.provide(Wink.Default), Effect.runPromise))

    it("should process multiple texts efficiently", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const texts = [
          "The Beatles released Abbey Road.",
          "Led Zeppelin played rock music.",
          "Pink Floyd created progressive music."
        ]

        const results = yield* Effect.forEach(texts, (text) =>
          Effect.gen(function*() {
            const doc = yield* nlp.processText(text)
            const tokens = yield* nlp.extractTokens(doc)
            return tokens.length
          }))

        expect(results.every((count) => count > 0)).toBe(true)
      }).pipe(Effect.provide(Wink.Default), Effect.runPromise))
  })
})
