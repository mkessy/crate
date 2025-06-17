import { Command } from "@effect/cli"
import { SongsClient } from "./SongsClient.js"

const list = Command.make("list").pipe(
  Command.withDescription("List all songs"),
  Command.withHandler(() => SongsClient.list)
)

const command = Command.make("songs").pipe(
  Command.withSubcommands([list])
)

export const cli = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
