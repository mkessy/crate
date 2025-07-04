// Location: packages/domain/src/entity_resolution/schemas.ts

import { Data, DateTime, Match, Order, Schema } from "effect"
import {
  EntityType,
  MbAreaId,
  MbArtistId,
  MbGenreId,
  MbLabelId,
  MbRecordingId,
  MbReleaseGroupId,
  MbReleaseId,
  MbWorkId
} from "../knowledge_base/index.js"

export const EntityUriPrefix = Schema.Literal("crate://")
export type EntityUriPrefix = Schema.Schema.Type<typeof EntityUriPrefix>

// --- Entity URI Template Literal Parser ---
export const EntityUriParser = Schema.TemplateLiteralParser(
  EntityUriPrefix,
  EntityType,
  Schema.Literal("/"),
  Schema.Union(
    MbArtistId,
    MbRecordingId,
    MbReleaseId,
    MbGenreId,
    MbReleaseGroupId,
    MbWorkId,
    MbLabelId,
    MbAreaId,
    Schema.String
  )
)
export type EntityUriParser = Schema.Schema.Type<typeof EntityUriParser>

// Helper functions to create entity URIs using the parser
export const createEntityUri = (entityType: EntityType, id: string): string =>
  Schema.encodeSync(EntityUriParser)(["crate://", entityType, "/", id] as const)

// --- Branded Primitives ---
export type EntityUri = Schema.Schema.Type<typeof EntityUri>
export const EntityUri = Schema.String.pipe(Schema.brand("EntityUri"))

export type MentionId = Schema.Schema.Type<typeof MentionId>
export const MentionId = Schema.String.pipe(Schema.brand("MentionId"))

// --- Core Enums ---
export type Method = Schema.Schema.Type<typeof Method>
export const Method = Schema.Literal("fts", "semantic", "fuzzy", "llm", "trie")

// --- Span for text position tracking ---
// For non-generic TaggedEnum, pass union directly
export const { $is, $match, Point, Range } = Data.taggedEnum<
  | { readonly _tag: "Point"; readonly offset: number }
  | { readonly _tag: "Range"; readonly start: number; readonly end: number }
>()

// Extract the type from the constructors
export type Span = ReturnType<typeof Point> | ReturnType<typeof Range>

// --- Alternate names with different sources ---
export const AltName = Data.taggedEnum<
  | { readonly _tag: "Official"; readonly name: string }
  | { readonly _tag: "Alias"; readonly name: string; readonly source: string }
  | { readonly _tag: "Nickname"; readonly name: string; readonly commonality: number }
  | { readonly _tag: "Spelling"; readonly name: string; readonly variant: string }
>()

export type AltName =
  | ReturnType<typeof AltName.Official>
  | ReturnType<typeof AltName.Alias>
  | ReturnType<typeof AltName.Nickname>
  | ReturnType<typeof AltName.Spelling>

// --- Metadata variants for different entity types ---
export const Metadata = Data.taggedEnum<
  | {
    readonly _tag: "Artist"
    readonly mbId: MbArtistId
    readonly sortName?: string
    readonly type?: string // "Person", "Group", "Orchestra", "Choir", "Character", "Other"
    readonly typeId?: string
    readonly gender?: string
    readonly genderId?: string
    readonly country?: string
    readonly area?: { id: string; name: string }
    readonly beginArea?: { id: string; name: string }
    readonly endArea?: { id: string; name: string }
    readonly lifeSpan?: {
      begin?: string
      end?: string
      ended: boolean
    }
    readonly disambiguation?: string
  }
  | {
    readonly _tag: "Recording"
    readonly mbId: MbRecordingId
    readonly length?: number // milliseconds
    readonly beginDate?: string
    readonly endDate?: string
    readonly disambiguation?: string
    readonly isrcs?: ReadonlyArray<string>
  }
  | {
    readonly _tag: "Release"
    readonly mbId: MbReleaseId
    readonly barcode?: string
    readonly country?: string
    readonly releaseDate?: string
    readonly beginDate?: string
    readonly endDate?: string
    readonly status?: string // "Official", "Promotion", "Bootleg", "Pseudo-Release"
    readonly statusId?: string
    readonly disambiguation?: string
  }
  | {
    readonly _tag: "ReleaseGroup"
    readonly mbId: MbReleaseGroupId
    readonly type?: string // "Album", "Single", "EP", "Compilation", "Soundtrack", "Live", etc.
    readonly typeId?: string
    readonly firstReleaseDate?: string
    readonly disambiguation?: string
  }
  | {
    readonly _tag: "Work"
    readonly mbId: MbWorkId
    readonly type?: string // "Song", "Symphony", "Sonata", etc.
    readonly iswcs?: ReadonlyArray<string>
    readonly disambiguation?: string
  }
  | {
    readonly _tag: "Label"
    readonly mbId: MbLabelId
    readonly type?: string // "Original Production", "Reissue Production", "Distribution", etc.
    readonly typeId?: string
    readonly labelCode?: number
    readonly area?: { id: string; name: string }
    readonly lifeSpan?: {
      begin?: string
      end?: string
      ended: boolean
    }
    readonly ended: boolean
    readonly disambiguation?: string
  }
  | {
    readonly _tag: "Area"
    readonly mbId: MbAreaId
    readonly type?: string // "Country", "City", "State", "Municipality", etc.
    readonly typeId?: string
    readonly iso1?: string
    readonly iso2?: string
    readonly iso3?: string
    readonly disambiguation?: string
  }
  | {
    readonly _tag: "Genre"
    readonly mbId: MbGenreId
    readonly description?: string
  }
  | {
    readonly _tag: "Play"
    readonly playId: number
    readonly airdate: string
    readonly showId: number
    readonly comment?: string
    readonly rotationStatus?: string
    readonly isLocal: boolean
    readonly isRequest: boolean
    readonly isLive: boolean
    readonly artistText?: string
    readonly albumText?: string
    readonly songText?: string
    readonly mbArtistIds: ReadonlyArray<MbArtistId>
    readonly mbRecordingId?: MbRecordingId
    readonly mbReleaseId?: MbReleaseId
    readonly mbReleaseGroupId?: MbReleaseGroupId
    readonly mbLabelIds: ReadonlyArray<MbLabelId>
  }
