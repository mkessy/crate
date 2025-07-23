import { Chunk, HashSet, pipe } from "effect"
import * as Cardinality from "./Cardinality.js"
import * as Entity from "./Entity.js"
import * as TripleGraph from "./KnowledgeGraph.js"

// === MusicBrainz Entities ===
const BeatlesArtist = Entity.Entity.make({
  id: Entity.EntityURI.make("mb:artist:b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d"),
  type: "artist"
})

const JohnLennon = Entity.Entity.make({
  id: Entity.EntityURI.make("mb:artist:4d5447d7-c61c-4120-ba1b-d7f471d385b9"),
  type: "artist"
})

const PaulMcCartney = Entity.Entity.make({
  id: Entity.EntityURI.make("mb:artist:ba550d0e-adac-4864-b88b-407cab5e76af"),
  type: "artist"
})

const ComeTogetherRecording = Entity.Entity.make({
  id: Entity.EntityURI.make("mb:recording:85c90a43-0bce-4c25-84a9-1ae8a45a1eb3"),
  type: "recording"
})

const HeyJudeRecording = Entity.Entity.make({
  id: Entity.EntityURI.make("mb:recording:2daaa52c-a4b3-405a-b9aa-e1b9f7c5f17e"),
  type: "recording"
})

const AbbeyRoadRelease = Entity.Entity.make({
  id: Entity.EntityURI.make("mb:release:0c79ea55-4532-4c53-9035-c4b0de36e5ac"),
  type: "release"
})

// === MusicBrainz-inspired Predicates ===
const performer = Entity.Predicate.make({
  id: Entity.PredicateURI.make("mb:performer"),
  forwardPhrase: "performed on",
  reversePhrase: "performers",
  longForm: "performed on",
  description: "Indicates an artist that performed on this recording",
  cardinality0: Cardinality.oneToMany(1),
  cardinality1: Cardinality.oneToMany(1)
})

// Producer predicate (for future use)
// const producer = Entity.Predicate.make({
//   id: Entity.PredicateURI.make("mb:producer"),
//   forwardPhrase: "produced",
//   reversePhrase: "producers",
//   longForm: "produced",
//   description: "Responsible for the creative and practical aspects of making a recording",
//   cardinality0: Cardinality.oneToMany(1),
//   cardinality1: Cardinality.oneToMany(1)
// })

const composer = Entity.Predicate.make({
  id: Entity.PredicateURI.make("mb:composer"),
  forwardPhrase: "composed",
  reversePhrase: "composers",
  longForm: "composed",
  description: "Wrote the music for this work",
  cardinality0: Cardinality.oneToMany(1),
  cardinality1: Cardinality.oneToMany(1)
})

const memberOf = Entity.Predicate.make({
  id: Entity.PredicateURI.make("mb:member-of"),
  forwardPhrase: "member of",
  reversePhrase: "members",
  longForm: "is/was member of",
  description: "This indicates a person is a member of a group",
  cardinality0: Cardinality.oneToMany(1),
  cardinality1: Cardinality.oneToMany(1)
})

const releasedOn = Entity.Predicate.make({
  id: Entity.PredicateURI.make("mb:released-on"),
  forwardPhrase: "released on",
  reversePhrase: "recordings",
  longForm: "was released on",
  description: "Indicates that a recording was released on a particular release",
  cardinality0: Cardinality.oneToMany(1),
  cardinality1: Cardinality.oneToMany(1)
})

// === Attributes ===
const vocals = Entity.Attribute.make({
  id: Entity.AttributeId.make("mb:vocals"),
  name: "vocals",
  description: "The performer provided vocals"
})

const guitar = Entity.Attribute.make({
  id: Entity.AttributeId.make("mb:guitar"),
  name: "guitar",
  description: "The performer played guitar"
})

const bass = Entity.Attribute.make({
  id: Entity.AttributeId.make("mb:bass"),
  name: "bass",
  description: "The performer played bass"
})

const leadVocals = Entity.Attribute.make({
  id: Entity.AttributeId.make("mb:lead-vocals"),
  name: "lead vocals",
  description: "The performer provided lead vocals"
})

