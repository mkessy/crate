import { Schema } from "effect"
import { Model } from "@effect/sql"

// Fact Plays table
export class FactPlays extends Model.Class<FactPlays>("FactPlays")({
  play_id: Schema.Number,
  airdate_iso: Model.FieldOption(Schema.String),
  show_id: Model.FieldOption(Schema.Number),
  track_id_internal: Model.FieldOption(Schema.String),
  comment: Model.FieldOption(Schema.String),
  rotation_status: Model.FieldOption(Schema.String),
  is_local: Model.FieldOption(Model.BooleanFromNumber),
  is_request: Model.FieldOption(Model.BooleanFromNumber),
  is_live: Model.FieldOption(Model.BooleanFromNumber),
  play_type: Model.FieldOption(Schema.String),
  original_artist_text: Model.FieldOption(Schema.String),
  original_album_text: Model.FieldOption(Schema.String),
  original_song_text: Model.FieldOption(Schema.String)
}) {}