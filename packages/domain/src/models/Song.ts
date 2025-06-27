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
