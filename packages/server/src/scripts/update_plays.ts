import { DateTime, Effect } from "effect"
import * as FactPlaysService from "../../../server/src/knowledge_base/fact_plays/service.js"

const updatePlays = Effect.scoped(
  Effect.gen(function*() {
    const fp = yield* FactPlaysService.FactPlaysService

    yield* Effect.log("Updating plays")
    yield* fp.updatePlaysUntilDate(DateTime.unsafeMake(new Date("2025-06-22")))

    yield* Effect.log("plays updated")
  }).pipe(
    Effect.provide(FactPlaysService.FactPlaysService.Default)
  )
)

const runUpdatePlays = () => updatePlays.pipe(Effect.runPromise)

runUpdatePlays().then(() => {
  console.log("Done updating plays")
})
