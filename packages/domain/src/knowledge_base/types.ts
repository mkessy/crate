import { ParseResult, Schema } from "effect"
import { createEntityUri } from "../entity_resolution/index.js"
import { PredicateType } from "../entity_resolution/predicate.js"
import { EntityResolution } from "../index.js"

// Artist entity
export const Artist = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("artist"),
  disambiguation: Schema.NullOr(Schema.String),
  sort_name: Schema.NullOr(Schema.String),
  artist_type: Schema.NullOr(Schema.String),
  gender: Schema.NullOr(Schema.String),
  country: Schema.NullOr(Schema.String),
  begin_date: Schema.NullOr(Schema.String),
  end_date: Schema.NullOr(Schema.String),
  ended: Schema.NullOr(Schema.Boolean),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Artist = Schema.Schema.Type<typeof Artist>
export const isArtist = Schema.is(Artist)

// =============================================
// Relationship Types
// =============================================

// Predicate types from MusicBrainz relationships

// Relationship between entities
export const Relationship = Schema.Struct({
  subject_id: Schema.String,
  subject_type: EntityResolution.EntityType,
  subject_name: Schema.String,
  predicate: PredicateType,
  object_id: Schema.String,
  object_type: EntityResolution.EntityType,
  object_name: Schema.String,
  attribute_type: Schema.NullOr(Schema.String),
  source: Schema.Literal("musicbrainz", "kexp"),
  kexp_play_id: Schema.NullOr(Schema.Number)
})
export type Relationship = Schema.Schema.Type<typeof Relationship>

export type NonArtistRelationship = Schema.Schema.Type<typeof NonArtistRelationship>
export const NonArtistRelationship = Schema.Struct({
  ...Relationship.fields,
  object_type: EntityResolution.EntityType.pipe(
    Schema.pickLiteral("recording", "release", "release_group", "work", "label", "area", "genre")
  )
})

export const ArtistRelationship = Schema.Struct({
  ...Relationship.fields,
  subject_type: Schema.Literal("artist")
}).pipe(Schema.brand("Relationship/Artist"))

export const RecordingRelationship = Schema.Struct({
  ...Relationship.fields,
  object_type: Schema.Literal("recording")
}).pipe(Schema.brand("Relationship/Recording"))

export type ArtistRecordingRelationship = Schema.Schema.Type<typeof ArtistRecordingRelationship>
export const ArtistRecordingRelationship = Schema.Struct({
  ...Relationship.fields,
  subject_type: Schema.Literal("artist"),
  object_type: Schema.Literal("recording")
}).pipe(Schema.brand("Relationship/ArtistRecording"))

const { NonArtistEntity } = EntityResolution

export const EntityFromNonArtistRelationship = Schema.transformOrFail(
  NonArtistRelationship,
  NonArtistEntity,
  {
    strict: true,
    decode: (relationship) => {
      const entity = Schema.decodeSync(NonArtistEntity)({
        _tag: relationship.object_type,
        entity_uri: createEntityUri(relationship.object_type, relationship.object_id),
        name: relationship.object_name,
        metadata: null,
        release_date: null,
        kexp_play_id: relationship.kexp_play_id
      })
      return ParseResult.succeed(entity)
    },
    encode: (domain, _, ast) => {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          domain,
          "Cannot encode to persisted shape from domain shape"
        )
      )
    }
  }
)

// Search and Normalization

export type ArtistCacheView = Schema.Schema.Type<typeof ArtistCacheView>
export const ArtistCacheView = Schema.Struct({
  artist_id: Schema.String,
  total_plays: Schema.Number,
  recent_plays: Schema.Number,
  last_played: Schema.String,
  unique_albums: Schema.Number,
  unique_releases: Schema.Number,
  plays_this_year: Schema.Number,
  cache_score: Schema.Number
})
