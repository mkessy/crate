import { KnowledgeBase } from "@crate/domain"
import { KexpTrackPlay } from "@crate/server/kexp/schemas.js"
import { Model } from "@effect/sql"
import { Equal, Hash, pipe, Schema, String } from "effect"

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

export class Label extends Model.Class<Label>("Label")({
  mb_id: KnowledgeBase.MbLabelId,
  name: Schema.String,
  type: Schema.Literal("label"),
  disambiguation: Schema.NullOr(Schema.String),
  ended: Schema.Boolean,
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}
export type LabelEncoded = Schema.Schema.Encoded<typeof Label>

export class ArtistMBEntityMaster extends Model.Class<ArtistMBEntityMaster>("ArtistMBEntityMaster")({
  artist_mb_id: KnowledgeBase.MbArtistId,
  artist_name: Schema.String,
  artist_disambiguation: Schema.NullOr(Schema.String),
  artist_type: Schema.NullishOr(Schema.String),
  artist_gender: Schema.NullOr(Schema.String),
  artist_country: Schema.NullOr(Schema.String),
  artist_life_begin: Schema.NullOr(Schema.String),
  artist_life_end: Schema.NullOr(Schema.String),
  artist_life_ended: Model.BooleanFromNumber,
  entity_type: KnowledgeBase.EntityType,
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
  artist_mb_id: KnowledgeBase.MbArtistId,
  artist_name: Schema.String,
  artist_disambiguation: Schema.NullOr(Schema.String),
  entity_type: KnowledgeBase.EntityType,
  entity_mb_id: Schema.String,
  entity_name: Schema.String,
  relation_type: Schema.String,
  direction: Schema.Literal("forward", "backward"),
  attribute_type: Schema.NullOr(Schema.String),
  entity_metadata: Schema.NullOr(Schema.String)
}) {}
export type ArtistEntityEncoded = Schema.Schema.Encoded<typeof ArtistEntity>
