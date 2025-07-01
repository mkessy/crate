import { Model } from "@effect/sql"
import { Equal, Hash, pipe, Schema, String } from "effect"
import { KexpTrackPlay } from "../../kexp/schemas.js"

export type EntityType = Schema.Schema.Type<typeof EntityType>
export const EntityType = Schema.Literal(
  "recording",
  "work",
  "area",
  "artist",
  "release",
  "genre",
  "label",
  "release_group"
)

export type RelationType = Schema.Schema.Type<typeof RelationType>
export const RelationType = Schema.String

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

export class KexPlay extends Model.Class<KexPlay>("KexPlay")({
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
    if (that instanceof KexPlay) {
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

export class Work extends Model.Class<Work>("Work")({
  mb_id: MbWorkId,
  name: Schema.String,
  disambiguation: Schema.NullOr(Schema.String),
  type: Schema.Literal("work"),
  comment: Schema.String,
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class Area extends Model.Class<Area>("Area")({
  mb_id: MbAreaId,
  name: Schema.String,
  type: Schema.Literal("area"),
  disambiguation: Schema.NullOr(Schema.String),
  entity_metadata: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class Recording extends Model.Class<Recording>("Recording")({
  mb_id: MbRecordingId,
  name: Schema.String,
  type: Schema.Literal("recording"),
  disambiguation: Schema.NullOr(Schema.String),
  begin_date: Schema.String,
  end_date: Schema.String,
  recording_length: Schema.NullOr(Schema.Number),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class Release extends Model.Class<Release>("Release")({
  mb_id: MbReleaseId,
  name: Schema.String,
  type: Schema.Literal("release"),
  disambiguation: Schema.NullOr(Schema.String),
  begin_date: Schema.String,
  end_date: Schema.String,
  barcode: Schema.NullOr(Schema.String),
  country: Schema.NullOr(Schema.String),
  release_date: Schema.NullOr(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class ReleaseGroup extends Model.Class<ReleaseGroup>("ReleaseGroup")({
  mb_id: MbReleaseGroupId,
  name: Schema.String,
  type: Schema.Literal("release_group"),
  disambiguation: Schema.NullOr(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class Artist extends Model.Class<Artist>("Artist")({
  mb_id: MbArtistId,
  name: Schema.String,
  disambiguation: Schema.String,
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class Label extends Model.Class<Label>("Label")({
  mb_id: MbLabelId,
  name: Schema.String,
  type: Schema.Literal("label"),
  disambiguation: Schema.NullOr(Schema.String),
  ended: Schema.Boolean,
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class ArtistMBEntityMaster extends Model.Class<ArtistMBEntityMaster>("ArtistMBEntityMaster")({
  artist_mb_id: MbArtistId,
  artist_name: Schema.String,
  artist_disambiguation: Schema.NullOr(Schema.String),
  artist_type: Schema.String,
  artist_gender: Schema.NullOr(Schema.String),
  artist_country: Schema.NullOr(Schema.String),
  artist_life_begin: Schema.NullOr(Schema.String),
  artist_life_end: Schema.NullOr(Schema.String),
  artist_life_ended: Model.BooleanFromNumber,
  entity_type: EntityType,
  entity_mb_id: Schema.String,
  relation_type: Schema.String,
  direction: Schema.Literal("forward", "backward"),
  entity_disambiguation: Schema.String,
  ended: Model.BooleanFromNumber,
  begin_date: Schema.NullOr(Schema.String),
  end_date: Schema.NullOr(Schema.String),
  attribute_type: Schema.NullOr(Schema.String),
  entity_metadata: Model.JsonFromString(Schema.Unknown),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class ArtistEntity extends Schema.Class<ArtistEntity>("ArtistEntity")({
  artist_mb_id: MbArtistId,
  artist_name: Schema.String,
  artist_disambiguation: Schema.NullOr(Schema.String),
  entity_type: EntityType,
  entity_mb_id: Schema.String,
  entity_name: Schema.String,
  relation_type: Schema.String,
  direction: Schema.Literal("forward", "backward"),
  attribute_type: Schema.NullOr(Schema.String),
  entity_metadata: Schema.NullOr(Schema.String)
}) {}
