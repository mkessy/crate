import { Model } from "@effect/sql"
import { Schema } from "effect"

// Fact Plays table
export class FactPlays extends Model.Class<FactPlays>("FactPlays")({
  id: Schema.Number,
  airdate: Schema.String,
  show: Schema.Number,
  show_uri: Schema.String,
  image_uri: Schema.NullOr(Schema.String),
  thumbnail_uri: Schema.NullOr(Schema.String),
  song: Schema.NullOr(Schema.String),
  track_id: Schema.NullOr(Schema.String),
  recording_id: Schema.NullOr(Schema.String),
  artist: Schema.NullOr(Schema.String),
  artist_ids: Schema.NullOr(Schema.String),
  album: Schema.NullOr(Schema.String),
  release_id: Schema.NullOr(Schema.String),
  release_group_id: Schema.NullOr(Schema.String),
  labels: Schema.NullOr(Schema.String),
  label_ids: Schema.NullOr(Schema.String),
  release_date: Schema.NullOr(Schema.String),
  rotation_status: Schema.NullOr(Schema.String),
  is_local: Model.BooleanFromNumber,
  is_request: Model.BooleanFromNumber,
  is_live: Model.BooleanFromNumber,
  comment: Schema.NullOr(Schema.String),
  play_type: Schema.Literal("trackplay", "nontrackplay"),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}
