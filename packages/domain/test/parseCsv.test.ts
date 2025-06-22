import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { assert, describe, it } from "@effect/vitest"
import { Chunk, Effect, Schema, Stream } from "effect"
import { parseCsv } from "../src/csv/parseCsv.js"

const TestRow = Schema.Struct({
  id: Schema.NumberFromString,
  value: Schema.String
})

describe("parseCsv", () => {
  it.effect("should parse a csv file", () =>
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem
      yield* fs.writeFile("test.csv", new TextEncoder().encode("id,value\n1,foo\n2,bar"))

      const result = yield* parseCsv("test.csv", TestRow).pipe(
        Stream.runCollect,
        Effect.map(Chunk.toArray)
      )

      console.log(result)

      assert.deepEqual(result, [
        { id: 1, value: "foo" },
        { id: 2, value: "bar" }
      ])
    }).pipe(Effect.provide(BunFileSystem.layer)))
})
