import { ParseResult, Schema } from "effect"

// ============================================================================
// Type IDs and Brands
// ============================================================================

const VertexTypeId = Symbol.for("@apg/Vertex")
type VertexTypeId = typeof VertexTypeId

export const VertexLabel = Schema.NonEmptyTrimmedString.pipe(Schema.brand("VertexLabel"))
export type VertexLabel = Schema.Schema.Type<typeof VertexLabel>

// ============================================================================
// Vertex Type Constructor using Schema.declare
// ============================================================================

export interface Vertex<V, L extends VertexLabel = VertexLabel> extends Schema.Schema.Type<typeof VertexSchema> {
  readonly label: L
  readonly value: V
}

export class VertexSchema extends Schema.TaggedClass<VertexSchema>("Vertex")("Vertex", {
  label: Schema.propertySignature(VertexLabel).pipe(Schema.fromKey("label")),
  value: Schema.Any
}, {
  identifier: `Vertex`,
  title: `Vertex`,
  description: `A vertex in the algebraic property graph with a value`
}) {
  readonly [VertexTypeId]: VertexTypeId = VertexTypeId
}

export type VertexType<A, I, R, L extends VertexLabel> = Schema.Schema.Type<typeof VertexTypeSchema<A, I, R, L>>

export const VertexTypeSchema = <A, I, R, L extends VertexLabel>(
  label: L,
  vertexValueSchema: Schema.Schema<A, I, R>
): Schema.Schema<Vertex<A, L>, Vertex<I, L>, R> =>
  Schema.declare(
    [vertexValueSchema],
    {
      decode: (vertexValueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(VertexSchema)(input) && input._tag === "Vertex") {
          const value = ParseResult.decodeUnknown(vertexValueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) => VertexSchema.make({ label, value }) as Vertex<A, L>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      },
      encode: (valueSchema) => (input, parseOptions, ast) => {
        if (Schema.is(VertexSchema)(input) && input._tag === "Vertex") {
          const value = ParseResult.decodeUnknown(valueSchema)(input.value, parseOptions)
          return ParseResult.map(
            value,
            (value) => VertexSchema.make({ label, value }) as Vertex<I, L>
          )
        }
        return ParseResult.fail(new ParseResult.Type(ast, input))
      }
    },
    {
      identifier: `Vertex<${label}>`,
      title: `Vertex<${label}>`,
      description: `Vertex<${Schema.format(vertexValueSchema)}>`
    }
  )
