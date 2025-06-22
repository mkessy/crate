import { Schema, Stream } from "effect"
import type { ParserOptionsArgs } from "fast-csv"
import { parseFile } from "fast-csv"

class CsvStreamError extends Schema.TaggedError<CsvStreamError>("CsvStreamError")(
  "CsvStreamError",
  {
    message: Schema.String
  }
) {}

export const parseCsv = <I, A>(
  path: string,
  schema: Schema.Schema<A, I>,
  parseOptions: ParserOptionsArgs = { headers: true }
) =>
  Stream.fromAsyncIterable(parseFile(path, parseOptions), (error) =>
    new CsvStreamError({
      message: error instanceof Error ? error.message : "Unknown error"
    })).pipe(
      Stream.mapEffect(Schema.decodeUnknown(schema))
    )
