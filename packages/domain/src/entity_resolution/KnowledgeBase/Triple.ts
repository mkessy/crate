import { Entity, EntityUri, Triple } from "../../rdf/index.js"
import {
  acappella,
  // Attributes
  additional,
  assistant,
  backgroundVocals,
  co,
  cover,
  executive,
  guest,
  instrumental,
  leadVocals,
  live,
  partial,
  re,
  solo,
  sub
} from "./Attributes.js"
import {
  arranger,
  composer,
  instrument,
  lyricist,
  masteringEngineer,
  mixer,
  performance,
  // Predicates
  performer,
  phonographicCopyright,
  producer,
  publisher,
  recordingEngineer,
  samplesFromArtist,
  vocal
} from "./Predicate.js"

// ============================================================================
// EXAMPLE ENTITIES
// ============================================================================

// Create example entities for demonstration
const bobDylan = Entity.make({
  id: EntityUri.make("mb:artist:72c536dc-7137-4477-a521-567eeb840fa8"),
  type: "artist"
})

const theFreewheelin = Entity.make({
  id: EntityUri.make("mb:release:f5093c06-23e3-404f-aeaa-40f72885ee3a"),
  type: "release"
})

const blowinInTheWind = Entity.make({
  id: EntityUri.make("mb:recording:6ca797d9-3332-4721-b2b6-2df71b2be33b"),
  type: "recording"
})

const blowinInTheWindWork = Entity.make({
  id: EntityUri.make("mb:work:2ce02909-598b-44ef-b456-7504ce002345"),
  type: "work"
})

const tomWilson = Entity.make({
  id: EntityUri.make("mb:artist:a6623d39-2d8e-4f70-8242-0a9553b91e50"),
  type: "artist"
})

const _studio = Entity.make({
  id: EntityUri.make("mb:place:4352063b-a833-421b-a420-e7fb295dece0"),
  type: "place"
})

// ============================================================================
// PERFORMANCE RELATIONSHIP TRIPLES
// ============================================================================

/**
 * Bob Dylan performed vocals on "Blowin' in the Wind" (lead vocals)
 * @since 1.0.0
 */
export const dylanVocalsTriple = Triple.Make({
  subject: bobDylan,
  predicate: vocal,
  object: blowinInTheWind,
  attributes: [leadVocals],
  direction: "forward"
})

/**
 * Bob Dylan performed guitar on "Blowin' in the Wind" (solo performance)
 * @since 1.0.0
 */
export const dylanGuitarTriple = Triple.Make({
  subject: bobDylan,
  predicate: instrument,
  object: blowinInTheWind,
  attributes: [solo],
  direction: "forward"
})

/**
 * Bob Dylan was the main performer on "Blowin' in the Wind"
 * @since 1.0.0
 */
export const dylanPerformerTriple = Triple.Make({
  subject: bobDylan,
  predicate: performer,
  object: blowinInTheWind,
  attributes: [],
  direction: "forward"
})

// ============================================================================
// RECORDING-WORK RELATIONSHIP TRIPLES
// ============================================================================

/**
 * "Blowin' in the Wind" recording is a performance of the work
 * @since 1.0.0
 */
export const recordingWorkTriple = Triple.Make({
  subject: blowinInTheWind,
  predicate: performance,
  object: blowinInTheWindWork,
  attributes: [],
  direction: "forward"
})

/**
 * Alternative version: Live cover recording of the work
 * @since 1.0.0
 */
export const liveVersionTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:recording:live-version-123"),
    type: "recording"
  }),
  predicate: performance,
  object: blowinInTheWindWork,
  attributes: [live, cover],
  direction: "forward"
})

/**
 * Instrumental version of the work
 * @since 1.0.0
 */
export const instrumentalVersionTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:recording:instrumental-version-456"),
    type: "recording"
  }),
  predicate: performance,
  object: blowinInTheWindWork,
  attributes: [instrumental],
  direction: "forward"
})

// ============================================================================
// AUTHORSHIP RELATIONSHIP TRIPLES
// ============================================================================

/**
 * Bob Dylan composed "Blowin' in the Wind"
 * @since 1.0.0
 */
export const dylanComposerTriple = Triple.Make({
  subject: bobDylan,
  predicate: composer,
  object: blowinInTheWindWork,
  attributes: [],
  direction: "forward"
})

/**
 * Bob Dylan wrote the lyrics for "Blowin' in the Wind"
 * @since 1.0.0
 */
export const dylanLyricistTriple = Triple.Make({
  subject: bobDylan,
  predicate: lyricist,
  object: blowinInTheWindWork,
  attributes: [],
  direction: "forward"
})

/**
 * Example: Co-arranger with additional credit
 * @since 1.0.0
 */
export const coArrangerTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:artist:arranger-example"),
    type: "artist"
  }),
  predicate: arranger,
  object: blowinInTheWindWork,
  attributes: [co, additional],
  direction: "forward"
})

// ============================================================================
// PRODUCTION RELATIONSHIP TRIPLES
// ============================================================================

