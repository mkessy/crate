import { KexpTrackPlay } from "@crate/server/kexp/schemas.js"
import { Model } from "@effect/sql"
import { Equal, Hash, pipe, Schema, String } from "effect"

export type EntityType = Schema.Schema.Type<typeof EntityType>
export const EntityType = Schema.Literal(
  "place",
  "area",
  "genre",
  "artist",
  "recording",
  "release",
  "release_group",
  "label",
  "event",
  "series",
  "work",
  "play",
  "comment",
  "instrument",
  "url"
)

export type PredicateType = Schema.Schema.Type<typeof PredicateType>
export const PredicateType = Schema.String.pipe(Schema.brand("PredicateType"))

export type MbArtistId = Schema.Schema.Type<typeof MbArtistId>
export const MbArtistId = Schema.String.pipe(Schema.brand("MbArtistId"))

export type MbRecordingId = Schema.Schema.Type<typeof MbRecordingId>
export const MbRecordingId = Schema.String.pipe(Schema.brand("MbRecordingId"))

export type MbReleaseId = Schema.Schema.Type<typeof MbReleaseId>
export const MbReleaseId = Schema.String.pipe(Schema.brand("MbReleaseId"))

export type MbReleaseGroupId = Schema.Schema.Type<typeof MbReleaseGroupId>
export const MbReleaseGroupId = Schema.String.pipe(Schema.brand("MbReleaseGroupId"))

export type MbLabelId = Schema.Schema.Type<typeof MbLabelId>
export const MbLabelId = Schema.String.pipe(Schema.brand("MbLabelId"))

export type MbWorkId = Schema.Schema.Type<typeof MbWorkId>
export const MbWorkId = Schema.String.pipe(Schema.brand("MbWorkId"))

export type MbPlayId = Schema.Schema.Type<typeof MbPlayId>
export const MbPlayId = Schema.String.pipe(Schema.brand("MbPlayId"))

export type MbEventId = Schema.Schema.Type<typeof MbEventId>
export const MbEventId = Schema.String.pipe(Schema.brand("MbEventId"))

export type MbSeriesId = Schema.Schema.Type<typeof MbSeriesId>
export const MbSeriesId = Schema.String.pipe(Schema.brand("MbSeriesId"))

const normalizeText = (text: string) => {
  pipe(
    text,
    String.trim,
    String.toLowerCase,
    String.replace(/\s+/g, " "),
    String.normalize("NFD"),
    String.replace(/[\u0300-\u036f]/g, ""), // Remove diacritics
    String.replace(/[^\w\s]/g, ""), // Remove punctuation,
    (str) => str.split(" ").filter(Boolean).sort().join(" ") // Sort words
  )
}

export class KexpPlay extends Model.Class<KexpPlay>("KexpPlay")({
  play_id: Schema.Number,
  airdate: Schema.String,
  show_id: Schema.Number,
  comment: Schema.NullOr(Schema.String),
  rotation_status: Schema.NullOr(Schema.String),
  is_local: Schema.Int,
  is_request: Schema.Int,
  is_live: Schema.Int,
  play_type: Schema.Literal("trackplay"),
  artist_text: Schema.NullOr(Schema.String),
  album_text: Schema.NullOr(Schema.String),
  song_text: Schema.NullOr(Schema.String),
  normalized_text: Schema.String,
  normalized_text_hash: Schema.Number,
  mb_artist_ids: Model.JsonFromString(Schema.Array(Schema.String)),
  mb_recording_id: Schema.NullOr(Schema.String),
  mb_release_id: Schema.NullOr(Schema.String),
  mb_release_group_id: Schema.NullOr(Schema.String),
  mb_label_ids: Model.JsonFromString(Schema.Array(Schema.String)),
  kexp_json: Model.JsonFromString(KexpTrackPlay),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) implements Equal.Equal {
  [Equal.symbol](that: Equal.Equal): boolean {
    if (that instanceof KexpPlay) {
      return this.play_id === that.play_id
    }
    return false
  }
  [Hash.symbol](): number {
    return Hash.hash(this.play_id)
  }

  normalizedText(): string {
    const normalized = `kexp_play_${normalizeText(this.artist_text ?? "")}_${
      normalizeText(
        this.album_text ?? ""
      )
    }_${normalizeText(this.song_text ?? "")}`
    return normalized
  }

  normalizedTextHash(): number {
    return Hash.hash(this.normalizedText())
  }
}

export class ArtistMBEntityMaster extends Model.Class<ArtistMBEntityMaster>("ArtistMBEntityMaster")({
  artist_mb_id: MbArtistId,
  artist_name: Schema.String,
  artist_disambiguation: Schema.NullOr(Schema.String),
  artist_type: Schema.NullishOr(Schema.String),
  artist_aliases: Model.JsonFromString(Schema.Array(Schema.String)),
  artist_gender: Schema.NullOr(Schema.String),
  artist_country: Schema.NullOr(Schema.String),
  artist_life_begin: Schema.NullOr(Schema.String),
  artist_life_end: Schema.NullOr(Schema.String),
  artist_life_ended: Model.BooleanFromNumber,
  entity_type: Schema.Literal("artist"),
  entity_mb_id: Schema.String,
  relation_type: Schema.String,
  direction: Schema.Literal("forward", "backward"),
  entity_disambiguation: Schema.String,
  ended: Model.BooleanFromNumber,
  begin_date: Schema.NullOr(Schema.String),
  end_date: Schema.NullOr(Schema.String),
  attribute_type: Schema.NullOr(Schema.String),
  entity_metadata: Model.JsonFromString(Schema.Unknown),
  created_at: Model.DateTimeWithNow,
  updated_at: Model.DateTimeUpdate
}) {}
export type ArtistMBEntityMasterEncoded = Schema.Schema.Encoded<typeof ArtistMBEntityMaster>

export class ArtistEntity extends Schema.Class<ArtistEntity>("ArtistEntity")({
  artist_mb_id: MbArtistId,
  artist_name: Schema.String,
  artist_disambiguation: Schema.NullOr(Schema.String),
  entity_type: Schema.Literal("artist"),
  entity_mb_id: Schema.String,
  entity_name: Schema.String,
  relation_type: Schema.String,
  direction: Schema.Literal("forward", "backward"),
  attribute_type: Schema.NullOr(Schema.String),
  entity_metadata: Schema.NullOr(Schema.String)
}) {}
export type ArtistEntityEncoded = Schema.Schema.Encoded<typeof ArtistEntity>
