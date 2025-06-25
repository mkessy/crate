import { Model } from "@effect/sql"
import { Schema } from "effect"

// Dimension Artists Master
export class DimArtistsMaster extends Model.Class<DimArtistsMaster>("DimArtistsMaster")({
  artist_id_internal: Schema.String,
  primary_name_observed: Schema.String,
  mb_id: Schema.String
}) {}

// Dimension Hosts
export class DimHosts extends Model.Class<DimHosts>("DimHosts")({
  host_id: Schema.NumberFromString,
  primary_name: Schema.String,
  host_uri: Schema.String
}) {}

// Dimension Labels Master
export class DimLabelsMaster extends Model.Class<DimLabelsMaster>("DimLabelsMaster")({
  label_id_internal: Schema.String,
  primary_name_observed: Schema.String,
  mb_id: Schema.String
}) {}

// Dimension Programs
export class DimPrograms extends Model.Class<DimPrograms>("DimPrograms")({
  program_id: Schema.NumberFromString,
  primary_name: Schema.String,
  program_uri: Schema.String,
  description: Schema.String,
  tags: Schema.String,
  image_uri: Schema.String
}) {}

// Dimension Releases Master
export class DimReleasesMaster extends Model.Class<DimReleasesMaster>("DimReleasesMaster")({
  release_id_internal: Schema.String,
  primary_album_name_observed: Schema.String,
  mb_release_id: Schema.String,
  mb_release_group_id: Schema.String,
  release_date_iso: Schema.String
}) {}

// Dimension Shows
export class DimShows extends Model.Class<DimShows>("DimShows")({
  show_id: Schema.NumberFromString,
  show_uri: Schema.String,
  program_id: Schema.String,
  start_time_iso: Schema.String,
  tagline_at_show_time: Schema.String,
  title_at_show_time: Schema.String,
  program_name_at_show_time: Schema.String,
  program_tags_at_show_time: Schema.String,
  host_ids_at_show_time: Schema.String
}) {}

// Dimension Timeslots
export class DimTimeslots extends Model.Class<DimTimeslots>("DimTimeslots")({
  timeslot_id: Schema.NumberFromString,
  program_id: Schema.NumberFromString,
  weekday: Schema.NumberFromString,
  start_date_iso: Schema.String,
  end_date_iso: Schema.String,
  start_time_str: Schema.String,
  end_time_str: Schema.String,
  duration_str: Schema.String
}) {}

// Dimension Tracks
export class DimTracks extends Model.Class<DimTracks>("DimTracks")({
  track_id_internal: Schema.String,
  primary_song_title_observed: Schema.String,
  mb_track_id: Schema.String,
  mb_recording_id: Schema.String,
  release_id_internal_on_track: Schema.String
}) {}
