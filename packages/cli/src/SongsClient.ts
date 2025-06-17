import { HttpApiClient } from "@effect/platform"
import { SongsApi } from "@template/domain/SongsApi"
import { Effect } from "effect"

export class SongsClient extends Effect.Service<SongsClient>()("cli/SongsClient", {
  accessors: true,
  effect: Effect.gen(function*() {
    const client = yield* HttpApiClient.make(SongsApi, {
      baseUrl: "http://localhost:3000"
    })

    const list = client.songs.getAllSongs().pipe(
      Effect.flatMap((songs) => Effect.logInfo(songs))
    )

    return {
      list
    } as const
  })
}) {}