>()

export type Metadata =
  | ReturnType<typeof Metadata.Artist>
  | ReturnType<typeof Metadata.Release>
  | ReturnType<typeof Metadata.ReleaseGroup>
  | ReturnType<typeof Metadata.Recording>
  | ReturnType<typeof Metadata.Work>
  | ReturnType<typeof Metadata.Label>
  | ReturnType<typeof Metadata.Area>
  | ReturnType<typeof Metadata.Genre>
  | ReturnType<typeof Metadata.Play>

// --- Resolution status for tracking progress ---
export const Status = Data.taggedEnum<
  | { readonly _tag: "Pending" }
  | { readonly _tag: "Resolved"; readonly uri: EntityUri; readonly confidence: number }
  | { readonly _tag: "Ambiguous"; readonly candidates: ReadonlyArray<EntityUri> }
  | { readonly _tag: "NotFound"; readonly reason?: string }
>()

export type Status =
  | ReturnType<typeof Status.Pending>
  | ReturnType<typeof Status.Resolved>
  | ReturnType<typeof Status.Ambiguous>
  | ReturnType<typeof Status.NotFound>

// --- Core data structures using Data.case ---
export interface Mention {
  readonly id: MentionId
  readonly text: string
  readonly norm: string // normalized text
  readonly span: Span
  readonly src: string // source text
  readonly hint?: EntityType
  readonly status: Status
}

export const Mention = Data.case<Mention>()

export interface Candidate {
  readonly uri: EntityUri
  readonly name: string
  readonly type: EntityType
  readonly score: number // 0-1 confidence
  readonly method: Method
  readonly mentionId: MentionId
  readonly meta: Metadata
  readonly alts: ReadonlyArray<AltName>
  readonly ts: DateTime.Utc
}

export const Candidate = Data.case<Candidate>()

// --- Resolution events with generics ---
// This one uses generics, so we need the interface approach
export type Event<M = Mention, C = Candidate> = Data.TaggedEnum<{
  MentionsFound: { readonly mentions: ReadonlyArray<M> }
  CandidateFound: { readonly mention: M; readonly candidate: C }
  Resolved: { readonly mention: M; readonly entity: EntityUri; readonly confidence: number }
  NoMatch: { readonly mention: M }
  Error: { readonly mention: M; readonly error: unknown }
}>

export interface EventDef extends Data.TaggedEnum.WithGenerics<2> {
  readonly taggedEnum: Event<this["A"], this["B"]>
}

export const Event = Data.taggedEnum<EventDef>()

// --- Ordering functions ---
export const byScore = Order.mapInput(
  Order.reverse(Order.number),
  (c: Candidate) => c.score
)

export const byTime = Order.mapInput(
  Order.reverse(DateTime.Order),
  (c: Candidate) => c.ts
)

// Pattern matching examples
export const spanText = Match.type<Span>().pipe(
  Match.tag("Point", ({ offset }) => `@${offset}`),
  Match.tag("Range", ({ end, start }) => `[${start}:${end}]`),
  Match.exhaustive
)

