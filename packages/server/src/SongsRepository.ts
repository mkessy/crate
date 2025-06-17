import type { Song, SongId } from "@template/domain/SongsApi"
import { Effect, HashMap, Ref } from "effect"

export class SongsRepository extends Effect.Service<SongsRepository>()("api/SongsRepository", {
  effect: Effect.gen(function*() {
    const songs = yield* Ref.make(HashMap.empty<SongId, Song>())

    const getAll = Ref.get(songs).pipe(
      Effect.map((songs) => Array.from(HashMap.values(songs)))
    )

    return {
      getAll
    } as const
  })
}) {}
