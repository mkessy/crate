import { assert, describe, it } from "@effect/vitest"
import { DateTime, Effect, Equal, Schema } from "effect"
import {
  AltName,
  Candidate,
  createEntityUri,
  EntityUri,
  EntityUriParser,
  Event,
  getMbId,
  hasMbId,
  Mention,
  MentionId,
  Metadata,
  metaSummary,
  Point,
  Range,
  spanLength,
  spanText,
  Status
} from "../src/entity_resolution/schemas.js"
import type { MbArtistId, MbRecordingId } from "../src/knowledge_base/index.js"
import { EntityType } from "../src/knowledge_base/index.js"

describe("Entity Resolution Schemas", () => {
  describe("EntityUriParser", () => {
    it("should parse valid entity URIs", () => {
      const testCases = [
        "crate://artist/panda-bear-mbid",
        "crate://recording/nirvana-smells-like-teen-spirit",
        "crate://play/12345"
      ]

      testCases.forEach((uri) => {
        // EntityUriParser returns a tuple when decoded, not the original string
        const decoded = Schema.decodeUnknownSync(EntityUriParser)(uri)
        assert.isArray(decoded)
        assert.strictEqual(decoded.length, 4)

        // Test encoding back to string
        const encoded = Schema.encodeSync(EntityUriParser)(decoded)
        assert.strictEqual(encoded, uri)
      })
    })

    it("should fail on invalid URI formats", () => {
      const invalidCases = [
        "invalid://artist/test",
        "crate://invalid-type/test",
        "crate://artist", // missing ID
        "not-a-uri-at-all"
      ]

      invalidCases.forEach((uri) => {
        assert.throws(() => {
          Schema.decodeUnknownSync(EntityUriParser)(uri)
        })
      })
    })

    it("should encode tuples back to URI strings", () => {
      const tuple = ["crate://", "artist" as const, "/", "test-id"] as const
      const encoded = Schema.encodeSync(EntityUriParser)(tuple)
      assert.strictEqual(encoded, "crate://artist/test-id")
    })
  })

  describe("createEntityUri helper", () => {
    it("should create valid URIs for different entity types", () => {
      const artistUri = createEntityUri("artist", "panda-bear-mbid")
      assert.strictEqual(artistUri, "crate://artist/panda-bear-mbid")

      const playUri = createEntityUri("play", "12345")
      assert.strictEqual(playUri, "crate://play/12345")

      const recordingUri = createEntityUri("recording", "test-recording-id")
      assert.strictEqual(recordingUri, "crate://recording/test-recording-id")
    })
  })

  describe("Span data types", () => {
    it("should create Point spans", () => {
      const point = Point({ offset: 10 })
      assert.strictEqual(point._tag, "Point")
      assert.strictEqual(point.offset, 10)
    })

    it("should create Range spans", () => {
      const range = Range({ start: 5, end: 15 })
      assert.strictEqual(range._tag, "Range")
      assert.strictEqual(range.start, 5)
      assert.strictEqual(range.end, 15)
    })

    it("should calculate span lengths correctly", () => {
      const point = Point({ offset: 10 })
      const range = Range({ start: 5, end: 15 })

      assert.strictEqual(spanLength(point), 1)
      assert.strictEqual(spanLength(range), 10)
    })

    it("should format span text correctly", () => {
      const point = Point({ offset: 10 })
      const range = Range({ start: 5, end: 15 })

      assert.strictEqual(spanText(point), "@10")
      assert.strictEqual(spanText(range), "[5:15]")
    })
  })

  describe("AltName variants", () => {
    it("should create different AltName types", () => {
      const official = AltName.Official({ name: "Nirvana" })
      assert.strictEqual(official._tag, "Official")
      assert.strictEqual(official.name, "Nirvana")

      const alias = AltName.Alias({ name: "Kurt Cobain Band", source: "fan-wiki" })
      assert.strictEqual(alias._tag, "Alias")
      assert.strictEqual(alias.source, "fan-wiki")

      const nickname = AltName.Nickname({ name: "Grunge Gods", commonality: 85 })
      assert.strictEqual(nickname._tag, "Nickname")
      assert.strictEqual(nickname.commonality, 85)

      const spelling = AltName.Spelling({ name: "Nirvanna", variant: "common-misspelling" })
      assert.strictEqual(spelling._tag, "Spelling")
      assert.strictEqual(spelling.variant, "common-misspelling")
    })
  })

  describe("Metadata types", () => {
    it("should create Artist metadata", () => {
      const artist = Metadata.Artist({
        mbId: "artist-mbid" as MbArtistId,
        sortName: "Nirvana",
        type: "Group",
        country: "US",
        lifeSpan: {
          begin: "1987",
          end: "1994",
          ended: true
        }
      })

      assert.strictEqual(artist._tag, "Artist")
      assert.strictEqual(artist.mbId, "artist-mbid")
      assert.strictEqual(artist.type, "Group")
      assert.strictEqual(artist.country, "US")
    })

    it("should create Recording metadata", () => {
      const recording = Metadata.Recording({
        mbId: "recording-mbid" as MbRecordingId,
        length: 301000, // 5:01 in milliseconds
        disambiguation: "album version"
      })

      assert.strictEqual(recording._tag, "Recording")
      assert.strictEqual(recording.length, 301000)
      assert.strictEqual(recording.disambiguation, "album version")
    })

    it("should create Play metadata", () => {
      const play = Metadata.Play({
        playId: 12345,
        airdate: "2023-10-15T14:30:00Z",
        showId: 67,
        isLocal: false,
        isRequest: true,
        isLive: false,
        mbArtistIds: ["artist-1" as MbArtistId, "artist-2" as MbArtistId],
        mbLabelIds: []
      })

      assert.strictEqual(play._tag, "Play")
      assert.strictEqual(play.playId, 12345)
      assert.strictEqual(play.isRequest, true)
      assert.strictEqual(play.mbArtistIds.length, 2)
    })
  })

  describe("Status variants", () => {
    it("should create all Status types", () => {
      const pending = Status.Pending()
      assert.strictEqual(pending._tag, "Pending")

      const resolved = Status.Resolved({
        uri: "crate://artist/test" as EntityUri,
        confidence: 0.95
      })
      assert.strictEqual(resolved._tag, "Resolved")
      assert.strictEqual(resolved.confidence, 0.95)

      const ambiguous = Status.Ambiguous({
        candidates: ["crate://artist/1" as EntityUri, "crate://artist/2" as EntityUri]
      })
      assert.strictEqual(ambiguous._tag, "Ambiguous")
      assert.strictEqual(ambiguous.candidates.length, 2)

      const notFound = Status.NotFound({ reason: "No matches found" })
      assert.strictEqual(notFound._tag, "NotFound")
      assert.strictEqual(notFound.reason, "No matches found")
    })
  })

  describe("Core data structures", () => {
    it("should create Mention objects", () => {
      const mention = Mention({
        id: "mention-1" as MentionId,
        text: "Nirvana",
        norm: "nirvana",
        span: Point({ offset: 10 }),
        src: "Check out Nirvana's latest album",
        hint: "artist" as EntityType,
        status: Status.Pending()
      })

      assert.strictEqual(mention.text, "Nirvana")
      assert.strictEqual(mention.norm, "nirvana")
      assert.strictEqual(mention.hint, "artist")
    })

    it.effect("should create Candidate objects with timestamps", () =>
      Effect.gen(function*() {
        const now = yield* DateTime.now

        const candidate = Candidate({
          uri: "crate://artist/nirvana" as EntityUri,
          name: "Nirvana",
          type: "artist" as EntityType,
          score: 0.95,
          method: "semantic",
          mentionId: "mention-1" as MentionId,
          meta: Metadata.Artist({
            mbId: "nirvana-mbid" as MbArtistId,
            type: "Group"
          }),
          alts: [AltName.Official({ name: "Nirvana" })],
          ts: now
        })

        assert.strictEqual(candidate.name, "Nirvana")
        assert.strictEqual(candidate.score, 0.95)
        assert.strictEqual(candidate.method, "semantic")
        assert.isTrue(DateTime.lessThanOrEqualTo(candidate.ts, now))
      }))
  })

  describe("Event types", () => {
    it("should create different Event types", () => {
      const mention = Mention({
        id: "m1" as MentionId,
        text: "test",
        norm: "test",
        span: Point({ offset: 0 }),
        src: "test source",
        status: Status.Pending()
      })

      const mentionsFound = Event.MentionsFound({ mentions: [mention] })
      assert.strictEqual(mentionsFound._tag, "MentionsFound")
      assert.strictEqual(mentionsFound.mentions.length, 1)

      const noMatch = Event.NoMatch({ mention })
      assert.strictEqual(noMatch._tag, "NoMatch")

      const error = Event.Error({ mention, error: new Error("test error") })
      assert.strictEqual(error._tag, "Error")
    })
  })

  describe("Metadata summary function", () => {
    it("should generate appropriate summaries for different metadata types", () => {
      const artistMeta = Metadata.Artist({
        mbId: "test" as MbArtistId,
        type: "Group",
        country: "US",
        lifeSpan: { begin: "1987", end: "1994", ended: true }
      })
      // metaSummary is now a completed function that can be called directly
      const artistSummary = metaSummary(artistMeta)
      assert.isTrue(artistSummary.includes("group"))
      assert.isTrue(artistSummary.includes("(US)"))
      assert.isTrue(artistSummary.includes("1987-1994"))

      const recordingMeta = Metadata.Recording({
        mbId: "test" as MbRecordingId,
        length: 181000, // 3:01
        disambiguation: "live version"
      })
      const recordingSummary = metaSummary(recordingMeta)
      assert.isTrue(recordingSummary.includes("recording"))
      assert.isTrue(recordingSummary.includes("(3:01)"))
      assert.isTrue(recordingSummary.includes("\"live version\""))

      const playMeta = Metadata.Play({
        playId: 123,
        airdate: "2023-10-15T14:30:00Z",
        showId: 1,
        isLocal: false,
        isRequest: false,
        isLive: true,
        mbArtistIds: [],
        mbLabelIds: []
      })
      const playSummary = metaSummary(playMeta)
      assert.isTrue(playSummary.includes("KEXP play"))
      assert.isTrue(playSummary.includes("2023-10-15"))
      assert.isTrue(playSummary.includes("(live)"))
    })
  })

  describe("Metadata helper functions", () => {
    it("should correctly identify metadata with MB IDs", () => {
      const artistMeta = Metadata.Artist({ mbId: "test" as MbArtistId })
      const playMeta = Metadata.Play({
        playId: 123,
        airdate: "2023-10-15",
        showId: 1,
        isLocal: false,
        isRequest: false,
        isLive: false,
        mbArtistIds: [],
        mbLabelIds: []
      })

      assert.isTrue(hasMbId(artistMeta))
      assert.isFalse(hasMbId(playMeta))
    })

    it("should extract MB IDs correctly", () => {
      const artistMeta = Metadata.Artist({ mbId: "artist-123" as MbArtistId })
      const playMeta = Metadata.Play({
        playId: 123,
        airdate: "2023-10-15",
        showId: 1,
        isLocal: false,
        isRequest: false,
        isLive: false,
        mbArtistIds: [],
        mbLabelIds: []
      })

      assert.strictEqual(getMbId(artistMeta), "artist-123")
      assert.isUndefined(getMbId(playMeta))
    })
  })

  describe("Schema validation with real-world data", () => {
    it.effect("should validate complex nested data structures", () =>
      Effect.gen(function*() {
        const complexData = {
          mention: {
            id: "complex-mention",
            text: "Smells Like Teen Spirit by Nirvana",
            norm: "smells like teen spirit nirvana",
            span: { _tag: "Range", start: 0, end: 35 },
            src: "Playing Smells Like Teen Spirit by Nirvana next",
            hint: "recording",
            status: {
              _tag: "Resolved",
              uri: "crate://recording/smells-like-teen-spirit",
              confidence: 0.98
            }
          },
          candidate: {
            uri: "crate://recording/smells-like-teen-spirit",
            name: "Smells Like Teen Spirit",
            type: "recording",
            score: 0.98,
            method: "semantic",
            mentionId: "complex-mention",
            meta: {
              _tag: "Recording",
              mbId: "recording-mbid-123",
              length: 301000,
              disambiguation: "album version"
            },
            alts: [
              { _tag: "Official", name: "Smells Like Teen Spirit" },
              { _tag: "Alias", name: "Teen Spirit", source: "common-short-form" }
            ],
            ts: DateTime.unsafeNow()
          }
        }

        // Test individual components can be decoded
        const mentionSchema = Schema.Struct({
          id: MentionId,
          text: Schema.String,
          norm: Schema.String,
          span: Schema.Union(
            Schema.Struct({ _tag: Schema.Literal("Point"), offset: Schema.Number }),
            Schema.Struct({ _tag: Schema.Literal("Range"), start: Schema.Number, end: Schema.Number })
          ),
          src: Schema.String,
          hint: Schema.optional(EntityType),
          status: Schema.Union(
            Schema.Struct({ _tag: Schema.Literal("Pending") }),
            Schema.Struct({
              _tag: Schema.Literal("Resolved"),
              uri: EntityUri,
              confidence: Schema.Number
            }),
            Schema.Struct({
              _tag: Schema.Literal("Ambiguous"),
              candidates: Schema.Array(EntityUri)
            }),
            Schema.Struct({
              _tag: Schema.Literal("NotFound"),
              reason: Schema.optional(Schema.String)
            })
          )
        })

        const mention = yield* Schema.decodeUnknown(mentionSchema)(complexData.mention)
        assert.strictEqual(mention.text, "Smells Like Teen Spirit by Nirvana")
        assert.strictEqual(mention.status._tag, "Resolved")
      }))

    it("should handle error accumulation for invalid data", () => {
      const invalidData = {
        id: 123, // Should be string
        text: "", // Should be non-empty
        norm: null, // Should be string
        span: { _tag: "Invalid", value: "wrong" }, // Invalid span type
        src: undefined, // Should be string
        status: { _tag: "Unknown" } // Invalid status
      }

      const mentionSchema = Schema.Struct({
        id: MentionId,
        text: Schema.String.pipe(Schema.minLength(1)),
        norm: Schema.String,
        span: Schema.Union(
          Schema.Struct({ _tag: Schema.Literal("Point"), offset: Schema.Number }),
          Schema.Struct({ _tag: Schema.Literal("Range"), start: Schema.Number, end: Schema.Number })
        ),
        src: Schema.String,
        status: Schema.Union(
          Schema.Struct({ _tag: Schema.Literal("Pending") }),
          Schema.Struct({ _tag: Schema.Literal("Resolved"), uri: EntityUri, confidence: Schema.Number })
        )
      })

      // Test that validation fails with multiple errors
      assert.throws(() => {
        Schema.decodeUnknownSync(mentionSchema)(invalidData, { errors: "all" })
      })
    })
  })

  describe("Data equality with Schema.Data", () => {
    it("should support structural equality for Data-wrapped schemas", () => {
      // Create a Data-wrapped schema for structural equality
      const PersonData = Schema.Data(Schema.Struct({
        name: Schema.String,
        age: Schema.Number
      }))

      const person1 = Schema.decodeSync(PersonData)({ name: "Alice", age: 30 })
      const person2 = Schema.decodeSync(PersonData)({ name: "Alice", age: 30 })
      const person3 = Schema.decodeSync(PersonData)({ name: "Bob", age: 25 })

      // These should be structurally equal
      assert.isTrue(Equal.equals(person1, person2))
      assert.isFalse(Equal.equals(person1, person3))
    })
  })
})
