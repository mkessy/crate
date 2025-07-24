import { Effect } from "effect"
import { FactPlaysService } from "../../../server/src/knowledge_base/fact_plays/index.js"

const updatePlays = Effect.gen(function*() {
  yield* Effect.logInfo("Starting plays update process")

  const totalUpdated = yield* FactPlaysService.updatePlays

  yield* Effect.log(`Total plays processed: ${totalUpdated}`)
})

const program = updatePlays.pipe(
  Effect.provide(FactPlaysService.Default),
  Effect.scoped
)

Effect.runPromise(program).catch(console.error)
