import { Model } from "@effect/sql"
import { Schema } from "effect"
import type { kbArtistType } from "./kb-entities.js"
import { KbArtistType } from "./kb-entities.js"

// MusicBrainz Artists Raw
export class MbArtistsRaw extends Model.Class<MbArtistsRaw>("MbArtistsRaw")({
  id: Schema.String,
  type: Model.FieldOption(Schema.transform(
    Schema.String,
    KbArtistType,
    {
      decode: (value) => value.toUpperCase() as kbArtistType,
      encode: (value) => value as string,
      strict: true
    }
  )),
  aliases: Schema.String,
  sort_name: Model.FieldOption(Schema.String),
  type_id: Model.FieldOption(Schema.String),
  country: Model.FieldOption(Schema.String),
  gender: Model.FieldOption(Schema.String),
  name: Schema.String,
  disambiguation: Schema.NullOr(Schema.String)
}) {}

// MusicBrainz Relations Enhanced
export class MbRelationsEnhanced extends Model.Class<MbRelationsEnhanced>("MbRelationsEnhanced")({
  artist_mb_id: Schema.String,
  artist_name: Schema.String,
  relation_type: Schema.String,
  target_type: Schema.String,
  attributes_raw: Model.JsonFromString(Schema.Array(Schema.String)),
  attributes_array: Model.JsonFromString(Schema.Array(Schema.String)),
  begin_date: Model.FieldOption(Schema.String),
  end_date: Model.FieldOption(Schema.String)
}) {}
