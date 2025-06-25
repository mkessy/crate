import { Model } from "@effect/sql"
import { Schema } from "effect"

// Bridge KB Artist to KEXP
export class BridgeKbArtistToKexp extends Model.Class<BridgeKbArtistToKexp>("BridgeKbArtistToKexp")({
  kb_artist_id: Schema.String,
  kexp_artist_id_internal: Schema.String
}) {}

// Bridge KB Song to KEXP
export class BridgeKbSongToKexp extends Model.Class<BridgeKbSongToKexp>("BridgeKbSongToKexp")({
  kb_song_id: Schema.String,
  kexp_track_id_internal: Schema.String
}) {}

// Bridge Artist ID to Names
export class BridgeArtistIdToNames extends Model.Class<BridgeArtistIdToNames>("BridgeArtistIdToNames")({
  artist_id_internal: Schema.String,
  observed_name_string: Schema.String
}) {}

// Bridge Label ID to Names
export class BridgeLabelIdToNames extends Model.Class<BridgeLabelIdToNames>("BridgeLabelIdToNames")({
  label_id_internal: Schema.String,
  observed_label_name_string: Schema.String
}) {}

// Bridge Play to Artist
export class BridgePlayToArtist extends Model.Class<BridgePlayToArtist>("BridgePlayToArtist")({
  play_id: Schema.parseNumber(Schema.String),
  artist_id_internal: Model.FieldOption(Schema.String)
}) {}

// Bridge Play to Label
export class BridgePlayToLabel extends Model.Class<BridgePlayToLabel>("BridgePlayToLabel")({
  play_id: Schema.parseNumber(Schema.String),
  label_id_internal: Model.FieldOption(Schema.String)
}) {}

// Bridge Release ID to Names
export class BridgeReleaseIdToNames extends Model.Class<BridgeReleaseIdToNames>("BridgeReleaseIdToNames")({
  release_id_internal: Schema.String,
  observed_album_name_string: Schema.String
}) {}

// Bridge Show Hosts
export class BridgeShowHosts extends Model.Class<BridgeShowHosts>("BridgeShowHosts")({
  show_id: Schema.parseNumber(Schema.String),
  host_id: Schema.parseNumber(Schema.String)
}) {}

// Bridge Timeslot Hosts
export class BridgeTimeslotHosts extends Model.Class<BridgeTimeslotHosts>("BridgeTimeslotHosts")({
  timeslot_id: Schema.parseNumber(Schema.String),
  host_id: Schema.parseNumber(Schema.String)
}) {}
