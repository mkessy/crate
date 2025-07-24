import { Attribute, AttributeId } from "../../rdf/index.js"

// ============================================================================
// ATTRIBUTE DEFINITIONS
// ============================================================================

// --- Performance Attributes ---
export const additional = Attribute.make({
  id: AttributeId.make("additional"),
  name: "additional",
  description: "Describes if a particular role was considered normal or additional."
})
export const guest = Attribute.make({
  id: AttributeId.make("guest"),
  name: "guest",
  description: "This attribute indicates a 'guest' performance where the performer is not usually part of the band."
})
export const solo = Attribute.make({
  id: AttributeId.make("solo"),
  name: "solo",
  description:
    "This should be used when an artist is credited in liner notes or a similar source as performing a solo part."
})
export const live = Attribute.make({
  id: AttributeId.make("live"),
  name: "live",
  description: "This indicates that the recording is of a live performance."
})
export const cover = Attribute.make({
  id: AttributeId.make("cover"),
  name: "cover",
  description: "Indicates that one entity is a cover of another entity."
})
export const instrumental = Attribute.make({
  id: AttributeId.make("instrumental"),
  name: "instrumental",
  description: "For works that have lyrics, this indicates that those lyrics are not relevant to this recording."
})
export const acappella = Attribute.make({
  id: AttributeId.make("acappella"),
  name: "a cappella",
  description:
    "For works that usually have instruments and vocals, this indicates that the instrumental parts are not relevant to this recording."
})
export const partial = Attribute.make({
  id: AttributeId.make("partial"),
  name: "partial",
  description: "This indicates that the recording is not of the entire work, such as excerpts from, conclusion of, etc."
})
export const demo = Attribute.make({
  id: AttributeId.make("demo"),
  name: "demo",
  description: "This indicates that the recording is of a demo version."
})
export const karaoke = Attribute.make({
  id: AttributeId.make("karaoke"),
  name: "karaoke",
  description: "This indicates that this is a karaoke recording of the work."
})
export const medley = Attribute.make({
  id: AttributeId.make("medley"),
  name: "medley",
  description: "This indicates that the recording is of a medley, of which the work is one part."
})

// --- Production Attributes ---
export const assistant = Attribute.make({
  id: AttributeId.make("assistant"),
  name: "assistant",
  description:
    "This typically indicates someone who is either a first-timer, or less experienced, and who is working under the direction of someone who is more experienced."
})
export const associate = Attribute.make({
  id: AttributeId.make("associate"),
  name: "associate",
  description:
    "This typically indicates someone who is less experienced and who is working under the direction of someone who is more experienced."
})
export const co = Attribute.make({
  id: AttributeId.make("co"),
  name: "co",
  description: "Use this only for cases when someone is credited as co-[role] (co-producer, co-engineer, etc.)."
})
export const executive = Attribute.make({
  id: AttributeId.make("executive"),
  name: "executive",
  description: "This attribute is to be used if the role was fulfilled in an executive capacity."
})
export const pre = Attribute.make({
  id: AttributeId.make("pre"),
  name: "pre",
  description: "Use this to indicate that the mastering relationship is specifically for a pre-master."
})
export const re = Attribute.make({
  id: AttributeId.make("re"),
  name: "re",
  description: "Use this to indicate that the mastering relationship is specifically for a remaster."
})
export const task = Attribute.make({
  id: AttributeId.make("task"),
  name: "task",
  description: "A specific task performed (e.g. Pro-Tools editing)."
})

// --- Vocal Attributes ---
export const leadVocals = Attribute.make({
  id: AttributeId.make("lead-vocals"),
  name: "lead vocals",
  description: "Lead or solo vocal"
})
export const backgroundVocals = Attribute.make({
  id: AttributeId.make("background-vocals"),
  name: "background vocals",
  description: "Background vocals"
})
export const choirVocals = Attribute.make({
  id: AttributeId.make("choir-vocals"),
  name: "choir vocals",
  description: "Choir vocals"
})
export const sopranoVocals = Attribute.make({
  id: AttributeId.make("soprano-vocals"),
  name: "soprano vocals",
  description: "Soprano vocals"
})
export const altoVocals = Attribute.make({
  id: AttributeId.make("alto-vocals"),
  name: "alto vocals",
  description: "Alto vocals"
})
export const tenorVocals = Attribute.make({
  id: AttributeId.make("tenor-vocals"),
  name: "tenor vocals",
  description: "Tenor vocals"
})
export const bassVocals = Attribute.make({
  id: AttributeId.make("bass-vocals"),
  name: "bass vocals",
  description: "Bass vocals"
})

// --- Business Attributes ---
export const sub = Attribute.make({
  id: AttributeId.make("sub"),
  name: "sub",
  description: "This indicates the publisher subcontracted to publish a release or work in a specific territory."
})
export const translator = Attribute.make({
  id: AttributeId.make("translator"),
  name: "translator",
  description: "This indicates the linked entity translated something, rather than being the original writer."
})

// ============================================================================
// ATTRIBUTE GROUPINGS
// ============================================================================

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

export const productionAttributes = [
  assistant,
  associate,
  co,
  executive,
  pre,
  re,
  task
] as const

export const vocalAttributes = [
  leadVocals,
  backgroundVocals,
  choirVocals,
  sopranoVocals,
  altoVocals,
  tenorVocals,
  bassVocals
] as const

export const businessAttributes = [
  sub,
  translator
] as const

export const allAttributes = [
  ...performanceAttributes,
  ...productionAttributes,
  ...vocalAttributes,
  ...businessAttributes
] as const

// ============================================================================
// ATTRIBUTE COMPATIBILITY MAPPING
// ============================================================================

export const predicateAttributeCompatibility = {
  // Performance predicates
  "mb:performer": [additional, guest, solo],
  "mb:instrument": [additional, guest, solo],
  "mb:vocal": [additional, guest, solo, ...vocalAttributes],
  "mb:conductor": [additional, assistant],
  "mb:performance": [live, cover, instrumental, acappella, partial, demo, karaoke, medley],

  // Production predicates
  "mb:producer": [additional, assistant, associate, co, executive, task],
  "mb:mixer": [additional, assistant, associate, co, task],
  "mb:recording-engineer": [additional, assistant, associate, co, task],
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
