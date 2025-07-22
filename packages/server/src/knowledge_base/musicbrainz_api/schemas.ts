import type { EntityResolution } from "@crate/domain"
import { Model } from "@effect/sql"
import type { Either } from "effect"
import { Effect, Schema } from "effect"
import type { ParseError } from "effect/ParseResult"
import { PersistedRelationship } from "../relationships/schemas.js"
import type * as MBSchemas from "./schemas.js"

export type MBArtistFromApiEncoded = Schema.Schema.Encoded<typeof MBArtistFromApi>
export type MBArtistFromApi = Schema.Schema.Type<typeof MBArtistFromApi>
export const MBArtistFromApi = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  "sort-name": Schema.String,
  type: Schema.NullishOr(Schema.String),
  country: Schema.NullishOr(Schema.String),
  disambiguation: Schema.NullishOr(Schema.String),
  // Additional fields from the actual response
  "type-id": Schema.NullishOr(Schema.String),
  "gender": Schema.NullishOr(Schema.String),
  "gender-id": Schema.NullishOr(Schema.String),
  "end-area": Schema.NullishOr(Schema.Unknown),
  "area": Schema.NullishOr(Schema.Unknown),
  "begin-area": Schema.NullishOr(Schema.Unknown),
  "life-span": Schema.optional(Schema.Struct({
    "begin": Schema.NullishOr(Schema.String),
    "end": Schema.NullishOr(Schema.String),
    "ended": Schema.Boolean
  })),
  aliases: Schema.NullishOr(Schema.Array(Schema.Unknown)),
  ipis: Schema.NullishOr(Schema.Array(Schema.Unknown)),
  isnis: Schema.NullishOr(Schema.Array(Schema.Unknown)),
  relations: Schema.Array(Schema.Struct({
    type: Schema.String,
    direction: Schema.String,
    "target-type": Schema.String,
    "target-credit": Schema.String,
    "source-credit": Schema.String,
    begin: Schema.NullishOr(Schema.String),
    end: Schema.NullishOr(Schema.String),
    ended: Schema.Boolean,
    "type-id": Schema.String,
    attributes: Schema.Array(Schema.Unknown),
    "attribute-values": Schema.Record({ key: Schema.String, value: Schema.Unknown }),
    "attribute-ids": Schema.Record({ key: Schema.String, value: Schema.Unknown }),
    // Different relation types have different target structures
    // URL relations have a url field
    url: Schema.optional(Schema.Struct({
      id: Schema.String,
      resource: Schema.String
    })),
    // Artist relations have an artist field
    artist: Schema.optional(Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      "sort-name": Schema.String,
      disambiguation: Schema.NullishOr(Schema.String)
    })),
    // Work relations have a work field
    work: Schema.optional(Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      disambiguation: Schema.NullishOr(Schema.String)
    })),
    // Recording relations have a recording field
    recording: Schema.optional(Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      disambiguation: Schema.NullishOr(Schema.String),
      length: Schema.NullishOr(Schema.Number)
    })),
    // Release relations have a release field
    release: Schema.optional(Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      disambiguation: Schema.NullishOr(Schema.String)
    })),
    "release-group": Schema.optional(Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      disambiguation: Schema.NullishOr(Schema.String)
    })),
    genre: Schema.optional(Schema.Struct({
      id: Schema.String,
      name: Schema.String
    })),
    label: Schema.optional(Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      disambiguation: Schema.NullishOr(Schema.String)
    })),
    area: Schema.optional(Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      disambiguation: Schema.NullishOr(Schema.String)
    }))
  }))
})

export type UnresolvedMBArtistEncoded = Schema.Schema.Encoded<typeof UnresolvedMBArtist>
export class UnresolvedMBArtist extends Model.Class<UnresolvedMBArtist>("UnresolvedMBArtist")({
  id: Model.Generated(Schema.Number),
  artist_mb_id: Schema.String,
  artist: Schema.String,
  source: Schema.Literal("musicbrainz", "kexp_fact_plays"),
  kexp_play_id: Schema.NullOr(Schema.Number),
  latest_play: Model.DateTimeInsert,
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export type MBArtistResponseEncoded = Schema.Schema.Encoded<typeof MBArtistResponse>
export const MBArtistResponse = MBArtistFromApi
export type MBArtistResponse = Schema.Schema.Type<typeof MBArtistResponse>

export const relationsFromMBArtist = (
  artist: MBSchemas.MBArtistFromApi,
  kexpPlayId: number | null
): Effect.Effect<
  ReadonlyArray<Either.Either<Schema.Schema.Type<typeof PersistedRelationship.insert>, ParseError>>
> =>
  Effect.forEach(artist.relations, (relation) =>
    Effect.gen(function*() {
      const targetType = relation["target-type"]

      // Extract target entity information based on the target type
      // Each relation type has its own field (url, artist, work, recording, etc.)
      let objectId: string
      let objectName: string

      if (relation.artist && targetType === "artist") {
        objectId = relation.artist.id
        objectName = relation.artist.name
      } else if (relation.work && targetType === "work") {
        objectId = relation.work.id
        objectName = relation.work.title
      } else if (relation.recording && targetType === "recording") {
        objectId = relation.recording.id
        objectName = relation.recording.title
      } else if (relation.release && targetType === "release") {
        objectId = relation.release.id
        objectName = relation.release.title
      } else if (relation["release-group"] && targetType === "release-group") {
        objectId = relation["release-group"].id
        objectName = relation["release-group"].title
      } else if (relation.genre && targetType === "genre") {
        objectId = relation.genre.id
        objectName = relation.genre.name
      } else if (relation.label && targetType === "label") {
        objectId = relation.label.id
        objectName = relation.label.name
      } else if (relation.area && targetType === "area") {
        objectId = relation.area.id
        objectName = relation.area.name
      }

      // Normalize attribute handling
      const attributes = relation.attributes || []
      const attributeType = attributes.length > 0
        ? JSON.stringify(attributes)
        : null // Use null instead of '[]' for empty attributes

      const result = yield* Effect.either(Effect.try({
        try: () =>
          PersistedRelationship.insert.make({
            subject_id: artist.id,
            subject_type: "artist",
            subject_name: artist.name,
            predicate: relation.type as EntityResolution.PredicateType,
            object_id: objectId,
            object_type: targetType === "release-group" ? "release_group" : targetType as EntityResolution.EntityType,
            object_name: objectName,
            attribute_type: attributeType, // Now consistent
            source: "musicbrainz",
            kexp_play_id: kexpPlayId
          }),
        catch: (error) => error as ParseError
      }))
      return result
    }), { concurrency: "unbounded" })

// ==========================================
// MUSICBRAINZ SERVICE
// ==========================================

/*
You can request relationships with the appropriate includes:

 - area-rels
 - artist-rels
 - event-rels
 - genre-rels
 - instrument-rels
 - label-rels
 - place-rels
 - recording-rels
 - release-rels
 - release-group-rels
 - series-rels
 - url-rels
 - work-rels
 */
