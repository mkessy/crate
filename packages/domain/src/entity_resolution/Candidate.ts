import type { Chunk, Effect, HashMap } from "effect"
import { Data, Schema } from "effect"
import type { SortedSet } from "effect/SortedSet"
import type {
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
import type { EntityUri, Mention, MentionId } from "./index.js"

export type Method = Schema.Schema.Type<typeof Method>
export const Method = Schema.Literal("search", "trie", "bm25", "semantic", "fuzzy", "llm")

interface TrieScore {
  readonly exactMatch: boolean
  readonly prefixLength: number
}

interface BM25Score {
  readonly score: number
  readonly tf: number
  readonly df: number
}

interface Normalized {
  readonly score: number // 0-1
}

type MethodScore = TrieScore | BM25Score | Normalized

// --- Score Types using Tagged Enum ---
// Define the score type as a tagged enum for pattern matching
export type Score = Data.TaggedEnum<{
  TrieScore: TrieScore
  BM25Score: BM25Score
  Normalized: Normalized
}>

// Create the tagged enum constructors and matchers
export const { $is: $isScore, $match: $matchScore, BM25Score, Normalized, TrieScore } = Data.taggedEnum<Score>()

// --- Base Candidate Interface (Generic over Score type) ---
// Using a class-based approach for better type inference
export class Candidate<S extends MethodScore> extends Data.Class<{
  readonly entityUri: EntityUri
  readonly entityType: EntityType
  readonly displayName: string
  readonly score: S
  readonly method: Method
  readonly mentionId: MentionId
  readonly metadata: HashMap.HashMap<string, unknown>
}> {
}

// --- Hits (what finders emit) ---
export class Hits<S extends MethodScore> extends Data.Class<{
  readonly id: string
  readonly mentionId: MentionId
  readonly method: Method
  readonly totalCount: number
  readonly candidates: SortedSet<Candidate<S>> // Pre-sorted by relevance
  readonly queryTime: number // milliseconds
  readonly metadata?: HashMap.HashMap<string, unknown>
}> {
}

export interface Finder<S extends Score> {
  readonly method: string

  readonly find: (
    mentions: Chunk.Chunk<Mention>
  ) => Effect.Effect<Hits<S>>
}

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

export type EntityMetadata =
  | ReturnType<typeof Metadata.Artist>
  | ReturnType<typeof Metadata.Release>
  | ReturnType<typeof Metadata.ReleaseGroup>
  | ReturnType<typeof Metadata.Recording>
  | ReturnType<typeof Metadata.Work>
  | ReturnType<typeof Metadata.Label>
  | ReturnType<typeof Metadata.Area>
  | ReturnType<typeof Metadata.Genre>
  | ReturnType<typeof Metadata.Play>
