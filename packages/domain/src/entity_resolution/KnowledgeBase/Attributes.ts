import { Attribute, AttributeId } from "../../rdf/index.js"

// Helper function to create attribute IDs
const attributeId = (id: string): ReturnType<typeof AttributeId.make> => AttributeId.make(`mb-attr:${id}`)

// ============================================================================
// PERFORMANCE ATTRIBUTES
// ============================================================================

/**
 * Additional performance attribute
 * @since 1.0.0
 */
export const additional = Attribute.make({
  id: attributeId("additional"),
  name: "additional",
  description: "This attribute describes if a particular role was considered normal or additional."
})

/**
 * Guest performance attribute
 * @since 1.0.0
 */
export const guest = Attribute.make({
  id: attributeId("guest"),
  name: "guest",
  description: "This attribute indicates a 'guest' performance where the performer is not usually part of the band."
})

/**
 * Solo performance attribute
 * @since 1.0.0
 */
export const solo = Attribute.make({
  id: attributeId("solo"),
  name: "solo",
  description:
    "This should be used when an artist is credited in liner notes or a similar source as performing a solo part."
})

/**
 * Live performance attribute
 * @since 1.0.0
 */
export const live = Attribute.make({
  id: attributeId("live"),
  name: "live",
  description: "This indicates that the recording is of a live performance."
})

/**
 * Cover version attribute
 * @since 1.0.0
 */
export const cover = Attribute.make({
  id: attributeId("cover"),
  name: "cover",
  description: "Indicates that one entity is a cover of another entity."
})

/**
 * Instrumental attribute
 * @since 1.0.0
 */
export const instrumental = Attribute.make({
  id: attributeId("instrumental"),
  name: "instrumental",
  description: "For works that have lyrics, this indicates that those lyrics are not relevant to this recording."
})

/**
 * A cappella attribute
 * @since 1.0.0
 */
export const acappella = Attribute.make({
  id: attributeId("acappella"),
  name: "a cappella",
  description:
    "For works that usually have instruments and vocals, this indicates that the instrumental parts are not relevant to this recording."
})

/**
 * Partial performance attribute
 * @since 1.0.0
 */
export const partial = Attribute.make({
  id: attributeId("partial"),
  name: "partial",
  description: "This indicates that the recording is not of the entire work, such as excerpts from, conclusion of, etc."
})

/**
 * Demo version attribute
 * @since 1.0.0
 */
export const demo = Attribute.make({
  id: attributeId("demo"),
  name: "demo",
  description: "This indicates that the recording is of a demo version."
})

/**
 * Karaoke attribute
 * @since 1.0.0
 */
export const karaoke = Attribute.make({
  id: attributeId("karaoke"),
  name: "karaoke",
  description: "This indicates that this is a karaoke recording of the work."
})

/**
 * Medley attribute
 * @since 1.0.0
 */
export const medley = Attribute.make({
  id: attributeId("medley"),
  name: "medley",
  description: "This indicates that the recording is of a medley, of which the work is one part."
})

// ============================================================================
// PRODUCTION ATTRIBUTES
// ============================================================================

/**
 * Assistant attribute
 * @since 1.0.0
 */
export const assistant = Attribute.make({
  id: attributeId("assistant"),
  name: "assistant",
  description:
    "This typically indicates someone who is either a first-timer, or less experienced, and who is working under the direction of someone who is more experienced."
})

/**
 * Associate attribute
 * @since 1.0.0
 */
export const associate = Attribute.make({
  id: attributeId("associate"),
  name: "associate",
  description:
    "This typically indicates someone who is less experienced and who is working under the direction of someone who is more experienced."
})

/**
 * Co- prefix attribute
 * @since 1.0.0
 */
export const co = Attribute.make({
  id: attributeId("co"),
  name: "co",
  description:
    "Use this only for cases when someone is credited as co-[role] (co-producer, co-engineer, etc.) - which generally has a specific meaning that depends on the specific activity but is different from just 'there were several people collaborating'."
})

/**
 * Executive attribute
 * @since 1.0.0
 */
export const executive = Attribute.make({
  id: attributeId("executive"),
  name: "executive",
  description: "This attribute is to be used if the role was fulfilled in an executive capacity."
})

/**
 * Pre-mastering attribute
 * @since 1.0.0
 */
export const pre = Attribute.make({
  id: attributeId("pre"),
  name: "pre",
  description: "Use this to indicate that the mastering relationship is specifically for a pre-master."
})

/**
 * Remastering attribute
 * @since 1.0.0
 */
export const re = Attribute.make({
  id: attributeId("re"),
  name: "re",
  description: "Use this to indicate that the mastering relationship is specifically for a remaster."
})

