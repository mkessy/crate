import { ParseResult, Schema } from "effect"
import { VertexLabel } from "./Vertex.js"

// ============================================================================
// Type IDs and Brands
// ============================================================================

const EdgeTypeId = Symbol.for("@apg/Edge")
type EdgeTypeId = typeof EdgeTypeId

export const EdgeLabel = Schema.NonEmptyTrimmedString.pipe(Schema.brand("EdgeLabel"))
export type EdgeLabel = Schema.Schema.Type<typeof EdgeLabel>

// ============================================================================
// Edge Type Constructor using Schema.declare
// ============================================================================

export interface Edge<V, L extends EdgeLabel = EdgeLabel> extends Schema.Schema.Type<typeof EdgeSchema> {
  readonly label: L
  readonly from: VertexLabel
  readonly to: VertexLabel
  readonly value: V
}

export class EdgeSchema extends Schema.TaggedClass<EdgeSchema>("Edge")("Edge", {
  label: Schema.propertySignature(EdgeLabel).pipe(Schema.fromKey("label")),
  from: VertexLabel,
  to: VertexLabel,
  value: Schema.Any
}, {
  identifier: `Edge`,
  title: `Edge`,
  description: `An edge in the algebraic property graph with a value`
}) {
  readonly [EdgeTypeId]: EdgeTypeId = EdgeTypeId
}

export const EdgeTypeSchema = <A, I, R, L extends EdgeLabel>(
  label: L,
  valueSchema: Schema.Schema<A, I, R>,
  from: VertexLabel,
  to: VertexLabel
): Schema.Schema<Edge<A, L>, Edge<I, L>, R> =>
  Schema.declare(
    [valueSchema],
    {
      decode: (valueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(EdgeSchema)(input) && input._tag === "Edge") {
          const value = ParseResult.decodeUnknown(valueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) =>
              EdgeSchema.make({
                label,
                from,
                to,
                value: value as A
              }) as Edge<A, L>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      },
      encode: (valueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(EdgeSchema)(input) && input._tag === "Edge") {
          const value = ParseResult.decodeUnknown(valueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) =>
              EdgeSchema.make({
                label,
                from,
                to,
                value: value as A
              }) as Edge<I, L>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      }
    },
    {
      identifier: `Edge<${label}>`,
      title: `Edge<${label}>`,
      description: `Edge<${Schema.format(valueSchema)}> from ${from} to ${to}`
    }
  )
