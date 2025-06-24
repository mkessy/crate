import { Model } from "@effect/sql"
import { Schema } from "effect"

// Dimension Artists Master
export class DimArtistsMaster extends Model.Class<DimArtistsMaster>("DimArtistsMaster")({
  artist_id_internal: Schema.String,
  primary_name_observed: Model.FieldOption(Schema.String),
  mb_id: Model.FieldOption(Schema.String)
}) {}

// Dimension Hosts
export class DimHosts extends Model.Class<DimHosts>("DimHosts")({
  host_id: Schema.NumberFromString,
  primary_name: Model.FieldOption(Schema.String),
  host_uri: Model.FieldOption(Schema.String)
}) {}

// Dimension Labels Master
export class DimLabelsMaster extends Model.Class<DimLabelsMaster>("DimLabelsMaster")({
  label_id_internal: Schema.String,
  primary_name_observed: Model.FieldOption(Schema.String),
  mb_id: Model.FieldOption(Schema.String)
}) {}

// Dimension Programs
export class DimPrograms extends Model.Class<DimPrograms>("DimPrograms")({
  program_id: Schema.NumberFromString,
  primary_name: Model.FieldOption(Schema.String),
  program_uri: Model.FieldOption(Schema.String),
  description: Model.FieldOption(Schema.String),
  tags: Model.FieldOption(Schema.String),
  image_uri: Model.FieldOption(Schema.String)
}) {}

// Dimension Releases Master
export class DimReleasesMaster extends Model.Class<DimReleasesMaster>("DimReleasesMaster")({
  release_id_internal: Schema.String,
  primary_album_name_observed: Model.FieldOption(Schema.String),
  mb_release_id: Model.FieldOption(Schema.String),
  mb_release_group_id: Model.FieldOption(Schema.String),
  release_date_iso: Model.FieldOption(Schema.String)
}) {}

// Dimension Shows
export class DimShows extends Model.Class<DimShows>("DimShows")({
  show_id: Schema.NumberFromString,
  show_uri: Model.FieldOption(Schema.String),
  program_id: Model.FieldOption(Schema.String),
  start_time_iso: Model.FieldOption(Schema.String),
  tagline_at_show_time: Model.FieldOption(Schema.String),
  title_at_show_time: Model.FieldOption(Schema.String),
  program_name_at_show_time: Model.FieldOption(Schema.String),
  program_tags_at_show_time: Model.FieldOption(Schema.String),
  host_ids_at_show_time: Model.FieldOption(Schema.String)
}) {}

// Dimension Timeslots
export class DimTimeslots extends Model.Class<DimTimeslots>("DimTimeslots")({
  timeslot_id: Schema.NumberFromString,
  program_id: Model.FieldOption(Schema.NumberFromString),
  weekday: Model.FieldOption(Schema.NumberFromString),
  start_date_iso: Model.FieldOption(Schema.String),
  end_date_iso: Model.FieldOption(Schema.String),
  start_time_str: Model.FieldOption(Schema.String),
  end_time_str: Model.FieldOption(Schema.String),
  duration_str: Model.FieldOption(Schema.String)
}) {}

// Dimension Tracks
export class DimTracks extends Model.Class<DimTracks>("DimTracks")({
  track_id_internal: Schema.String,
  primary_song_title_observed: Model.FieldOption(Schema.String),
  mb_track_id: Model.FieldOption(Schema.String),
  mb_recording_id: Model.FieldOption(Schema.String),
  release_id_internal_on_track: Model.FieldOption(Schema.String)
}) {}