/**
 * Tom Wilson produced "Blowin' in the Wind"
 * @since 1.0.0
 */
export const wilsonProducerTriple = Triple.Make({
  subject: tomWilson,
  predicate: producer,
  object: blowinInTheWind,
  attributes: [],
  direction: "forward"
})

/**
 * Assistant engineer on the recording
 * @since 1.0.0
 */
export const assistantEngineerTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:artist:engineer-example"),
    type: "artist"
  }),
  predicate: recordingEngineer,
  object: blowinInTheWind,
  attributes: [assistant],
  direction: "forward"
})

/**
 * Co-mixer with additional credit
 * @since 1.0.0
 */
export const coMixerTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:artist:mixer-example"),
    type: "artist"
  }),
  predicate: mixer,
  object: blowinInTheWind,
  attributes: [co, additional],
  direction: "forward"
})

/**
 * Remastering engineer for the release
 * @since 1.0.0
 */
export const remasteringTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:artist:mastering-engineer"),
    type: "artist"
  }),
  predicate: masteringEngineer,
  object: theFreewheelin,
  attributes: [re],
  direction: "forward"
})

// ============================================================================
// BUSINESS RELATIONSHIP TRIPLES
// ============================================================================

/**
 * Publisher relationship for the work
 * @since 1.0.0
 */
export const publisherTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:label:publisher-example"),
    type: "label"
  }),
  predicate: publisher,
  object: blowinInTheWindWork,
  attributes: [],
  direction: "forward"
})

/**
 * Sub-publisher in specific territory
 * @since 1.0.0
 */
export const subPublisherTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:label:sub-publisher-example"),
    type: "label"
  }),
  predicate: publisher,
  object: blowinInTheWindWork,
  attributes: [sub],
  direction: "forward"
})

/**
 * Phonographic copyright holder
 * @since 1.0.0
 */
export const copyrightTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:label:columbia-records"),
    type: "label"
  }),
  predicate: phonographicCopyright,
  object: blowinInTheWind,
  attributes: [],
  direction: "forward"
})

/**
 * Sampling relationship
 * @since 1.0.0
 */
export const samplingTriple = Triple.Make({
  subject: bobDylan,
  predicate: samplesFromArtist,
  object: Entity.make({
    id: EntityUri.make("mb:recording:hip-hop-track"),
    type: "recording"
  }),
  attributes: [additional],
  direction: "forward"
})

// ============================================================================
// COMPLEX MULTI-ATTRIBUTE EXAMPLES
// ============================================================================

/**
 * Guest artist performing additional background vocals
 * @since 1.0.0
 */
export const guestBackgroundVocalsTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:artist:guest-vocalist"),
    type: "artist"
  }),
  predicate: vocal,
  object: blowinInTheWind,
  attributes: [guest, additional, backgroundVocals],
  direction: "forward"
})

/**
 * Executive producer with co-credit
 * @since 1.0.0
 */
export const executiveCoProducerTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:artist:exec-producer"),
    type: "artist"
  }),
  predicate: producer,
  object: theFreewheelin,
  attributes: [executive, co],
  direction: "forward"
})

/**
 * Live a cappella partial performance by choir
 * @since 1.0.0
 */
export const choirPerformanceTriple = Triple.Make({
  subject: Entity.make({
    id: EntityUri.make("mb:recording:choir-version"),
    type: "recording"
  }),
  predicate: performance,
  object: blowinInTheWindWork,
  attributes: [live, acappella, partial],
  direction: "forward"
})

// ============================================================================
// TRIPLE COLLECTIONS
// ============================================================================

/**
 * All performance-related triples
 * @since 1.0.0
 */
export const performanceTriples = [
  dylanVocalsTriple,
  dylanGuitarTriple,
  dylanPerformerTriple,
  guestBackgroundVocalsTriple
] as const

/**
 * All recording-work relationship triples
 * @since 1.0.0
 */
export const recordingWorkTriples = [
  recordingWorkTriple,
  liveVersionTriple,
  instrumentalVersionTriple,
  choirPerformanceTriple
] as const

/**
 * All authorship triples
 * @since 1.0.0
 */
export const authorshipTriples = [
  dylanComposerTriple,
  dylanLyricistTriple,
  coArrangerTriple
] as const

/**
 * All production triples
 * @since 1.0.0
 */
export const productionTriples = [
  wilsonProducerTriple,
  assistantEngineerTriple,
  coMixerTriple,
  remasteringTriple,
  executiveCoProducerTriple
] as const

/**
 * All business triples
 * @since 1.0.0
 */
export const businessTriples = [
  publisherTriple,
  subPublisherTriple,
  copyrightTriple,
  samplingTriple
] as const

/**
 * All example triples
 * @since 1.0.0
 */
export const allExampleTriples = [
  ...performanceTriples,
  ...recordingWorkTriples,
  ...authorshipTriples,
  ...productionTriples,
  ...businessTriples
] as const
