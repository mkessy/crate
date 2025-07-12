/**
 * Corrected pattern definitions for wink-nlp custom entities
 *
 * Key Rules:
 * 1. [option1|option2] syntax ONLY works for single tokens
 * 2. Multi-word phrases must be written as explicit sequences
 * 3. Hyphenated words tokenize with spaces: "hip-hop" → "hip - hop"
 * 4. Special punctuation tokenizes separately: "feat." → "feat ."
 */

// === SINGLE-TOKEN VOCABULARIES ===
// These can be used in [option1|option2] bracket syntax

export const ROLE_SINGLE_TOKENS = [
  "vocalist",
  "singer",
  "drummer",
  "guitarist",
  "bassist",
  "keyboardist",
  "pianist",
  "producer",
  "remixer",
  "dj",
  "composer",
  "arranger",
  "conductor",
  "engineer",
  "songwriter",
  "frontman",
  "bandleader",
  "beatmaker",
  "mc",
  "rapper"
]

export const RELEASE_TYPE_SINGLE_TOKENS = [
  "album",
  "ep",
  "lp",
  "single",
  "record",
  "track",
  "song",
  "mixtape",
  "compilation",
  "soundtrack",
  "demo",
  "release"
]

export const STATUS_SINGLE_TOKENS = [
  "debut",
  "sophomore",
  "latest",
  "new",
  "upcoming",
  "forthcoming",
  "recent",
  "first",
  "second",
  "third",
  "fourth",
  "fifth"
]

export const GENRE_SINGLE_TOKENS = [
  "rock",
  "pop",
  "jazz",
  "blues",
  "folk",
  "punk",
  "metal",
  "electronic",
  "techno",
  "house",
  "ambient",
  "classical",
  "rap",
  "soul",
  "funk",
  "reggae",
  "ska",
  "country",
  "indie",
  "alternative",
  "experimental"
]

export const ATTRIBUTION_SINGLE_TOKENS = [
  "featuring",
  "feat",
  "ft",
  "with",
  "presents"
]

export const GENRE_MODIFIER_SINGLE_TOKENS = [
  "post",
  "neo",
  "nu",
  "new",
  "alt",
  "avant",
  "proto",
  "synth",
  "dream",
  "noise",
  "dark",
  "death",
  "doom",
  "psychedelic",
  "progressive"
]

// === MULTI-TOKEN PATTERNS ===
// These must be written as explicit sequences, not in brackets

export const GENRE_MULTI_TOKENS = [
  "hip - hop", // from "hip-hop"
  "r & b", // from "r&b"
  "drum and bass", // three words
  "trip - hop", // from "trip-hop"
  "lo - fi", // from "lo-fi"
  "nu - metal", // from "nu-metal"
  "synth - pop" // from "synth-pop"
]

export const ATTRIBUTION_MULTI_TOKENS = [
  "produced by",
  "remixed by",
  "written by",
  "composed by",
  "arranged by",
  "mixed by",
  "a collaboration with",
  "a new project from",
  "a new project by"
]

export const ROLE_MULTI_TOKENS = [
  "singer - songwriter", // from "singer-songwriter"
  "multi - instrumentalist", // from "multi-instrumentalist"
  "session musician"
]

// === PATTERN BUILDERS ===

/**
 * Creates a bracket pattern from single-token options
 */
const bracket = (tokens: Array<string>): string => `[${tokens.join("|")}]`

/**
 * Combines parts with spaces
 */
const seq = (...parts: Array<string>): string => parts.join(" ")

// === COMPOSED PATTERNS ===

