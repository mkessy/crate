import { Model } from "@effect/sql"
import { Schema } from "effect"

// Artist entity
export class KbArtist extends Model.Class<KbArtist>("KbArtist")({
  kb_id: Schema.String,
  name: Schema.String,
  sort_name: Model.FieldOption(Schema.String),
  type: Model.FieldOption(Schema.Literal("PERSON", "GROUP", "ORCHESTRA", "CHOIR", "CHARACTER", "OTHER")),
  mb_artist_id: Model.FieldOption(Schema.String),
  begin_date: Model.FieldOption(Schema.String),
  end_date: Model.FieldOption(Schema.String),
  disambiguation: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Album entity
export class KbAlbum extends Model.Class<KbAlbum>("KbAlbum")({
  kb_id: Schema.String,
  title: Schema.String,
  mb_release_group_id: Model.FieldOption(Schema.String),
  primary_type: Model.FieldOption(Schema.String),
  secondary_types: Model.FieldOption(Schema.String),
  first_release_date: Model.FieldOption(Schema.String),
  disambiguation: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Song entity
export class KbSong extends Model.Class<KbSong>("KbSong")({
  kb_id: Schema.String,
  title: Schema.String,
  length_ms: Model.FieldOption(Schema.Number),
  mb_recording_id: Model.FieldOption(Schema.String),
  disambiguation: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Release entity
export class KbRelease extends Model.Class<KbRelease>("KbRelease")({
  kb_id: Schema.String,
  title: Schema.String,
  mb_release_id: Model.FieldOption(Schema.String),
  album_id: Model.FieldOption(Schema.String),
  release_date: Model.FieldOption(Schema.String),
  country: Model.FieldOption(Schema.String),
  barcode: Model.FieldOption(Schema.String),
  disambiguation: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Genre entity
export class KbGenre extends Model.Class<KbGenre>("KbGenre")({
  kb_id: Schema.String,
  name: Schema.String,
  mb_genre_id: Model.FieldOption(Schema.String),
  description: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert
}) {}

// Location entity
export class KbLocation extends Model.Class<KbLocation>("KbLocation")({
  kb_id: Schema.String,
  name: Schema.String,
  mb_area_id: Model.FieldOption(Schema.String),
  type: Model.FieldOption(Schema.String),
  country_code: Model.FieldOption(Schema.String),
  latitude: Model.FieldOption(Schema.Number),
  longitude: Model.FieldOption(Schema.Number),
  created_at: Model.DateTimeInsert
}) {}

// Record Label entity
export class KbRecordLabel extends Model.Class<KbRecordLabel>("KbRecordLabel")({
  kb_id: Schema.String,
  name: Schema.String,
  mb_label_id: Model.FieldOption(Schema.String),
  country: Model.FieldOption(Schema.String),
  label_code: Model.FieldOption(Schema.Number),
  created_at: Model.DateTimeInsert
}) {}

// Relationship entity
export class KbRelationship extends Model.Class<KbRelationship>("KbRelationship")({
  triple_id: Schema.String,
  subject_type: Schema.String,
  subject_id: Schema.String,
  predicate: Schema.String,
  object_type: Schema.String,
  object_id: Schema.String,
  source_name: Model.FieldOption(Schema.String),
  target_name: Model.FieldOption(Schema.String),
  mb_relation_type: Model.FieldOption(Schema.String),
  mb_target_type: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert
}) {}

// Host entity
export class KbHost extends Model.Class<KbHost>("KbHost")({
  kb_id: Schema.String,
  name: Schema.String,
  kexp_host_id: Model.FieldOption(Schema.Number),
  host_uri: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Program entity
export class KbProgram extends Model.Class<KbProgram>("KbProgram")({
  kb_id: Schema.String,
  name: Schema.String,
  kexp_program_id: Model.FieldOption(Schema.Number),
  description: Model.FieldOption(Schema.String),
  tags: Model.FieldOption(Schema.String),
  program_uri: Model.FieldOption(Schema.String),
  image_uri: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Show entity
export class KbShow extends Model.Class<KbShow>("KbShow")({
  kb_id: Schema.String,
  kexp_show_id: Schema.Number,
  show_uri: Model.FieldOption(Schema.String),
  start_time: Model.FieldOption(Schema.String),
  title: Model.FieldOption(Schema.String),
  tagline: Model.FieldOption(Schema.String),
  program_name: Model.FieldOption(Schema.String),
  program_tags: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// Play entity
export class KbPlay extends Model.Class<KbPlay>("KbPlay")({
  kb_id: Schema.String,
  play_id: Schema.Number,
  airdate: Model.FieldOption(Schema.String),
  rotation_status: Model.FieldOption(Schema.String),
  is_local: Model.FieldOption(Model.BooleanFromNumber),
  is_request: Model.FieldOption(Model.BooleanFromNumber),
  is_live: Model.FieldOption(Model.BooleanFromNumber),
  play_type: Model.FieldOption(Schema.String),
  has_comment: Model.FieldOption(Model.BooleanFromNumber),
  comment_length: Model.FieldOption(Schema.Number),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

// KEXP Comment entity
export class KbKexpComment extends Model.Class<KbKexpComment>("KbKexpComment")({
  kb_id: Schema.String,
  play_id: Schema.Number,
  comment_text: Schema.String,
  comment_length: Schema.Number,
  has_links: Model.FieldOption(Model.BooleanFromNumber),
  contains_url: Model.FieldOption(Model.BooleanFromNumber),
  comment_type: Model.FieldOption(Schema.String),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}
