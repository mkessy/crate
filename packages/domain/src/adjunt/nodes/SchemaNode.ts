import { Schema as S } from "effect"
import { SchemaId } from "../core/Brand.js"

// Since we can't serialize arbitrary schemas directly, we store schema metadata
const EncodedSchemaNode = S.Struct({
  _tag: S.Literal("SchemaNode"),
  id: SchemaId,
  name: S.String,
  description: S.optional(S.String),
  // Serialized schema AST or reference
  schemaDefinition: S.Unknown,
  // Version for schema evolution
  version: S.String.pipe(S.pattern(/^\d+\.\d+\.\d+$/)),
  createdAt: S.DateTimeUtc
})

// Live API class with generic schema type
export class SchemaNode<A = unknown, I = unknown> extends S.Class<
  SchemaNode<A, I>
>("SchemaNode")(EncodedSchemaNode) {
  // Keep the actual schema in memory (not serialized)
  private _schema?: S.Schema<A, I>

  static make<A, I>(params: {
    id: string
    name: string
    schema: S.Schema<A, I>
    description?: string
    version?: string
  }): SchemaNode<A, I> {
    const node = new SchemaNode({
      _tag: "SchemaNode",
      id: SchemaId.make(params.id),
      name: params.name,
      description: params.description,
      // Store the AST for potential serialization
      schemaDefinition: params.schema.ast,
      version: params.version ?? "1.0.0",
      createdAt: new Date()
    })
    // Attach the actual schema
    node._schema = params.schema
    return node
  }

  get schema(): S.Schema<A, I> | undefined {
    return this._schema
  }
}