const buildPatterns = () => {
  const ROLE_BRACKET = bracket(ROLE_SINGLE_TOKENS)
  const TYPE_BRACKET = bracket(RELEASE_TYPE_SINGLE_TOKENS)
  const STATUS_BRACKET = bracket(STATUS_SINGLE_TOKENS)
  const GENRE_BRACKET = bracket(GENRE_SINGLE_TOKENS)
  const ATTR_BRACKET = bracket(ATTRIBUTION_SINGLE_TOKENS)
  const MOD_BRACKET = bracket(GENRE_MODIFIER_SINGLE_TOKENS)

  return {
    // Basic vocabulary patterns
    ROLE: {
      name: "ROLE",
      patterns: [
        ...ROLE_SINGLE_TOKENS,
        ...ROLE_MULTI_TOKENS
      ]
    },

    RELEASE_TYPE: {
      name: "RELEASE_TYPE",
      patterns: RELEASE_TYPE_SINGLE_TOKENS
    },

    STATUS: {
      name: "STATUS",
      patterns: STATUS_SINGLE_TOKENS
    },

    GENRE: {
      name: "GENRE",
      patterns: [
        ...GENRE_SINGLE_TOKENS,
        ...GENRE_MULTI_TOKENS
      ]
    },

    // Attribution patterns
    ATTRIBUTION: {
      name: "ATTRIBUTION",
      patterns: [
        // Single tokens
        ...ATTRIBUTION_SINGLE_TOKENS,
        // Multi-token phrases
        ...ATTRIBUTION_MULTI_TOKENS,
        // With punctuation variants
        "feat .",
        "ft .",
        // Combined with POS tags
        seq(ATTR_BRACKET, "[PROPN]"),
        seq(ATTR_BRACKET, "[PROPN]", "[PROPN]"),
        ...ATTRIBUTION_MULTI_TOKENS.map((attr) => seq(attr, "[PROPN]")),
        ...ATTRIBUTION_MULTI_TOKENS.map((attr) => seq(attr, "[PROPN]", "[PROPN]"))
      ]
    },

    // Recording patterns
    RECORDING: {
      name: "RECORDING",
      patterns: [
        // Type only
        TYPE_BRACKET,
        // Status + type
        seq(STATUS_BRACKET, TYPE_BRACKET),
        // Type + quoted (various lengths)
        seq(TYPE_BRACKET, "\"", "ANY", "\""),
        seq(TYPE_BRACKET, "\"", "ANY", "ANY", "\""),
        seq(TYPE_BRACKET, "\"", "ANY", "ANY", "ANY", "\""),
        seq(TYPE_BRACKET, "\"", "ANY", "ANY", "ANY", "ANY", "\""),
        // Single quotes
        seq(TYPE_BRACKET, "'", "ANY", "'"),
        seq(TYPE_BRACKET, "'", "ANY", "ANY", "'"),
        // Status + type + quoted
        seq(STATUS_BRACKET, TYPE_BRACKET, "\"", "ANY", "\""),
        seq(STATUS_BRACKET, TYPE_BRACKET, "\"", "ANY", "ANY", "\""),
        // Possessive patterns
        seq("[PROPN]", "'s", STATUS_BRACKET, TYPE_BRACKET),
        seq("[PROPN]", "[PROPN]", "'s", STATUS_BRACKET, TYPE_BRACKET),
        // The + type patterns
        seq("[DET]", STATUS_BRACKET, TYPE_BRACKET),
        seq("[DET]", TYPE_BRACKET)
      ]
    },

    // Artist patterns
    ARTIST: {
      name: "ARTIST",
      patterns: [
        // Just proper nouns
        "[PROPN]",
        "[PROPN] [PROPN]",
        "[PROPN] [PROPN] [PROPN]",
        // The + band name
        "[DET] [PROPN]",
        "[DET] [PROPN] [PROPN]",
        // Role + name
        seq(ROLE_BRACKET, "[PROPN]"),
        seq(ROLE_BRACKET, "[PROPN]", "[PROPN]"),
        // Name + role (with comma)
        seq("[PROPN]", ",", ROLE_BRACKET),
        seq("[PROPN]", "[PROPN]", ",", ROLE_BRACKET),
        // Titles
        seq("DJ", "[PROPN]"),
        seq("MC", "[PROPN]"),
        seq("Dr", ".", "[PROPN]") // Note: period as separate token
      ]
    },

    // Modified genre patterns
    GENRE_MODIFIED: {
      name: "GENRE_MODIFIED",
      patterns: [
        // Modifier + genre
        seq(MOD_BRACKET, GENRE_BRACKET),
        // Modifier + hyphen + genre (for compound genres)
        seq(MOD_BRACKET, "-", GENRE_BRACKET),
        // Geographic + genre
        seq("[PROPN]", GENRE_BRACKET),
        // Era + genre
        seq("[CARDINAL]", "s", GENRE_BRACKET), // "80s rock"
        seq("'", "[CARDINAL]", "s", GENRE_BRACKET) // "'90s hip-hop"
      ]
    }
  }
}

// === EXPORT PATTERNS ===

const patterns = buildPatterns()

/**
 * Get patterns in wink-nlp format
 */
export const getWinkPatterns = () => {
  return Object.values(patterns).map(({ name, patterns }) => ({
    name,
    patterns
  }))
}

/**
 * Named exports for direct access
 */
export const COMPOSED_PATTERNS = getWinkPatterns()

/**
 * Debug helper
 */
export const inspectPatterns = () => {
  console.log("=== MUSIC NLP PATTERNS ===\n")

  Object.entries(patterns).forEach(([key, { name, patterns }]) => {
    console.log(`${key} (${patterns.length} patterns):`)

    // Show first 5 examples
    patterns.slice(0, 5).forEach((p) => {
      console.log(`  - "${p}"`)
    })

    if (patterns.length > 5) {
      console.log(`  ... and ${patterns.length - 5} more\n`)
    } else {
      console.log()
    }
  })

  // Show tokenization examples
  console.log("TOKENIZATION REMINDERS:")
  console.log("  \"hip-hop\" → \"hip - hop\"")
  console.log("  \"r&b\" → \"r & b\"")
  console.log("  \"feat.\" → \"feat .\"")
  console.log("  \"Dr. Dre\" → \"Dr . Dre\"")
}