export const metaSummary = Match.type<Metadata>().pipe(
  Match.tag("Artist", (m) => {
    const parts: Array<string> = []

    // Use specific artist type
    if (m.type) {
      parts.push(m.type.toLowerCase())
    } else {
      parts.push("artist")
    }

    // Add country/area info
    if (m.country) {
      parts.push(`(${m.country})`)
    } else if (m.area) {
      parts.push(`(${m.area.name})`)
    }

    // Add life span info
    if (m.lifeSpan) {
      if (m.lifeSpan.begin && m.lifeSpan.end) {
        parts.push(`${m.lifeSpan.begin.slice(0, 4)}-${m.lifeSpan.end.slice(0, 4)}`)
      } else if (m.lifeSpan.begin) {
        parts.push(`${m.lifeSpan.ended ? "disbanded" : "formed"} ${m.lifeSpan.begin.slice(0, 4)}`)
      }
    }

    // Add disambiguation if present
    if (m.disambiguation) {
      parts.push(`"${m.disambiguation}"`)
    }

    return parts.join(" ")
  }),
  Match.tag("Recording", (m) => {
    const parts: Array<string> = ["recording"]

    if (m.length) {
      const minutes = Math.floor(m.length / 60000)
      const seconds = Math.floor((m.length % 60000) / 1000)
      parts.push(`(${minutes}:${seconds.toString().padStart(2, "0")})`)
    }

    if (m.disambiguation) {
      parts.push(`"${m.disambiguation}"`)
    }

    return parts.join(" ")
  }),
  Match.tag("Release", (m) => {
    const parts: Array<string> = []

    if (m.status) {
      parts.push(m.status.toLowerCase())
    } else {
      parts.push("release")
    }

    if (m.releaseDate) {
      parts.push(`(${m.releaseDate.slice(0, 4)})`)
    }

    if (m.country) {
      parts.push(m.country)
    }

    if (m.barcode) {
      parts.push(`[${m.barcode}]`)
    }

    return parts.join(" ")
  }),
  Match.tag("ReleaseGroup", (m) => {
    const parts: Array<string> = []

    if (m.type) {
      parts.push(m.type.toLowerCase())
    } else {
      parts.push("release")
    }

    if (m.firstReleaseDate) {
      parts.push(`(${m.firstReleaseDate.slice(0, 4)})`)
    }

    return parts.join(" ")
  }),
  Match.tag("Work", (m) => {
    const type = m.type?.toLowerCase() || "musical work"
    return m.disambiguation ? `${type} "${m.disambiguation}"` : type
  }),
  Match.tag("Label", (m) => {
    const parts: Array<string> = []

    if (m.type) {
      parts.push(m.type.toLowerCase())
    } else {
      parts.push("label")
    }

    if (m.ended) {
      parts.unshift("defunct")
    }

    if (m.area) {
      parts.push(`(${m.area.name})`)
    }

    if (m.labelCode) {
      parts.push(`LC-${m.labelCode}`)
    }

    return parts.join(" ")
  }),
  Match.tag("Area", (m) => {
    const parts: Array<string> = []

    if (m.type) {
      parts.push(m.type.toLowerCase())
    } else {
      parts.push("area")
    }

    if (m.iso1) {
      parts.push(`(${m.iso1})`)
    }

    return parts.join(" ")
  }),
  Match.tag("Genre", (_m) => "genre"),
  Match.tag("Play", (m) => {
    const parts: Array<string> = ["KEXP play"]

    if (m.airdate) {
      parts.push(m.airdate.slice(0, 10))
    }

    if (m.rotationStatus) {
      parts.push(`[${m.rotationStatus}]`)
    }

    if (m.isLive) {
      parts.push("(live)")
    }

    return parts.join(" ")
  }),
  Match.exhaustive
)

export const hasMinScore = (threshold: number) => (c: Candidate): boolean => c.score >= threshold

export const isEntityType = (type: EntityType) => (c: Candidate): boolean => c.type === type

// Example of using $is and $match from taggedEnum
export const isPointSpan = $is("Point")
export const isRangeSpan = $is("Range")

export const spanLength = $match({
  Point: () => 1,
  Range: ({ end, start }) => end - start
})

export const hasMbId = (meta: Metadata): boolean =>
  Match.value(meta).pipe(
    Match.tag("Artist", "Recording", "Release", "ReleaseGroup", "Work", "Label", "Area", "Genre", () => true),
    Match.tag("Play", () => false),
    Match.exhaustive
  )

// Helper to extract MB ID
export const getMbId = (meta: Metadata): string | undefined =>
  Match.value(meta).pipe(
    Match.tag("Artist", (m) => m.mbId),
    Match.tag("Recording", (m) => m.mbId),
    Match.tag("Release", (m) => m.mbId),
    Match.tag("ReleaseGroup", (m) => m.mbId),
    Match.tag("Work", (m) => m.mbId),
    Match.tag("Label", (m) => m.mbId),
    Match.tag("Area", (m) => m.mbId),
    Match.tag("Genre", (m) => m.mbId),
    Match.tag("Play", () => undefined),
    Match.exhaustive
  )
