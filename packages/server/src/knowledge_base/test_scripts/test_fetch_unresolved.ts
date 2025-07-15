import { BunRuntime } from "@effect/platform-bun"
import { Chunk, Console, Effect, Layer, Stream } from "effect"
import * as MusicBrainzService from "../musicbrainz/service.js"

const program = Effect.gen(function*() {
  const mb = yield* MusicBrainzService.MusicBrainzService
  const unresolved = Chunk.toArray(
    yield* mb.processUnresolvedMBArtists({
      limit: 500
    }).pipe(Stream.runCollect)
  )
  yield* Console.log(unresolved)
})

program.pipe(
  Effect.provide(MusicBrainzService.MusicBrainzService.Default),
  Effect.provide(Layer.scope)
).pipe(BunRuntime.runMain)
