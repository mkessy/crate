import { Model } from "@effect/sql"
import { Schema } from "effect"

// MusicBrainz Artists Raw
export class MbArtistsRaw extends Model.Class<MbArtistsRaw>("MbArtistsRaw")({
  id: Model.FieldOption(Schema.String),
  type: Model.FieldOption(Schema.String),
  aliases: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  area: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  begin_area: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  annotation: Model.FieldOption(Schema.String),
  relations: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  sort_name: Model.FieldOption(Schema.String),
  type_id: Model.FieldOption(Schema.String),
  country: Model.FieldOption(Schema.String),
  end_area: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  isnis: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  ipis: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  gender_id: Model.FieldOption(Schema.String),
  tags: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  gender: Model.FieldOption(Schema.String),
  genres: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  rating: Model.FieldOption(Model.JsonFromString(Schema.Unknown)),
  name: Model.FieldOption(Schema.String),
  disambiguation: Model.FieldOption(Schema.String)
}) {}

// MusicBrainz Relations Enhanced
export class MbRelationsEnhanced extends Model.Class<MbRelationsEnhanced>("MbRelationsEnhanced")({
  artist_mb_id: Model.FieldOption(Schema.String),
  artist_name: Model.FieldOption(Schema.String),
  relation_type: Model.FieldOption(Schema.String),
  target_type: Model.FieldOption(Schema.String),
  attributes_raw: Model.FieldOption(Model.JsonFromString(Schema.Array(Schema.String))),
  attributes_array: Model.FieldOption(Model.JsonFromString(Schema.Array(Schema.String))),
  begin_date: Model.FieldOption(Schema.String),
  end_date: Model.FieldOption(Schema.String)
}) {}
