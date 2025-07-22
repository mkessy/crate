import { ParseResult, Schema } from "effect"
import type { Relationship } from "../knowledge_base/types.js"
import { PredicateType } from "./predicate.js"

import { KexpTrackPlay } from "../kexp/schemas.js"

export const EntityType = Schema.Literal(
  "recording",
  "work",
  "area",
  "artist",
  "release",
  "genre",
  "label",
  "release_group",
  // KEXP play instance
  "play"
)
export type EntityType = Schema.Schema.Type<typeof EntityType>

// Branded IDs for type safety
export const MbRecordingId = Schema.String.pipe(Schema.brand("mb_recording_id"))
export type MbRecordingId = Schema.Schema.Type<typeof MbRecordingId>

export const MbReleaseId = Schema.String.pipe(Schema.brand("mb_release_id"))
export type MbReleaseId = Schema.Schema.Type<typeof MbReleaseId>

export const MbReleaseGroupId = Schema.String.pipe(Schema.brand("mb_release_group_id"))
export type MbReleaseGroupId = Schema.Schema.Type<typeof MbReleaseGroupId>

export const MbLabelId = Schema.String.pipe(Schema.brand("mb_label_id"))
export type MbLabelId = Schema.Schema.Type<typeof MbLabelId>

export const MbArtistId = Schema.String.pipe(Schema.brand("mb_artist_id"))
export type MbArtistId = Schema.Schema.Type<typeof MbArtistId>

export const MbAreaId = Schema.String.pipe(Schema.brand("mb_area_id"))
export type MbAreaId = Schema.Schema.Type<typeof MbAreaId>

export const MbGenreId = Schema.String.pipe(Schema.brand("mb_genre_id"))
export type MbGenreId = Schema.Schema.Type<typeof MbGenreId>

export const MbWorkId = Schema.String.pipe(Schema.brand("mb_work_id"))
export type MbWorkId = Schema.Schema.Type<typeof MbWorkId>

export const EntityUriPrefix = Schema.Literal("crate://")
export type EntityUriPrefix = Schema.Schema.Type<typeof EntityUriPrefix>
export type EntityUri = Schema.Schema.Type<typeof EntityUri>
export const EntityUri = Schema.String.pipe(Schema.brand("EntityUri"))

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

// crate://rel//artist_id/predicate/object_type/object_id
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

// === Artist Cache View ===

export const createRelationsUri = (relation: Relationship): string =>
  Schema.encodeSync(RelationsUriParser)(
    [
      "crate://",
      "rel",
      "/",
      relation.subject_type,
      "/",
      relation.subject_id,
      "/",
      relation.predicate,
      "/",
      relation.object_type,
      "/",
      relation.object_id
    ] as const
  )

// Helper functions to create entity URIs using the parser
export const createEntityUri = (entityType: EntityType, id: string) =>
  EntityUri.make(Schema.encodeSync(EntityUriParser)(["crate://", entityType, "/", id] as const))

// Base entity shape
export const BaseEntity = Schema.Struct({
  entity_uri: EntityUri,
  name: Schema.String,
  metadata: Schema.NullOr(Schema.String),
  kexp_play_id: Schema.NullOr(Schema.Int)
})

// --- Entity Schemas ---

// RecordingEntity schema
export const RecordingEntity = Schema.TaggedStruct("recording", {
  ...BaseEntity.fields,
  release_date: Schema.NullOr(Schema.String)
})
export type RecordingEntity = Schema.Schema.Type<typeof RecordingEntity>
export const isRecordingEntity = Schema.is(RecordingEntity)

// ReleaseEntity schema
export const ReleaseEntity = Schema.TaggedStruct("release", {
  ...BaseEntity.fields
})
export type ReleaseEntity = Schema.Schema.Type<typeof ReleaseEntity>
export const isReleaseEntity = Schema.is(ReleaseEntity)

// ReleaseGroupEntity schema
export const ReleaseGroupEntity = Schema.TaggedStruct("release_group", {
  ...BaseEntity.fields
})
export type ReleaseGroupEntity = Schema.Schema.Type<typeof ReleaseGroupEntity>
export const isReleaseGroupEntity = Schema.is(ReleaseGroupEntity)

