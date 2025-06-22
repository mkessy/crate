import { Schema } from "effect"
import { Model } from "@effect/sql"

// MusicBrainz Artists Raw
export class MbArtistsRaw extends Model.Class<MbArtistsRaw>("MbArtistsRaw")({
  type: Model.FieldOption(Schema.String),
  id: Model.FieldOption(Schema.String),
  aliases: Model.FieldOption(Schema.Unknown),
  life_span: Model.FieldOption(Schema.Unknown),
  area: Model.FieldOption(Schema.Unknown),
  begin_area: Model.FieldOption(Schema.Unknown),
  annotation: Model.FieldOption(Schema.String),
  relations: Model.FieldOption(Schema.Unknown),
  sort_name: Model.FieldOption(Schema.String),
  type_id: Model.FieldOption(Schema.String),
  country: Model.FieldOption(Schema.String),
  end_area: Model.FieldOption(Schema.Unknown),
  isnis: Model.FieldOption(Schema.Unknown),
  ipis: Model.FieldOption(Schema.Unknown),
  gender_id: Model.FieldOption(Schema.String),
  tags: Model.FieldOption(Schema.Unknown),
  gender: Model.FieldOption(Schema.String),
  genres: Model.FieldOption(Schema.Unknown),
  rating: Model.FieldOption(Schema.Unknown),
  name: Model.FieldOption(Schema.String),
  disambiguation: Model.FieldOption(Schema.String)
}) {}

// MusicBrainz Relations Enhanced
export class MbRelationsEnhanced extends Model.Class<MbRelationsEnhanced>("MbRelationsEnhanced")({
  artist_mb_id: Model.FieldOption(Schema.String),
  artist_name: Model.FieldOption(Schema.String),
  relation_type: Model.FieldOption(Schema.String),
  target_type: Model.FieldOption(Schema.String),
  attributes_raw: Model.FieldOption(Schema.Unknown),
  attributes_array: Model.FieldOption(Schema.Unknown),
  begin_date: Model.FieldOption(Schema.String),
  end_date: Model.FieldOption(Schema.String)
}) {}