import { Command } from "@effect/cli"

const command = Command.make("songs")

export const cli = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
