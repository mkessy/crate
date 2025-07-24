// packages/domain/src/entity_resolution/KnowledgeBase/Entity.ts

import { Schema } from "effect"
import type { ExtractEntityType } from "../../rdf/Entity.js"
import { Entity, WithMetadata } from "../../rdf/index.js"

// Metadata Schemas
type ArtistMetaData = Schema.Schema.Type<typeof ArtistMetaData>
const ArtistMetaData = Schema.Struct({
  name: Schema.String,
  disambiguation: Schema.NullOr(Schema.String),
  aliases: Schema.Array(Schema.String),
  artist_type: Schema.Literal("person", "group", "orchestra", "choir", "character", "other"),
  gender: Schema.NullOr(Schema.String),
  country: Schema.NullOr(Schema.String),
  begin_date: Schema.NullOr(Schema.String),
  end_date: Schema.NullOr(Schema.String),
  ended: Schema.Boolean
})

type PlayEntityMetaData = Schema.Schema.Type<typeof PlayEntityMetaData>
const PlayEntityMetaData = Schema.Struct({
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

type RecordingEntityMetaData = Schema.Schema.Type<typeof RecordingEntityMetaData>
const RecordingEntityMetaData = Schema.Struct({
  release_date: Schema.NullOr(Schema.String)
})

type ReleaseEntityMetaData = Schema.Schema.Type<typeof ReleaseEntityMetaData>
const ReleaseEntityMetaData = Schema.Struct({})

type ReleaseGroupEntityMetaData = Schema.Schema.Type<typeof ReleaseGroupEntityMetaData>
const ReleaseGroupEntityMetaData = Schema.Struct({})

type WorkEntityMetaData = Schema.Schema.Type<typeof WorkEntityMetaData>
const WorkEntityMetaData = Schema.Struct({})

type LabelEntityMetaData = Schema.Schema.Type<typeof LabelEntityMetaData>
const LabelEntityMetaData = Schema.Struct({})

type AreaEntityMetaData = Schema.Schema.Type<typeof AreaEntityMetaData>
const AreaEntityMetaData = Schema.Struct({})

type GenreEntityMetaData = Schema.Schema.Type<typeof GenreEntityMetaData>
const GenreEntityMetaData = Schema.Struct({})

// New Metadata Schemas
type InstrumentEntityMetaData = Schema.Schema.Type<typeof InstrumentEntityMetaData>
const InstrumentEntityMetaData = Schema.Struct({
  description: Schema.NullOr(Schema.String),
  instrument_type: Schema.String
})

type PlaceEntityMetaData = Schema.Schema.Type<typeof PlaceEntityMetaData>
const PlaceEntityMetaData = Schema.Struct({
  address: Schema.NullOr(Schema.String),
  coordinates: Schema.optional(Schema.Struct({ lat: Schema.Number, lon: Schema.Number }))
})

type EventEntityMetaData = Schema.Schema.Type<typeof EventEntityMetaData>
const EventEntityMetaData = Schema.Struct({
  time: Schema.NullOr(Schema.String),
  cancelled: Schema.Boolean
})

type SeriesEntityMetaData = Schema.Schema.Type<typeof SeriesEntityMetaData>
const SeriesEntityMetaData = Schema.Struct({
  series_type: Schema.String
})

// Basic Entity makers
const MakeArtistEntity = Entity.MakeClass("artist")
const MakeRecordingEntity = Entity.MakeClass("recording")
const MakeReleaseEntity = Entity.MakeClass("release")
const MakeReleaseGroupEntity = Entity.MakeClass("release_group")
const MakeWorkEntity = Entity.MakeClass("work")
const MakeLabelEntity = Entity.MakeClass("label")
const MakeAreaEntity = Entity.MakeClass("area")
const MakeGenreEntity = Entity.MakeClass("genre")
// New Basic Entity Makers
const MakeInstrumentEntity = Entity.MakeClass("instrument")
const MakePlaceEntity = Entity.MakeClass("place")
const MakeEventEntity = Entity.MakeClass("event")
const MakeSeriesEntity = Entity.MakeClass("series")

// WithMetadata Entity makers
const MakeArtistWithMetadata = WithMetadata.MakeWithMetadataClass<ArtistMetaData, "artist">({
  type: "artist",
  schema: ArtistMetaData
})

const MakePlayEntity = WithMetadata.MakeWithMetadataClass<PlayEntityMetaData, "play">({
  type: "play",
  schema: PlayEntityMetaData
})

const MakeRecordingWithMetadata = WithMetadata.MakeWithMetadataClass<RecordingEntityMetaData, "recording">({
  type: "recording",
  schema: RecordingEntityMetaData
})

const MakeReleaseWithMetadata = WithMetadata.MakeWithMetadataClass<ReleaseEntityMetaData, "release">({
  type: "release",
  schema: ReleaseEntityMetaData
})

const MakeReleaseGroupWithMetadata = WithMetadata.MakeWithMetadataClass<
  ReleaseGroupEntityMetaData,
  "release_group"
>({
  type: "release_group",
  schema: ReleaseGroupEntityMetaData
})

const MakeWorkWithMetadata = WithMetadata.MakeWithMetadataClass<WorkEntityMetaData, "work">({
  type: "work",
  schema: WorkEntityMetaData
})

const MakeLabelWithMetadata = WithMetadata.MakeWithMetadataClass<LabelEntityMetaData, "label">({
  type: "label",
  schema: LabelEntityMetaData
})

const MakeAreaWithMetadata = WithMetadata.MakeWithMetadataClass<AreaEntityMetaData, "area">({
  type: "area",
  schema: AreaEntityMetaData
})

const MakeGenreWithMetadata = WithMetadata.MakeWithMetadataClass<GenreEntityMetaData, "genre">({
  type: "genre",
  schema: GenreEntityMetaData
})

// New WithMetadata Entity Makers
const MakeInstrumentWithMetadata = WithMetadata.MakeWithMetadataClass<InstrumentEntityMetaData, "instrument">({
  type: "instrument",
  schema: InstrumentEntityMetaData
})

const MakePlaceWithMetadata = WithMetadata.MakeWithMetadataClass<PlaceEntityMetaData, "place">({
  type: "place",
  schema: PlaceEntityMetaData
})

const MakeEventWithMetadata = WithMetadata.MakeWithMetadataClass<EventEntityMetaData, "event">({
  type: "event",
  schema: EventEntityMetaData
})

const MakeSeriesWithMetadata = WithMetadata.MakeWithMetadataClass<SeriesEntityMetaData, "series">({
  type: "series",
  schema: SeriesEntityMetaData
})

// Type extractors
type ArtistEntityType = ExtractEntityType<typeof MakeArtistWithMetadata>
type PlayEntityType = ExtractEntityType<typeof MakePlayEntity>
type RecordingEntityType = ExtractEntityType<typeof MakeRecordingWithMetadata>
type ReleaseEntityType = ExtractEntityType<typeof MakeReleaseWithMetadata>
type ReleaseGroupEntityType = ExtractEntityType<typeof MakeReleaseGroupWithMetadata>
type WorkEntityType = ExtractEntityType<typeof MakeWorkWithMetadata>
type LabelEntityType = ExtractEntityType<typeof MakeLabelWithMetadata>
type AreaEntityType = ExtractEntityType<typeof MakeAreaWithMetadata>
type GenreEntityType = ExtractEntityType<typeof MakeGenreWithMetadata>
// New Entity Types
type InstrumentEntityType = ExtractEntityType<typeof MakeInstrumentWithMetadata>
type PlaceEntityType = ExtractEntityType<typeof MakePlaceWithMetadata>
type EventEntityType = ExtractEntityType<typeof MakeEventWithMetadata>
type SeriesEntityType = ExtractEntityType<typeof MakeSeriesWithMetadata>

type EntityType =
  | ArtistEntityType
  | PlayEntityType
  | RecordingEntityType
  | ReleaseEntityType
  | ReleaseGroupEntityType
  | WorkEntityType
  | LabelEntityType
  | AreaEntityType
  | GenreEntityType
  | InstrumentEntityType
  | PlaceEntityType
  | EventEntityType
  | SeriesEntityType

// Export all entity makers and types
export {
  type AreaEntityMetaData,
  type AreaEntityType,
  type ArtistEntityType,
  type ArtistMetaData,
  type EntityType,
  type EventEntityMetaData,
  type EventEntityType,
  type GenreEntityMetaData,
  type GenreEntityType,
  type InstrumentEntityMetaData,
  type InstrumentEntityType,
  type LabelEntityMetaData,
  type LabelEntityType,
  MakeAreaEntity,
  MakeAreaWithMetadata,
  MakeArtistEntity,
  MakeArtistWithMetadata,
  MakeEventEntity,
  MakeEventWithMetadata,
  MakeGenreEntity,
  MakeGenreWithMetadata,
  MakeInstrumentEntity,
  MakeInstrumentWithMetadata,
  MakeLabelEntity,
  MakeLabelWithMetadata,
  MakePlaceEntity,
  MakePlaceWithMetadata,
  MakePlayEntity,
  MakeRecordingEntity,
  MakeRecordingWithMetadata,
  MakeReleaseEntity,
  MakeReleaseGroupEntity,
  MakeReleaseGroupWithMetadata,
  MakeReleaseWithMetadata,
  MakeSeriesEntity,
  MakeSeriesWithMetadata,
  MakeWorkEntity,
  MakeWorkWithMetadata,
  type PlaceEntityMetaData,
  type PlaceEntityType,
  type PlayEntityMetaData,
  type PlayEntityType,
  type RecordingEntityMetaData,
  type RecordingEntityType,
  type ReleaseEntityMetaData,
  type ReleaseEntityType,
  type ReleaseGroupEntityMetaData,
  type ReleaseGroupEntityType,
  type SeriesEntityMetaData,
  type SeriesEntityType,
  type WorkEntityMetaData,
  type WorkEntityType
}
