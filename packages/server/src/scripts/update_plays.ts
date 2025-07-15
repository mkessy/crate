import { Array, DateTime, Effect, Option, pipe } from "effect"
import * as FactPlaysService from "../../../server/src/knowledge_base/fact_plays/service.js"

const DEFAULT_HOURS_FALLBACK = 48

const updatePlays = Effect.gen(function*() {
  yield* Effect.logInfo("Starting plays update process")

  const service = yield* FactPlaysService.FactPlaysService

  const mostRecentPlayDate = yield* pipe(
    service.getRecentPlays(500),
    Effect.map(
      Array.map((play) => DateTime.unsafeMake(play.airdate))
    ),
    Effect.map(
      Array.head
    ),
    Effect.map(
      Option.getOrElse(() => {
        return DateTime.subtract(DateTime.unsafeNow(), { hours: DEFAULT_HOURS_FALLBACK })
      })
    )
  )

  yield* Effect.logInfo(
    `Updating plays from ${DateTime.formatIso(mostRecentPlayDate)}`
  )

  yield* service.updatePlaysUntilDate(mostRecentPlayDate)

  yield* Effect.logInfo("Plays update completed successfully")
})

const program = updatePlays.pipe(
  Effect.provide(FactPlaysService.FactPlaysService.Default),
  Effect.scoped
)

Effect.runPromise(program).catch(console.error)
