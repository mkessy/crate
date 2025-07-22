import { DateTime, Duration, Effect } from "effect"
import { parts } from "effect/Duration"
import { FactPlaysService } from "../../../server/src/knowledge_base/fact_plays/index.js"

const updatePlays = Effect.gen(function*() {
  yield* Effect.logInfo("Starting plays update process")

  const until = DateTime.subtract(DateTime.unsafeNow(), parts(Duration.hours(1)))
  const totalUpdated = yield* FactPlaysService.updatePlays(until)

  yield* Effect.log(`Total plays processed: ${totalUpdated}`)
})

const program = updatePlays.pipe(
  Effect.provide(FactPlaysService.Default),
  Effect.scoped
)

Effect.runPromise(program).catch(console.error)
