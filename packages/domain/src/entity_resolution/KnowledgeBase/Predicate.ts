import { ManyToMany, ManyToOne, OneToMany } from "../../rdf/Cardinality.js"
import { Predicate, PredicateGrouping, PredicateURI } from "../../rdf/index.js"

export const publishedBy = Predicate.make({
  id: PredicateURI.make("published-by"),
  forwardPhrase: "published by",
  reversePhrase: "publisher for",
  longForm: "is published by",
  description: "Indicates the publisher of a work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

// ============================================================================
// STRUCTURAL RELATIONSHIPS (Recording/Release/Work -> Other)
// ============================================================================

export const performance = Predicate.make({
  id: PredicateURI.make("performance"),
  forwardPhrase: "{live} {medley:medley including a} {partial} {instrumental} {cover} recording of",
  reversePhrase: "{live} {medley:medleys including} {partial} {instrumental} {cover} recordings",
  longForm: "is a {live} {medley:medley including a} {partial} {instrumental} {cover} recording of",
  description: "Links a recording to the work(s) it is a performance of.",
  cardinality0: ManyToOne.make(),
  cardinality1: ManyToMany.make()
})

export const appearsOn = Predicate.make({
  id: PredicateURI.make("appears-on"),
  forwardPhrase: "appears on",
  reversePhrase: "features",
  longForm: "appears on the release",
  description: "Links a recording to a release it appears on.",
  cardinality0: ManyToMany.make(),
  cardinality1: OneToMany.make()
})

export const partOfReleaseGroup = Predicate.make({
  id: PredicateURI.make("part-of-release-group"),
  forwardPhrase: "part of release group",
  reversePhrase: "has release",
  longForm: "is part of the release group",
  description: "Links a release to its release group.",
  cardinality0: ManyToOne.make(),
  cardinality1: OneToMany.make()
})

/**
 * Artist-Recording: Sampling relationship
 * @since 1.0.0
 */
export const samplesFromArtist = Predicate.make({
  id: PredicateURI.make("samples-from-artist"),
  forwardPhrase: "produced material that was {additional:additionally} sampled in",
  reversePhrase: "contains {additional} samples by",
  longForm: "{entity1} contains {additional} samples by {entity0}",
  description: "Indicates that the recording contains samples from material by the indicated artist.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

export const basedOn = Predicate.make({
  id: PredicateURI.make("based-on"),
  forwardPhrase: "based on",
  reversePhrase: "basis for",
  longForm: "is based on the work",
  description: "Indicates that a work is based on another work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

export const remixOf = Predicate.make({
  id: PredicateURI.make("remix-of"),
  forwardPhrase: "remix of",
  reversePhrase: "remixed in",
  longForm: "is a remix of",
  description: "Indicates that a recording is a remix of another recording.",
  cardinality0: ManyToOne.make(),
  cardinality1: ManyToMany.make()
})

export const samples = Predicate.make({
  id: PredicateURI.make("samples"),
  forwardPhrase: "samples",
  reversePhrase: "sampled in",
  longForm: "samples material from",
  description: "Indicates that a recording contains samples from another recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

/**
 * Artist-Work: Publisher relationship
 * @since 1.0.0
 */
export const publisher = Predicate.make({
  id: PredicateURI.make("publisher"),
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
  id: PredicateURI.make("phonographic-copyright"),
  forwardPhrase: "holds phonographic copyright (℗) for",
  reversePhrase: "phonographic copyright (℗) by",
  longForm: "holds phonographic copyright (℗) for",
  description:
    "This relationship indicates the artist is the phonographic copyright holder for this recording, usually indicated with a ℗ symbol.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

// ============================================================================
// PERFORMANCE & PRODUCTION RELATIONSHIPS (Artist -> Recording/Release/Work)
// ============================================================================

export const performer = Predicate.make({
  id: PredicateURI.make("performer"),
  forwardPhrase: "{additional:additionally} {guest} {solo} performed",
  reversePhrase: "{additional} {guest} {solo} performer",
  longForm: "{additional:additionally} {guest} {solo} performed",
  description: "Indicates an artist that performed on this recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const instrument = Predicate.make({
  id: PredicateURI.make("instrument"),
  forwardPhrase: "{additional} {guest} {solo} {instrument:%|instruments}",
  reversePhrase: "{additional} {guest} {solo} {instrument:%|instruments}",
  longForm: "performed {additional} {guest} {solo} {instrument:%|instruments} on",
  description: "Indicates an artist that performed one or more instruments on this recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const vocal = Predicate.make({
  id: PredicateURI.make("vocal"),
  forwardPhrase: "{additional} {guest} {solo} {vocal:%|vocals}",
  reversePhrase: "{additional} {guest} {solo} {vocal:%|vocals}",
  longForm: "performed {additional} {guest} {solo} {vocal:%|vocals} on",
  description: "Indicates an artist that performed vocals on this recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const conductor = Predicate.make({
  id: PredicateURI.make("conductor"),
  forwardPhrase: "{additional:additionally} {assistant} conducted",
  reversePhrase: "{additional} {assistant} conductor",
  longForm: "{additional:additionally} {assistant} conducted",
  description: "Indicates an artist who conducted an orchestra, band or choir.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const producer = Predicate.make({
  id: PredicateURI.make("producer"),
  forwardPhrase: "{additional:additionally} {assistant} {associate} {co:co-}{executive:executive }produced",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}{executive:executive }producer",
  longForm: "{additional:additionally} {assistant} {associate} {co:co-}{executive:executive }produced",
  description: "Indicates an artist who produced a recording or release.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const mixer = Predicate.make({
  id: PredicateURI.make("mixer"),
  forwardPhrase: "{additional:additionally} {assistant} {associate} {co:co-}mixed",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}mixer",
  longForm: "{additional:additionally} {assistant} {associate} {co:co-}mixed",
  description: "Describes an engineer who mixed a recording.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const recordingEngineer = Predicate.make({
  id: PredicateURI.make("recording-engineer"),
  forwardPhrase: "{additional} {assistant} {associate} {co:co-}recording engineer for",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}recording engineer",
  longForm: "was {additional} {assistant} {associate} {co:co-}recording engineer for",
  description: "Describes an engineer responsible for the recording process.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const masteringEngineer = Predicate.make({
  id: PredicateURI.make("mastering-engineer"),
  forwardPhrase: "{additional} {assistant} {associate} {co:co-}{pre:pre-}{re}mastering",
  reversePhrase: "{additional} {assistant} {associate} {co:co-}{pre:pre-}{re}mastering",
  longForm: "{additional:additionally} {assistant} {associate} {co:co-}{pre:pre-}{re}mastered",
  description: "Indicates the mastering engineer for a release.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

// ============================================================================
// AUTHORSHIP & COMPOSITION RELATIONSHIPS (Artist -> Work)
// ============================================================================

export const composer = Predicate.make({
  id: PredicateURI.make("composer"),
  forwardPhrase: "{additional:additionally} composed",
  reversePhrase: "{additional} composer",
  longForm: "{additional:additionally} composed",
  description: "Indicates the composer for this work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const lyricist = Predicate.make({
  id: PredicateURI.make("lyricist"),
  forwardPhrase: "{additional} lyrics",
  reversePhrase: "{additional} lyricist",
  longForm: "{additional:additionally} wrote the lyrics for",
  description: "Indicates the lyricist for this work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const writer = Predicate.make({
  id: PredicateURI.make("writer"),
  forwardPhrase: "{additional:additionally} wrote",
  reversePhrase: "{additional} writer",
  longForm: "{additional:additionally} wrote",
  description: "Indicates the writer of a work when no more specific role is available.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

export const arranger = Predicate.make({
  id: PredicateURI.make("arranger"),
  forwardPhrase: "{additional:additionally} {associate} {co:co-}arranged",
  reversePhrase: "{additional} {associate} {co:co-}arranger",
  longForm: "{additional:additionally} {associate} {co:co-}arranged",
  description: "Indicates the artist who arranged a work.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToOne.make()
})

// ============================================================================
// ARTIST RELATIONSHIPS (Artist -> Artist/Label)
// ============================================================================

export const memberOf = Predicate.make({
  id: PredicateURI.make("member-of"),
  forwardPhrase: "member of",
  reversePhrase: "has member",
  longForm: "is a member of",
  description: "Indicates that an artist is a member of a group.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

export const subgroupOf = Predicate.make({
  id: PredicateURI.make("subgroup-of"),
  forwardPhrase: "subgroup of",
  reversePhrase: "has subgroup",
  longForm: "is a subgroup of",
  description: "Indicates a group is a subgroup of another group.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

export const collaboration = Predicate.make({
  id: PredicateURI.make("collaboration"),
  forwardPhrase: "collaboration with",
  reversePhrase: "collaborated with",
  longForm: "is a collaboration with",
  description: "Indicates two artists are collaborating.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

// ============================================================================
// KEXP-SPECIFIC RELATIONSHIPS
// ============================================================================

export const playedOn = Predicate.make({
  id: PredicateURI.make("played-on"),
  forwardPhrase: "played on",
  reversePhrase: "featured",
  longForm: "was played on",
  description: "Indicates that a recording was played on a KEXP show or program.",
  cardinality0: ManyToMany.make(),
  cardinality1: ManyToMany.make()
})

export const hasRecording = Predicate.make({
  id: PredicateURI.make("has-recording"),
  forwardPhrase: "has recording",
  reversePhrase: "recording of",
  longForm: "has the recording",
  description: "Links an entity to its associated recording.",
  cardinality0: OneToMany.make(),
  cardinality1: ManyToOne.make()
})

export const hasArtist = Predicate.make({
  id: PredicateURI.make("has-artist"),
  forwardPhrase: "has artist",
  reversePhrase: "artist for",
  longForm: "has the artist",
  description: "Links an entity to its associated artist.",
  cardinality0: OneToMany.make(),
  cardinality1: ManyToOne.make()
})

export const hasRelease = Predicate.make({
  id: PredicateURI.make("has-release"),
  forwardPhrase: "has release",
  reversePhrase: "release of",
  longForm: "has the release",
  description: "Links an entity to its associated release.",
  cardinality0: OneToMany.make(),
  cardinality1: ManyToOne.make()
})

export const hasLabel = Predicate.make({
  id: PredicateURI.make("has-label"),
  forwardPhrase: "has label",
  reversePhrase: "label for",
  longForm: "has the label",
  description: "Links an entity to its associated record label.",
  cardinality0: OneToMany.make(),
  cardinality1: ManyToOne.make()
})

// ============================================================================
// PREDICATE GROUPINGS
// ============================================================================

export const performancePredicates = PredicateGrouping.make({
  name: "Performance",
  description: "Relationships indicating performance roles.",
  predicates: [performer, instrument, vocal, conductor]
})

export const productionPredicates = PredicateGrouping.make({
  name: "Production",
  description: "Relationships indicating production and engineering roles.",
  predicates: [producer, mixer, recordingEngineer, masteringEngineer]
})

export const authorshipPredicates = PredicateGrouping.make({
  name: "Authorship",
  description: "Relationships indicating creative authorship of a work.",
  predicates: [composer, lyricist, writer, arranger]
})

export const artistRelationsPredicates = PredicateGrouping.make({
  name: "Artist Relations",
  description: "Relationships between artists, groups, and labels.",
  predicates: [memberOf, subgroupOf, collaboration, publishedBy]
})

export const structuralPredicates = PredicateGrouping.make({
  name: "Structural Relations",
  description: "Relationships linking musical entities together.",
  predicates: [performance, appearsOn, partOfReleaseGroup, basedOn, remixOf, samples]
})

export const kexpPredicates = PredicateGrouping.make({
  name: "KEXP Relations",
  description: "KEXP-specific relationships for radio programming and entity associations.",
  predicates: [playedOn, hasRecording, hasArtist, hasRelease, hasLabel]
})

export const allMusicPredicates = [
  ...performancePredicates.predicates,
  ...productionPredicates.predicates,
  ...authorshipPredicates.predicates,
  ...artistRelationsPredicates.predicates,
  ...structuralPredicates.predicates,
  ...kexpPredicates.predicates
] as const

export const allPredicateGroupings = [
  performancePredicates,
  productionPredicates,
  authorshipPredicates,
  artistRelationsPredicates,
  structuralPredicates,
  kexpPredicates
] as const
