import { Model } from "@effect/sql"
import { Equal, Hash, Schema } from "effect"

// Play ID branded type
export const PlayId = Schema.Number.pipe(Schema.brand("play_id"))
export type PlayId = Schema.Schema.Type<typeof PlayId>

// Show ID branded type
export const ShowId = Schema.Number.pipe(Schema.brand("show_id"))
export type ShowId = Schema.Schema.Type<typeof ShowId>

// Play type literal
export const PlayType = Schema.Literal("trackplay", "nontrackplay")
export type PlayType = Schema.Schema.Type<typeof PlayType>

// Rotation status - using string for flexibility as values may vary
export const RotationStatus = Schema.String.pipe(Schema.brand("rotation_status"))
export type RotationStatus = Schema.Schema.Type<typeof RotationStatus>

// MB IDs for joining
export const MBArtistId = Schema.String.pipe(Schema.brand("mb_artist_id"))
export type MBArtistId = Schema.Schema.Type<typeof MBArtistId>

export const MBRecordingId = Schema.String.pipe(Schema.brand("mb_recording_id"))
export type MBRecordingId = Schema.Schema.Type<typeof MBRecordingId>

export const MBReleaseId = Schema.String.pipe(Schema.brand("mb_release_id"))
export type MBReleaseId = Schema.Schema.Type<typeof MBReleaseId>

// Main FactPlay model matching the database schema
export class FactPlay extends Model.Class<FactPlay>("FactPlay")({
  id: PlayId,
  airdate: Schema.String,
  show: ShowId,
  show_uri: Schema.String,
  image_uri: Schema.NullOr(Schema.String),
  thumbnail_uri: Schema.NullOr(Schema.String),
  song: Schema.NullOr(Schema.String),
  track_id: Schema.NullOr(Schema.String),
  recording_id: Schema.NullOr(Schema.String),
  artist: Schema.NullOr(Schema.String),
  artist_ids: Schema.NullOr(Schema.String), // JSON string of array
  album: Schema.NullOr(Schema.String),
  release_id: Schema.NullOr(Schema.String),
  release_group_id: Schema.NullOr(Schema.String),
  labels: Schema.NullOr(Schema.String),
  label_ids: Schema.NullOr(Schema.String), // JSON string of array
  release_date: Schema.NullOr(Schema.String),
  rotation_status: Schema.NullOr(Schema.String),
  is_local: Model.BooleanFromNumber,
  is_request: Model.BooleanFromNumber,
  is_live: Model.BooleanFromNumber,
  comment: Schema.NullOr(Schema.String),
  play_type: Schema.NullOr(PlayType),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) implements Equal.Equal {
  [Equal.symbol](that: Equal.Equal): boolean {
    if (that instanceof FactPlay) {
      return this.id === that.id
    }
    return false
  }
  
  [Hash.symbol](): number {
    return Hash.hash(this.id)
  }

  // Helper to parse artist_ids JSON
  get parsedArtistIds(): string[] {
    if (!this.artist_ids) return []
    try {
      return JSON.parse(this.artist_ids) as string[]
    } catch {
      return []
    }
  }

  // Helper to parse label_ids JSON
  get parsedLabelIds(): string[] {
    if (!this.label_ids) return []
    try {
      return JSON.parse(this.label_ids) as string[]
    } catch {
      return []
    }
  }
}

// Date range schema for queries
export const DateRange = Schema.Struct({
  start_date: Schema.String,
  end_date: Schema.String
})
export type DateRange = Schema.Schema.Type<typeof DateRange>

// Pagination schema
export const Pagination = Schema.Struct({
  limit: Schema.Number.pipe(Schema.positive()),
  offset: Schema.Number.pipe(Schema.nonNegative())
})
export type Pagination = Schema.Schema.Type<typeof Pagination>

// Schema for enriched play data with MB information
export class FactPlayWithMB extends Schema.Class<FactPlayWithMB>("FactPlayWithMB")({ 
  // FactPlay fields
  play_id: PlayId,
  airdate: Schema.String,
  show: ShowId,
  song: Schema.NullOr(Schema.String),
  artist: Schema.NullOr(Schema.String),
  album: Schema.NullOr(Schema.String),
  rotation_status: Schema.NullOr(Schema.String),
  is_local: Model.BooleanFromNumber,
  is_request: Model.BooleanFromNumber,
  is_live: Model.BooleanFromNumber,
  // MB enriched data
  mb_artist_name: Schema.NullOr(Schema.String),
  mb_artist_disambiguation: Schema.NullOr(Schema.String),
  mb_recording_name: Schema.NullOr(Schema.String),
  mb_release_name: Schema.NullOr(Schema.String),
  mb_release_date: Schema.NullOr(Schema.String)
}) {}

// Schema for artist plays with related entities
export class ArtistPlayWithRelatedEntities extends Schema.Class<ArtistPlayWithRelatedEntities>("ArtistPlayWithRelatedEntities")({
  play_id: PlayId,
  airdate: Schema.String,
  song: Schema.NullOr(Schema.String),
  album: Schema.NullOr(Schema.String),
  // Related entities from mb_master_lookup
  related_entity_type: Schema.NullOr(Schema.String),
  related_entity_name: Schema.NullOr(Schema.String),
  relation_type: Schema.NullOr(Schema.String)
}) {}