// WorkEntity schema
export type WorkEntity = Schema.Schema.Type<typeof WorkEntity>
export const WorkEntity = Schema.TaggedStruct("work", {
  ...BaseEntity.fields
})
export const isWorkEntity = Schema.is(WorkEntity)

// LabelEntity schema
export type LabelEntity = Schema.Schema.Type<typeof LabelEntity>
export const LabelEntity = Schema.TaggedStruct("label", {
  ...BaseEntity.fields
})
export const isLabelEntity = Schema.is(LabelEntity)

// AreaEntity schema
export type AreaEntity = Schema.Schema.Type<typeof AreaEntity>
export const AreaEntity = Schema.TaggedStruct("area", {
  ...BaseEntity.fields
}).pipe(Schema.omit("kexp_play_id"))
export const isAreaEntity = Schema.is(AreaEntity)

// GenreEntity schema
export const GenreEntity = Schema.TaggedStruct("genre", {
  ...BaseEntity.fields
}).pipe(Schema.omit("kexp_play_id"))
export type GenreEntity = Schema.Schema.Type<typeof GenreEntity>
export const isGenreEntity = Schema.is(GenreEntity)

// PlayEntity schema
export const PlayEntity = Schema.TaggedStruct("play", {
  ...BaseEntity.fields,
  airdate: Schema.String,
  release_date: Schema.NullOr(Schema.String),
  song: Schema.String,
  artist: Schema.String,
  album: Schema.String,
  show: Schema.Number,
  is_local: Schema.Boolean,
  is_live: Schema.Boolean,
  is_request: Schema.Boolean
})

export const PlayEntityFromKexpPlay = Schema.transformOrFail(KexpTrackPlay, PlayEntity, {
  decode: (play) =>
    ParseResult.succeed(PlayEntity.make({
      _tag: "play",
      entity_uri: createEntityUri("play", String(play.id)),
      name: play.song ?? "[Unknown]",
      metadata: null,
      airdate: play.airdate,
      release_date: null,
      artist: play.artist ?? "[Unknown]",
      album: play.album ?? "[Unknown]",
      show: play.show,
      song: play.song ?? "[Unknown]",
      is_local: play.is_local,
      is_live: play.is_live,
      is_request: play.is_request,
      kexp_play_id: play.id
    })),
  encode: (play, ast, domain) => {
    return ParseResult.fail(
      new ParseResult.Forbidden(
        domain,
        "Cannot encode to domain shape from entity resolution shape"
      )
    )
  }
})
export type PlayEntity = Schema.Schema.Type<typeof PlayEntity>
export const isPlayEntity = Schema.is(PlayEntity)

// ArtistEntity schema
export const ArtistEntity = Schema.TaggedStruct("artist", {
  ...BaseEntity.fields,
  disambiguation: Schema.NullOr(Schema.String),
  aliases: Schema.Array(Schema.String),
  artist_type: Schema.Literal("person", "group", "orchestra", "choir", "character", "other"),
  gender: Schema.NullOr(Schema.String),
  country: Schema.NullOr(Schema.String),
  begin_date: Schema.NullOr(Schema.String),
  end_date: Schema.NullOr(Schema.String),
  ended: Schema.Boolean,
  metadata: Schema.NullOr(Schema.String)
})

export type ArtistEntity = Schema.Schema.Type<typeof ArtistEntity>
export const isArtistEntity = Schema.is(ArtistEntity)

// Union type for all entity schemas

export type NonArtistEntity = Schema.Schema.Type<typeof NonArtistEntity>
export const NonArtistEntity = Schema.Union(
  Schema.Data(RecordingEntity),
  Schema.Data(ReleaseEntity),
  Schema.Data(ReleaseGroupEntity),
  Schema.Data(WorkEntity),
  Schema.Data(LabelEntity),
  Schema.Data(AreaEntity),
  Schema.Data(GenreEntity)
)

export const Entity = Schema.Union(Schema.Data(PlayEntity), Schema.Data(ArtistEntity), NonArtistEntity)

export const HashsetNonArtistEntity = NonArtistEntity.pipe(Schema.HashSet)
