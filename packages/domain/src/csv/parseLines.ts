import { FileSystem } from "@effect/platform"
import { Console, Effect, Schema, Stream } from "effect"
import type { ParserOptionsArgs } from "fast-csv"
import { parseFile } from "fast-csv"

class CsvStreamError extends Schema.TaggedError<CsvStreamError>("CsvStreamError")(
  "CsvStreamError",
  {
    message: Schema.String
  }
) {}

class JsonlStreamError extends Schema.TaggedError<JsonlStreamError>("JsonlStreamError")(
  "JsonlStreamError",
  {
    message: Schema.String
  }
) {}

export const parseCsv = <I, A>(
  path: string,
  schema: Schema.Schema<A, I>,
  parseOptions: ParserOptionsArgs = { headers: true }
) =>
  Stream.fromAsyncIterable(
    parseFile<any, any>(path, parseOptions).transform((row: Record<string, string>) => {
      const booleanFields = new Set([
        "has_links",
        "contains_url",
        "has_comment",
        "is_request",
        "is_live",
        "is_local",
        "is_url_only",
        "contains_url"
      ])
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          if (booleanFields.has(key)) {
            const lowerValue = value.toLowerCase()
            if (lowerValue === "true") {
              return [key, 1]
            }
            if (lowerValue === "false") {
              return [key, 0]
            }
          }
          return [key, value === "" ? null : value]
        })
      )
    }),
    (error) =>
      new CsvStreamError({
        message: error instanceof Error ? error.message : "Unknown error"
      })
  ).pipe(
    Stream.map(Schema.decodeUnknownSync(schema))
  )

export const parseJsonl = <I, A>(
  path: string,
  schema: Schema.Schema<A, I>
) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const stream = fs.stream(path).pipe(
      Stream.decodeText("utf-8"),
      Stream.splitLines,
      Stream.tap((n) => Console.log(n)),
      Stream.map((n) => JSON.parse(n)),
      Stream.map(Schema.decodeUnknownSync(schema)),
      Stream.mapError((error) => new JsonlStreamError({ message: error.message }))
    )
    return stream
  })