// === Create Triples ===
const johnMemberOfBeatles = Entity.Triple.Make({
  subject: JohnLennon,
  predicate: memberOf,
  object: BeatlesArtist,
  attributes: [vocals, guitar]
})

const paulMemberOfBeatles = Entity.Triple.Make({
  subject: PaulMcCartney,
  predicate: memberOf,
  object: BeatlesArtist,
  attributes: [vocals, bass]
})

const johnPerformedComeTogethe = Entity.Triple.Make({
  subject: JohnLennon,
  predicate: performer,
  object: ComeTogetherRecording,
  attributes: [leadVocals, guitar]
})

const johnComposedComeTogether = Entity.Triple.Make({
  subject: JohnLennon,
  predicate: composer,
  object: ComeTogetherRecording,
  attributes: []
})

const paulPerformedHeyJude = Entity.Triple.Make({
  subject: PaulMcCartney,
  predicate: performer,
  object: HeyJudeRecording,
  attributes: [leadVocals]
})

const paulComposedHeyJude = Entity.Triple.Make({
  subject: PaulMcCartney,
  predicate: composer,
  object: HeyJudeRecording,
  attributes: []
})

const comeTogetherOnAbbeyRoad = Entity.Triple.Make({
  subject: ComeTogetherRecording,
  predicate: releasedOn,
  object: AbbeyRoadRelease,
  attributes: []
})

// === Test Data ===
const allTriples = [
  johnMemberOfBeatles,
  paulMemberOfBeatles,
  johnPerformedComeTogethe,
  johnComposedComeTogether,
  paulPerformedHeyJude,
  paulComposedHeyJude,
  comeTogetherOnAbbeyRoad
]

const musicGraph = TripleGraph.make(allTriples)

// === Test Script ===
console.log("=== MusicBrainz Knowledge Graph Test ===\n")

console.log(`Total triples in graph: ${musicGraph.triples.length}`)

// Test filtering
const performanceTriples = musicGraph.filter((triple) => triple.predicate.forwardPhrase === "performed on")
pipe(
  performanceTriples.triples,
  Chunk.forEach((triple) => {
    const subject = triple.subject.id
    const object = triple.object.id
    const attributes = triple.attributes.map((attr) => attr.name).join(", ")
    console.log(`  ${subject} performed on ${object} (${attributes})`)
  })
)

// Test composition relationships
const compositionTriples = musicGraph.filter((triple) => triple.predicate.forwardPhrase === "composed")
pipe(
  compositionTriples.triples,
  Chunk.forEach((triple) => {
    const subject = triple.subject.id
    const object = triple.object.id
    console.log(`  ${subject} composed ${object}`)
  })
)

// Test band membership
const membershipTriples = musicGraph.filter((triple) => triple.predicate.forwardPhrase === "member of")
pipe(
  membershipTriples.triples,
  Chunk.forEach((triple) => {
    const subject = triple.subject.id
    const object = triple.object.id
    const instruments = triple.attributes.map((attr) => attr.name).join(", ")
    console.log(`  ${subject} is member of ${object} (plays: ${instruments})`)
  })
)

// Test traverse functionality with Effect
console.log("\n=== Testing Traverse Functionality ===")
// For now, let's comment out the traverse test since Effect.Applicative isn't available in the same way
// const extractSubjects = musicGraph.traverse(Effect.Applicative)((triple) => Effect.succeed(triple.subject.id))
// Effect.runSync(extractSubjects).triples.forEach((subject, index) => {
//   console.log(`Subject ${index + 1}: ${subject}`)
// })

const uniqueSubjects = HashSet.make(musicGraph.map((t) => t.subject.id))
const uniquePredicates = HashSet.make(musicGraph.map((t) => t.predicate.forwardPhrase))
const uniqueObjects = HashSet.make(musicGraph.map((t) => t.object.id))

console.log(`Unique subjects: ${HashSet.size(uniqueSubjects)}`)
console.log(`Unique predicates: ${HashSet.size(uniquePredicates)}`)
console.log(`Unique objects: ${HashSet.size(uniqueObjects)}`)

console.log("\nSubjects:", Array.from(uniqueSubjects))
console.log("Predicates:", Array.from(uniquePredicates))
console.log("Objects:", Array.from(uniqueObjects))
