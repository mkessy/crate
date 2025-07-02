import { Model } from "@effect/sql"
import { Schema } from "effect"

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
