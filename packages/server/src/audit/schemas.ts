import { Model } from "@effect/sql"
import { Schema } from "effect"

// fetch logs for musicbrainz
export type MBArtistFetchMetaData = Schema.Schema.Type<typeof MBArtistFetchMetaData>
export const MBArtistFetchMetaData = Schema.TaggedStruct("audit_log_data", {
  artist_mb_id: Schema.String,
  type: Schema.Literal("musicbrainz_artist_fetch"),
  kexp_play_id: Schema.NullishOr(Schema.Number),
  mb_url: Schema.String,
  mb_response: Schema.NullOr(Schema.Unknown),
  status: Schema.Number
})

export type KEXPFetchMetaData = Schema.Schema.Type<typeof KEXPFetchMetaData>
export const KEXPFetchMetaData = Schema.TaggedStruct("audit_log_data", {
  type: Schema.Literal("kexp_fetch"),
  kexp_url: Schema.String,
  status: Schema.Number
})

export type AuditLogData = Schema.Schema.Type<typeof AuditLogData>
export const AuditLogData = Schema.Union(MBArtistFetchMetaData, KEXPFetchMetaData)

export class AuditLog extends Model.Class<AuditLog>("AuditLog")({
  metadata: Model.JsonFromString(AuditLogData),
  type: Schema.Literal("http_fetch"),
  id: Model.Generated(Schema.Number),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}
