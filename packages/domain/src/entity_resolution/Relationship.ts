import { ParseResult, Schema } from "effect"
import {
  createEntityUri,
  EntityType,
  EntityUriPrefix,
  MbAreaId,
  MbArtistId,
  MbGenreId,
  MbLabelId,
  MbRecordingId,
  MbReleaseGroupId,
  MbReleaseId,
  MbWorkId,
  NonArtistEntity
} from "./Entity.js"
import { PredicateType } from "./Predicate.js"

export const RelationsUriParser = Schema.TemplateLiteralParser(
  EntityUriPrefix,
  Schema.Literal("rel"),
  Schema.Literal("/"),
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
  ),
  Schema.Literal("/"),
  PredicateType,
  Schema.Literal("/"),
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
export type RelationsUriParser = Schema.Schema.Type<typeof RelationsUriParser>

export type RelationsUri = Schema.Schema.Type<typeof RelationsUri>
export const RelationsUri = Schema.String.pipe(Schema.brand("RelationsUri"))

// Relationship between entities
export const Relationship = Schema.Struct({
  subject_id: Schema.String,
  subject_type: EntityType,
  subject_name: Schema.String,
  predicate: PredicateType,
  object_id: Schema.String,
  object_type: EntityType,
  object_name: Schema.String,
  attribute_type: Schema.NullOr(Schema.String),
  source: Schema.Literal("musicbrainz", "kexp"),
  kexp_play_id: Schema.NullOr(Schema.Number)
})
export type Relationship = Schema.Schema.Type<typeof Relationship>

export type NonArtistRelationship = Schema.Schema.Type<typeof NonArtistRelationship>
export const NonArtistRelationship = Schema.Struct({
  ...Relationship.fields,
  object_type: EntityType.pipe(
    Schema.pickLiteral("recording", "release", "release_group", "work", "label", "area", "genre")
  )
})

export type ArtistRelationship = Schema.Schema.Type<typeof ArtistRelationship>
export const ArtistRelationship = Schema.Struct({
  ...Relationship.fields,
  subject_type: Schema.Literal("artist")
}).pipe(Schema.brand("Relationship/Artist"))

export type RecordingRelationship = Schema.Schema.Type<typeof RecordingRelationship>
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
          "Cannot encode relationship from entity"
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
