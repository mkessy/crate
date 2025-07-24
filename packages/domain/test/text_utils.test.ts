import { describe, expect, it } from "vitest"
import { normalize } from "../src/entity_resolution/utils.js"

describe.skip("Text Processing Utilities", () => {
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
})
