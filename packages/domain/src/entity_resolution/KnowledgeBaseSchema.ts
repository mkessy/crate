import { ParseResult, Schema } from "effect"
import { KexpTrackPlay } from "../kexp/schemas.js"
import * as RDF from "../rdf/Entity.js"

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

// Use RDF EntityURI instead of custom EntityUri
export type EntityUri = RDF.EntityURI
export const EntityUri = RDF.EntityURI
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

// crate://rel/<subj_entity_type>/<subj_id>/<predicate>/<obj_entity_type>/<obj_id>

// Helper functions to create entity URIs using the parser
export const createEntityUri = (entityType: EntityType, id: string): EntityUri =>
  RDF.EntityURI.make(`crate://${entityType}/${id}`)


// Base entity shape extending RDF Entity
export const BaseEntity = Schema.Struct({
  id: EntityUri, // Use RDF EntityURI as id
  type: Schema.String, // Keep type from RDF Entity
  entity_uri: EntityUri, // Our legacy field for compatibility
  name: Schema.String,
  metadata: Schema.NullOr(Schema.String),
  kexp_play_id: Schema.NullOr(Schema.Int)
})

// --- Entity Schemas ---

// RecordingEntity schema extending RDF Entity
export const RecordingEntity = Schema.TaggedStruct("recording", {
  ...BaseEntity.fields,
  type: Schema.Literal("recording"), // Override RDF Entity type
  release_date: Schema.NullOr(Schema.String)
})
export type RecordingEntity = Schema.Schema.Type<typeof RecordingEntity>
export const isRecordingEntity = Schema.is(RecordingEntity)

// ReleaseEntity schema extending RDF Entity
export const ReleaseEntity = Schema.TaggedStruct("release", {
  ...BaseEntity.fields,
  type: Schema.Literal("release") // Override RDF Entity type
})
export type ReleaseEntity = Schema.Schema.Type<typeof ReleaseEntity>
export const isReleaseEntity = Schema.is(ReleaseEntity)

// ReleaseGroupEntity schema extending RDF Entity
export const ReleaseGroupEntity = Schema.TaggedStruct("release_group", {
  ...BaseEntity.fields,
  type: Schema.Literal("release_group") // Override RDF Entity type
})
export type ReleaseGroupEntity = Schema.Schema.Type<typeof ReleaseGroupEntity>
export const isReleaseGroupEntity = Schema.is(ReleaseGroupEntity)

// WorkEntity schema extending RDF Entity
export const WorkEntity = Schema.TaggedStruct("work", {
  ...BaseEntity.fields,
  type: Schema.Literal("work") // Override RDF Entity type
})
export type WorkEntity = Schema.Schema.Type<typeof WorkEntity>
export const isWorkEntity = Schema.is(WorkEntity)

// LabelEntity schema extending RDF Entity
export const LabelEntity = Schema.TaggedStruct("label", {
  ...BaseEntity.fields,
  type: Schema.Literal("label") // Override RDF Entity type
})
export type LabelEntity = Schema.Schema.Type<typeof LabelEntity>
export const isLabelEntity = Schema.is(LabelEntity)

// AreaEntity schema extending RDF Entity
export const AreaEntity = Schema.TaggedStruct("area", {
  ...BaseEntity.fields,
  type: Schema.Literal("area") // Override RDF Entity type
}).pipe(Schema.omit("kexp_play_id"))
export type AreaEntity = Schema.Schema.Type<typeof AreaEntity>
export const isAreaEntity = Schema.is(AreaEntity)

// GenreEntity schema extending RDF Entity
export const GenreEntity = Schema.TaggedStruct("genre", {
  ...BaseEntity.fields,
  type: Schema.Literal("genre") // Override RDF Entity type
}).pipe(Schema.omit("kexp_play_id"))
export type GenreEntity = Schema.Schema.Type<typeof GenreEntity>
export const isGenreEntity = Schema.is(GenreEntity)

// PlayEntity schema extending RDF Entity
export const PlayEntity = Schema.TaggedStruct("play", {
  ...BaseEntity.fields,
  type: Schema.Literal("play"), // Override RDF Entity type
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
  decode: (play) => {
    const entityUri = createEntityUri("play", String(play.id))
    return ParseResult.succeed(PlayEntity.make({
      _tag: "play",
      id: entityUri,
      type: "play",
      entity_uri: entityUri,
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
    }))
  },
  encode: (_play, _ast, domain) => {
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

// ArtistEntity schema extending RDF Entity
export const ArtistEntity = Schema.TaggedStruct("artist", {
  ...BaseEntity.fields,
  type: Schema.Literal("artist"), // Override RDF Entity type
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

export type Entity = Schema.Schema.Type<typeof Entity>
export const Entity = Schema.Union(Schema.Data(PlayEntity), Schema.Data(ArtistEntity), NonArtistEntity)

export const HashsetNonArtistEntity = NonArtistEntity.pipe(Schema.HashSet)
