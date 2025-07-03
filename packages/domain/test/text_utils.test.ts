import { describe, expect, it } from "vitest"
import { generateNGrams, normalize, normalizeAndGenerateNGrams } from "../src/entity_resolution/utils.js"

describe("Text Processing Utilities", () => {
  describe("normalize", () => {
    it("should convert text to lowercase", () => {
      expect(normalize("NIRVANA")).toBe("nirvana")
      expect(normalize("Hello World")).toBe("hello world")
    })

    it("should remove diacritics", () => {
      expect(normalize("José González")).toBe("jose gonzalez")
      expect(normalize("Björk")).toBe("bjork")
      expect(normalize("Sigur Rós")).toBe("sigur ros")
      expect(normalize("Café")).toBe("cafe")
    })

    it("should remove punctuation", () => {
      expect(normalize("smells like teen-spirit")).toBe("smells like teen spirit")
      expect(normalize("hello, world!")).toBe("hello world")
      expect(normalize("rock & roll")).toBe("rock roll")
      expect(normalize("(parentheses)")).toBe("parentheses")
    })

    it("should normalize spacing", () => {
      expect(normalize("hello   world")).toBe("hello world")
      expect(normalize("  leading spaces")).toBe("leading spaces")
      expect(normalize("trailing spaces  ")).toBe("trailing spaces")
      expect(normalize("multiple   spaces   between")).toBe("multiple spaces between")
    })

    it("should handle complex cases with all transformations", () => {
      expect(normalize("JOSÉ's   Café & Bar!!!")).toBe("jose s cafe bar")
      expect(normalize("  Smells Like Teen-Spirit  ")).toBe("smells like teen spirit")
    })

    it("should handle empty strings", () => {
      expect(normalize("")).toBe("")
      expect(normalize("   ")).toBe("")
    })
  })

  describe("generateNGrams", () => {
    it("should handle the edge case of single word", () => {
      const ngrams = generateNGrams("hello")
      expect(ngrams).toEqual(["hello"])
    })

    it("should generate all n-grams for two words", () => {
      const ngrams = generateNGrams("hello world")
      expect(ngrams).toEqual([
        "hello",
        "hello world",
        "world"
      ])
    })

    it("should generate all n-grams for the example case", () => {
      const ngrams = generateNGrams("nirvana smells like teen spirit")
      expect(ngrams).toContain("nirvana")
      expect(ngrams).toContain("nirvana smells")
      expect(ngrams).toContain("nirvana smells like")
      expect(ngrams).toContain("nirvana smells like teen")
      expect(ngrams).toContain("nirvana smells like teen spirit")
      expect(ngrams).toContain("smells")
      expect(ngrams).toContain("smells like")
      expect(ngrams).toContain("smells like teen")
      expect(ngrams).toContain("smells like teen spirit")
      expect(ngrams).toContain("like")
      expect(ngrams).toContain("like teen")
      expect(ngrams).toContain("like teen spirit")
      expect(ngrams).toContain("teen")
      expect(ngrams).toContain("teen spirit")
      expect(ngrams).toContain("spirit")
      expect(ngrams).toHaveLength(15) // 5 + 4 + 3 + 2 + 1
    })

    it("should handle empty strings", () => {
      expect(generateNGrams("")).toEqual([])
    })

    it("should handle strings with extra spaces", () => {
      // Extra spaces are filtered out when splitting
      const ngrams = generateNGrams("hello  world")
      expect(ngrams).toEqual([
        "hello",
        "hello world",
        "world"
      ])
    })
  })

  describe("normalizeAndGenerateNGrams", () => {
    it("should normalize and generate n-grams in one step", () => {
      const ngrams = normalizeAndGenerateNGrams("NIRVANA - Smells Like Teen Spirit!")
      expect(ngrams).toContain("nirvana")
      expect(ngrams).toContain("nirvana smells")
      expect(ngrams).toContain("smells like teen spirit")
      expect(ngrams).not.toContain("NIRVANA")
      expect(ngrams).not.toContain("Teen")
    })

    it("should handle diacritics and punctuation", () => {
      const ngrams = normalizeAndGenerateNGrams("José's Café")
      expect(ngrams).toContain("jose")
      expect(ngrams).toContain("jose s")
      expect(ngrams).toContain("jose s cafe")
      expect(ngrams).toContain("s")
      expect(ngrams).toContain("s cafe")
      expect(ngrams).toContain("cafe")
    })
  })
})