// ============================================================================
// VOCAL ATTRIBUTES
// ============================================================================

/**
 * Lead vocals attribute
 * @since 1.0.0
 */
export const leadVocals = Attribute.make({
  id: attributeId("lead-vocals"),
  name: "lead vocals",
  description: "Lead or solo vocal"
})

/**
 * Background vocals attribute
 * @since 1.0.0
 */
export const backgroundVocals = Attribute.make({
  id: attributeId("background-vocals"),
  name: "background vocals",
  description: "Background vocals"
})

/**
 * Choir vocals attribute
 * @since 1.0.0
 */
export const choirVocals = Attribute.make({
  id: attributeId("choir-vocals"),
  name: "choir vocals",
  description: "Choir vocals"
})

/**
 * Soprano vocals attribute
 * @since 1.0.0
 */
export const sopranoVocals = Attribute.make({
  id: attributeId("soprano-vocals"),
  name: "soprano vocals",
  description: "Soprano vocals"
})

/**
 * Alto vocals attribute
 * @since 1.0.0
 */
export const altoVocals = Attribute.make({
  id: attributeId("alto-vocals"),
  name: "alto vocals",
  description: "Alto vocals"
})

/**
 * Tenor vocals attribute
 * @since 1.0.0
 */
export const tenorVocals = Attribute.make({
  id: attributeId("tenor-vocals"),
  name: "tenor vocals",
  description: "Tenor vocals"
})

/**
 * Bass vocals attribute
 * @since 1.0.0
 */
export const bassVocals = Attribute.make({
  id: attributeId("bass-vocals"),
  name: "bass vocals",
  description: "Bass vocals"
})

// ============================================================================
// BUSINESS ATTRIBUTES
// ============================================================================

/**
 * Sub-publisher attribute
 * @since 1.0.0
 */
export const sub = Attribute.make({
  id: attributeId("sub"),
  name: "sub",
  description: "This indicates the publisher subcontracted to publish a release or work in a specific territory."
})

/**
 * Translator attribute
 * @since 1.0.0
 */
export const translator = Attribute.make({
  id: attributeId("translator"),
  name: "translator",
  description: "This indicates the linked entity translated something, rather than being the original writer."
})

// ============================================================================
// ATTRIBUTE GROUPINGS
// ============================================================================

/**
 * Performance modifier attributes
 * @since 1.0.0
 */
export const performanceAttributes = [
  additional,
  guest,
  solo,
  live,
  cover,
  instrumental,
  acappella,
  partial,
  demo,
  karaoke,
  medley
] as const

/**
 * Production modifier attributes
 * @since 1.0.0
 */
export const productionAttributes = [
  assistant,
  associate,
  co,
  executive,
  pre,
  re
] as const

/**
 * Vocal type attributes
 * @since 1.0.0
 */
export const vocalAttributes = [
  leadVocals,
  backgroundVocals,
  choirVocals,
  sopranoVocals,
  altoVocals,
  tenorVocals,
  bassVocals
] as const

/**
 * Business modifier attributes
 * @since 1.0.0
 */
export const businessAttributes = [
  sub,
  translator
] as const

/**
 * All relationship attributes
 * @since 1.0.0
 */
export const allAttributes = [
  ...performanceAttributes,
  ...productionAttributes,
  ...vocalAttributes,
  ...businessAttributes
] as const

// ============================================================================
// ATTRIBUTE COMPATIBILITY MAPPING
// ============================================================================

/**
 * Maps predicates to their compatible attributes
 * @since 1.0.0
 */
export const predicateAttributeCompatibility = {
  // Performance predicates
  "mb:performer": [additional, guest, solo],
  "mb:instrument": [additional, guest, solo],
  "mb:vocal": [additional, guest, solo, ...vocalAttributes],
  "mb:conductor": [additional, assistant],
  "mb:performance": [live, cover, instrumental, acappella, partial, demo, karaoke, medley],

  // Production predicates
  "mb:producer": [additional, assistant, associate, co, executive],
  "mb:mixer": [additional, assistant, associate, co],
  "mb:recording-engineer": [additional, assistant, associate, co],
  "mb:mastering-engineer": [additional, assistant, associate, co, pre, re],
  "mb:remixer": [additional, assistant],

  // Authorship predicates
  "mb:composer": [additional],
  "mb:lyricist": [additional],
  "mb:writer": [additional],
  "mb:librettist": [additional],
  "mb:arranger": [additional, associate, co],

  // Business predicates
  "mb:publisher": [sub],
  "mb:phonographic-copyright": [],
  "mb:samples-from-artist": [additional]
} as const
