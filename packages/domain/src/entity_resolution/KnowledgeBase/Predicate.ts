import { ManyToMany, ManyToOne } from "../../rdf/Cardinality.js"
import { Predicate, PredicateGrouping, PredicateURI } from "../../rdf/index.js"

// ============================================================================
// PREDICATE GROUPINGS
// ============================================================================

// Helper function to create predicate URIs
const predicateURI = (id: string): ReturnType<typeof PredicateURI.make> => PredicateURI.make(`mb:${id}`)

// ============================================================================
// PERFORMANCE RELATIONSHIPS
// ============================================================================

/**
 * Artist-Recording: Performer relationship
 * @since 1.0.0
 */
export const performer = Predicate.make({
  id: predicateURI("performer"),
  forwardPhrase: "{additional:additionally} {guest} {solo} performed",
  reversePhrase: "{additional} {guest} {solo} performer",
  longForm: "{additional:additionally} {guest} {solo} performed",
  description: "Indicates an artist that performed on this recording.",
  cardinality0: ManyToMany.make(), // Artist -> Many relationships
  cardinality1: ManyToOne.make() // Recording -> Few relationships
})

/**
 * Artist-Recording: Instrumental performance
 * @since 1.0.0
 */
export const instrument = Predicate.make({
  id: predicateURI("instrument"),
  forwardPhrase: "{additional} {guest} {solo} {instrument:%|instruments}",
  reversePhrase: "{additional} {guest} {solo} {instrument:%|instruments}",
  longForm: "performed {additional} {guest} {solo} {instrument:%|instruments} on",
  description: "Indicates an artist that performed one or more instruments on this recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Vocal performance
 * @since 1.0.0
 */
export const vocal = Predicate.make({
  id: predicateURI("vocal"),
  forwardPhrase: "{additional} {guest} {solo} {vocal:%|vocals}",
  reversePhrase: "{additional} {guest} {solo} {vocal:%|vocals}",
  longForm: "performed {additional} {guest} {solo} {vocal:%|vocals} on",
  description: "Indicates an artist that performed vocals on this recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Conductor
 * @since 1.0.0
 */
export const conductor = Predicate.make({
  id: predicateURI("conductor"),
  forwardPhrase: "{additional:additionally} {assistant} conducted",
  reversePhrase: "{additional} {assistant} conductor",
  longForm: "{additional:additionally} {assistant} conducted",
  description: "This indicates an artist who conducted an orchestra, band or choir on this recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Recording-Work: Performance/recording relationship
 * @since 1.0.0
 */
export const performance = Predicate.make({
  id: predicateURI("performance"),
  forwardPhrase:
    "{acappella:a cappella} {live} {medley:medley including a} {partial} {instrumental} {cover} {karaoke} {demo} recording of",
  reversePhrase:
    "{acappella:a cappella} {live} {medley:medleys including} {partial} {instrumental} {cover} {karaoke} {demo} recordings",
  longForm:
    "is {acappella:an|a} {acappella:a cappella} {live} {medley:medley including a} {partial} {instrumental} {cover} {karaoke} {demo} recording of",
  description: "This is used to link works to their recordings.",
  cardinality0: ManyToOne.make(), // Recording -> Few relationships
  cardinality1: ManyToMany.make() // Work -> Many relationships
})

// ============================================================================
// AUTHORSHIP/COMPOSITION RELATIONSHIPS
// ============================================================================

/**
 * Artist-Work: Composer relationship
 * @since 1.0.0
 */
export const composer = Predicate.make({
  id: predicateURI("composer"),
  forwardPhrase: "{additional:additionally} composed",
  reversePhrase: "{additional} composer",
  longForm: "{additional:additionally} composed",
  description:
    "Indicates the composer for this work, that is, the artist who wrote the music (not necessarily the lyrics).",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Work: Lyricist relationship
 * @since 1.0.0
 */
export const lyricist = Predicate.make({
  id: predicateURI("lyricist"),
  forwardPhrase: "{additional} lyrics",
  reversePhrase: "{additional} lyricist",
  longForm: "{additional:additionally} wrote the lyrics for",
  description: "Indicates the lyricist for this work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Work: Writer relationship (general)
 * @since 1.0.0
 */
export const writer = Predicate.make({
  id: predicateURI("writer"),
  forwardPhrase: "{additional:additionally} wrote",
  reversePhrase: "{additional} writer",
  longForm: "{additional:additionally} wrote",
  description:
    "This relationship is used to link a work to the artist responsible for writing the music and/or the words (lyrics, libretto, etc.), when no more specific information is available.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Work: Librettist relationship
 * @since 1.0.0
 */
export const librettist = Predicate.make({
  id: predicateURI("librettist"),
  forwardPhrase: "{additional} libretto",
  reversePhrase: "{additional} librettist",
  longForm: "{additional:additionally} wrote the libretto for",
  description: "Indicates the librettist for this work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Work: Arranger relationship
 * @since 1.0.0
 */
export const arranger = Predicate.make({
  id: predicateURI("arranger"),
  forwardPhrase: "{additional:additionally} {associate} {co:co-}arranged",
  reversePhrase: "{additional} {associate} {co:co-}arranger",
  longForm: "{additional:additionally} {associate} {co:co-}arranged",
  description: "This indicates the artist who arranged a tune into a form suitable for performance.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

// ============================================================================
// PRODUCTION/ENGINEERING RELATIONSHIPS
// ============================================================================

/**
 * Artist-Recording: Producer relationship
 * @since 1.0.0
 */
export const producer = Predicate.make({
  id: predicateURI("producer"),
  forwardPhrase: "{additional:additionally} {assistant} {associate} {co:co-}{executive:executive }produced",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}{executive:executive }producer",
  longForm: "{additional:additionally} {assistant} {associate} {co:co-}{executive:executive }produced",
  description:
    "This indicates an artist who is responsible for the creative and practical day-to-day aspects involved with making a musical recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Mix engineer relationship
 * @since 1.0.0
 */
export const mixer = Predicate.make({
  id: predicateURI("mixer"),
  forwardPhrase: "{additional:additionally} {assistant} {associate} {co:co-}mixed",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}mixer",
  longForm: "{additional:additionally} {assistant} {associate} {co:co-}mixed",
  description:
    "This describes an engineer responsible for using a mixing console to mix a recorded track into a single piece of music suitable for release.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Recording engineer relationship
 * @since 1.0.0
 */
export const recordingEngineer = Predicate.make({
  id: predicateURI("recording-engineer"),
  forwardPhrase: "{additional} {assistant} {associate} {co:co-}recording engineer for",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}recording engineer",
  longForm: "was {additional} {assistant} {associate} {co:co-}recording engineer for",
  description:
    "This describes an engineer responsible for committing the performance to tape or another recording medium.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Release: Mastering engineer relationship
 * @since 1.0.0
 */
export const masteringEngineer = Predicate.make({
  id: predicateURI("mastering-engineer"),
  forwardPhrase: "{additional} {assistant} {associate} {co:co-}{pre:pre-}{re}mastering",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}{pre:pre-}{re}mastering",
  longForm: "{additional:additionally} {assistant} {associate} {co:co-}{pre:pre-}{re}mastered",
  description: "Indicates the mastering engineer for this release.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Remixer relationship
 * @since 1.0.0
 */
export const remixer = Predicate.make({
  id: predicateURI("remixer"),
  forwardPhrase: "{additional:additionally} {assistant} remixed",
  reversePhrase: "{additional} {assistant} remixer",
  longForm: "{additional:additionally} {assistant} remixed",
  description:
    "This links a recording to the person who remixed it by taking one or more other tracks, substantially altering them and mixing them together with other material.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

// ============================================================================
// SPECIALIZED RELATIONSHIPS
// ============================================================================

/**
 * Artist-Work: Publisher relationship
 * @since 1.0.0
 */
export const publisher = Predicate.make({
  id: predicateURI("publisher"),
  forwardPhrase: "{sub:sub-}published",
  reversePhrase: "{sub:sub-}publisher",
  longForm: "{sub:sub-}published",
  description: "Indicates the publisher of this work. This is not the same concept as the record label.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Phonographic copyright
 * @since 1.0.0
 */
export const phonographicCopyright = Predicate.make({
  id: predicateURI("phonographic-copyright"),
  forwardPhrase: "holds phonographic copyright (℗) for",
  reversePhrase: "phonographic copyright (℗) by",
  longForm: "holds phonographic copyright (℗) for",
  description:
    "This relationship indicates the artist is the phonographic copyright holder for this recording, usually indicated with a ℗ symbol.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Artist-Recording: Sampling relationship
 * @since 1.0.0
 */
export const samplesFromArtist = Predicate.make({
  id: predicateURI("samples-from-artist"),
  forwardPhrase: "produced material that was {additional:additionally} sampled in",
  reversePhrase: "contains {additional} samples by",
  longForm: "{entity1} contains {additional} samples by {entity0}",
  description: "Indicates that the recording contains samples from material by the indicated artist.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

/**
 * Performance relationships grouping
 * @since 1.0.0
 */
export const performancePredicates = PredicateGrouping.make({
  name: "Performance",
  description: "Relationships indicating performance roles",
  predicates: [performer, instrument, vocal, conductor, performance]
})

/**
 * Authorship relationships grouping
 * @since 1.0.0
 */
export const authorshipPredicates = PredicateGrouping.make({
  name: "Authorship",
  description: "Relationships indicating creative authorship",
  predicates: [composer, lyricist, writer, librettist, arranger]
})

/**
 * Production relationships grouping
 * @since 1.0.0
 */
export const productionPredicates = PredicateGrouping.make({
  name: "Production",
  description: "Relationships indicating production and engineering roles",
  predicates: [producer, mixer, recordingEngineer, masteringEngineer, remixer]
})

/**
 * Legal/Business relationships grouping
 * @since 1.0.0
 */
export const businessPredicates = PredicateGrouping.make({
  name: "Business",
  description: "Relationships indicating legal and business roles",
  predicates: [publisher, phonographicCopyright, samplesFromArtist]
})

/**
 * All music relationship predicates
 * @since 1.0.0
 */
export const allMusicPredicates = [
  // Performance
  performer,
  instrument,
  vocal,
  conductor,
  performance,

  // Authorship
  composer,
  lyricist,
  writer,
  librettist,
  arranger,

  // Production
  producer,
  mixer,
  recordingEngineer,
  masteringEngineer,
  remixer,

  // Business
  publisher,
  phonographicCopyright,
  samplesFromArtist
] as const

/**
 * All predicate groupings
 * @since 1.0.0
 */
export const allPredicateGroupings = [
  performancePredicates,
  authorshipPredicates,
  productionPredicates,
  businessPredicates
] as const
