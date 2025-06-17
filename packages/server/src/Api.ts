import { HttpApiBuilder } from "@effect/platform"
import { SongsApi } from "@template/domain/SongsApi"
import { Effect, Layer } from "effect"
import { SongsRepository } from "./SongsRepository.js"

const SongsApiLive = HttpApiBuilder.group(SongsApi, "songs", (handlers) =>
  Effect.gen(function*() {
    const songs = yield* SongsRepository
    return handlers
      .handle("getAllSongs", () => songs.getAll)
  }))

export const ApiLive = HttpApiBuilder.api(SongsApi).pipe(
  Layer.provide(SongsApiLive)
)
