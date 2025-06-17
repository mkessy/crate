import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"

export const SongId = Schema.Number.pipe(Schema.brand("SongId"))
export type SongId = typeof SongId.Type

export const SongIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(SongId)
)

export class Song extends Schema.Class<Song>("Song")({
  id: SongId,
  name: Schema.String
}) {}

export class SongNotFound extends Schema.TaggedError<SongNotFound>()("SongNotFound", {
  id: Schema.Number
}) {}

export class SongsApiGroup extends HttpApiGroup.make("songs")
  .add(HttpApiEndpoint.get("getAllSongs", "/songs").addSuccess(Schema.Array(Song)))
{}

export class SongsApi extends HttpApi.make("api").add(SongsApiGroup) {}
