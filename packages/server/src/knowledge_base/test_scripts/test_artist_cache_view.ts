import { BunRuntime } from "@effect/platform-bun"
import { Chunk, Console, Effect, Layer, Stream } from "effect"
import * as EntityPersistenceService from "../entity_persistence/service.js"

const program = Effect.gen(function*() {
  const mb = yield* EntityPersistenceService.MBDataService
  const unresolved = Chunk.toArray(
    yield* mb.getArtistCacheView.pipe(Stream.runCollect)
  )
  yield* Console.log(unresolved)
})

program.pipe(
  Effect.provide(EntityPersistenceService.MBDataService.Default),
  Effect.provide(Layer.scope)
).pipe(BunRuntime.runMain)
