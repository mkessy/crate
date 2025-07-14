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

    it("should extract from a paragraph", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const text =
          `It’s almost impossible to talk about the renewed interest in Japanese music in the West without invoking the YouTube algorithm. The meteoric rise of city pop, as well as the ambient music that’s come to be known as environmental music, seems propelled by its musical merit and the allure of its imagery in equal parts. The striking photo of Mariya Takeuchi by Alan Levenson adorning the upload of “Plastic Love”—effectively the official anthem of city pop, with 56 million views and counting—has inspired fanart and cosplay. (The song itself has been covered in a number of different languages, and has recently even appeared in a Calvin Klein ad campaign.) The most beloved environmental music, similarly, seems to trade on an image of mindfulness and mystique; check the comments of any popular video and you’ll see tons of messages about singing trees and aligned chakras. But what about the music not so easily filed under an “aesthetic”? An unfathomable amount of Japanese music will fall through the cracks, simply because it lacks the unspoken qualities that make some things go viral.`
        const doc = yield* nlp.processText(text)
        const entities = yield* nlp.extractEntities(doc)
        console.log("entities paragraph", entities)
      }).pipe(Effect.provide(Wink.Default), Effect.runPromise))

    it("should extract from a paragraph", () =>
      Effect.gen(function*() {
        const nlp = yield* Nlp.Nlp
        const text =
          `Heisei No Oto’s mission statement of “left-field pop” is an intentionally vague descriptor, housing samplings of dance, new age, electronic music, and more under its umbrella. Rather than zero in on a niche sound, such as Light in the Attic’s city pop or environmental music compilations, it casts a wide net that broadly surveys Japan’s pop music landscape of 1989 to 1996. It’s the sort of big picture thinking that makes sense for a couple of record store owners with keen eyes for what moves through the circulatory system of their shops. Songs by artists now known the world over, like Haruomi Hosono and Toshifumi Hinata, sit alongside names you’re less likely to recognize, presented with the same acclaim. Heisei No Oto explores an inflection point in Japanese pop music where changes in technology brought changes in sound. The production of music on CD ramped up around the same time that synthesizers were getting cheaper and easier to experiment with—not only for artists working in the mainstream, but also the ones on the fringes.

The tracks that veer furthest to the left of field feel like the star players; “Yeelen” by Love, Peace & Trance—Haruomi Hosono’s excellent 1995 foray into hippie mysticism—is a cavernously wide-open ode to inner peace with a spoken monologue guiding you through a meditation. “Phlanged Vortex” by Friends of Earth and Interior alum Eiki Nonaka is another blissful highlight, with soft percussion, whistles simulating bird song, and smooth tenor saxophone played by the inimitable Yasuaki Shimizu. Even the less offbeat tracks, like pop star Yosui Inoue’s “Pi Po Pa,” follow the underlying theme—its brisk, funky bassline puts it in the camp of easy listening, but the kalimba melody and misty synth washes throughout make it just a little bit weird.

Fumihiro Murakami’s “Miko”—a deluge of synth twinkles, whooshes, and waves—was hand-selected by Haruomi Hosono for inclusion on 1995’s École, a compilation of amateur artists. The track would appear again on Strange Flowers Vol. 1 for Daisyworld Discs in 2003—a label Hosono created strictly for music that he likes. Kina Tomoko’s “INK,” one of the strongest standouts, puts her distinctive singing against a backdrop of traditional percussion and electronics that evokes the past while facing the future. Her vocal style developed from the folk songs that she heard as a young girl—she performed at some of the most popular minyo clubs in Okinawa at the age of 15, and would eventually join Champloose, one of Okinawa’s most famous bands. Yasuaki Shimizu wrote and produced the track, and ubiquitous songwriter Kenzo Saeki penned the lyrics. Heisei No Oto represents a passing of the guard, featuring several tracks in which established musicians offer their talents to fledgling artists, but leave them plenty of space to flourish.

There’s nothing here as immaculately polished as Hiroshi Sato’s sparkling pop diamond “Say Goodbye” or as transcendentally peaceful as Hiroshi Yoshimura’s “Blink.” The new technology, new ideas, and newfound ambition of the CD age coalesced into an experimental spirit that can be identified, but not so clearly defined. That resistance to being easily sorted into playlist-friendly vibes is probably why these songs aren’t likely to show up in your YouTube recommendations. Rather than a mood, Heisei No Oto builds a narrative—one that tells the story of a rapidly changing Japan, and of acceleration to new frontiers. The rough edges are on full display, but gratifying to look at closely.`
        const doc = yield* nlp.processText(text)
        const entities = yield* nlp.extractEntities(doc)
        console.log("entities paragraph", entities)
      }).pipe(Effect.provide(Wink.Default), Effect.runPromise))
  })
})
