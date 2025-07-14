// Location: packages/domain/src/entity_resolution/schemas.ts

import { Data, Match, Schema } from "effect"
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
import type { EntityMetadata } from "./Candidate.js"

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

export const metaSummary = Match.type<EntityMetadata>().pipe(
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

export const hasMbId = (meta: EntityMetadata): boolean =>
  Match.value(meta).pipe(
    Match.tag("Artist", "Recording", "Release", "ReleaseGroup", "Work", "Label", "Area", "Genre", () => true),
    Match.tag("Play", () => false),
    Match.exhaustive
  )

// Helper to extract MB ID
export const getMbId = (meta: EntityMetadata): string | undefined =>
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
