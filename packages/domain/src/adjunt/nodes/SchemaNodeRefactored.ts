import { Schema as S, DateTime } from "effect"
import { BaseNode } from "../core/BaseNode.js"
import { SchemaId } from "../core/Brand.js"

// Since schemas are not directly serializable, we store metadata and AST
const SchemaNodeSchema = S.Struct({
  _tag: S.Literal("SchemaNode"),
  id: S.String, // SchemaId in practice
  name: S.String,
  description: S.optional(S.String),
  // Store the AST as unknown - this is the best we can do for serialization
  schemaAST: S.Unknown,
  version: S.String.pipe(S.pattern(/^\d+\.\d+\.\d+$/)),
  isSerializable: S.Boolean,
  createdAt: S.DateTimeUtc
})

type SchemaNodeData = S.Schema.Type<typeof SchemaNodeSchema>

export class SchemaNode<A = unknown, I = unknown> extends BaseNode<SchemaNodeData> {
  readonly _tag = "SchemaNode" as const
  readonly [Symbol.for("effect/Schema/serializable")] = SchemaNodeSchema
  
  // Keep the actual schema in memory (not serialized)
  private _schema?: S.Schema<A, I>
  
  static make<A, I>(params: {
    id: string
    name: string
    schema: S.Schema<A, I>
    description?: string
    version?: string
  }): SchemaNode<A, I> {
    // Check if the schema is serializable
    let isSerializable = true
    let schemaAST: unknown
    
    try {
      schemaAST = params.schema.ast
      // Try to encode/decode a sample to verify serializability
      S.encodeSync(params.schema)
      S.decodeSync(params.schema)
    } catch {
      isSerializable = false
      schemaAST = null
    }
    
    const node = new SchemaNode({
      _tag: "SchemaNode",
      id: params.id, // SchemaId.make(params.id) in practice
      name: params.name,
      description: params.description,
      schemaAST,
      version: params.version ?? "1.0.0",
      isSerializable,
      createdAt: DateTime.now()
    })
    
    // Attach the actual schema
    node._schema = params.schema
    return node
  }
  
  // Check if this schema node has a serializable schema
  hasSerializableSchema(): boolean {
    return this.isSerializable
  }
  
  // Convert to identity node if schema is not serializable
  toIdentityNode(): import("../core/BaseNode.js").IdentityNode {
    if (this.hasSerializableSchema()) {
      return super.toIdentityNode()
    }
    
    return new (await import("../core/BaseNode.js"))IdentityNode({
      id: this.id,
      originalTag: this._tag,
      metadata: {
        reason: "non_serializable_schema",
        originalType: "SchemaNode",
        timestamp: DateTime.now(),
        additionalInfo: {
          schemaName: this.name,
          version: this.version
        }
      },
      createdAt: this.createdAt
    })
  }
  
  // Get the actual schema (if available)
  get schema(): S.Schema<A, I> | undefined {
    return this._schema
  }
  
  // Get schema metadata
  get schemaName(): string {
    return this.name
  }
  
  get schemaVersion(): string {
    return this.version
  }
  
  // Validate data against this schema
  validate(data: unknown): import("effect").Effect.Effect<A, S.ParseError> {
    if (!this._schema) {
      return import("effect").Effect.fail(
        new S.ParseError([{
          _tag: "Unexpected",
          actual: "missing schema",
          message: "Schema is not available for validation"
        } as any])
      )
    }
    
    return S.decode(this._schema)(data)
  }
  
  // Encode data using this schema
  encode(data: A): import("effect").Effect.Effect<I, S.ParseError> {
    if (!this._schema) {
      return import("effect").Effect.fail(
        new S.ParseError([{
          _tag: "Unexpected",
          actual: "missing schema",
          message: "Schema is not available for encoding"
        } as any])
      )
    }
    
    return S.encode(this._schema)(data)
  }
}