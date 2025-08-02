import { Schema as S, DateTime } from "effect"
import { BaseNode, type BaseNodeInterface } from "../core/BaseNode.js"

// Serializable schema for SourceDataNode
const SourceDataNodeSchema = S.Struct({
  _tag: S.Literal("SourceDataNode"),
  id: S.String, // Will be branded in practice
  sourceUri: S.String,
  metadata: S.optional(S.Record({ key: S.String, value: S.Unknown })),
  createdAt: S.DateTimeUtc
})

interface SourceDataNodeData extends BaseNodeInterface {
  readonly _tag: "SourceDataNode"
  readonly sourceUri: string
  readonly metadata?: Record<string, unknown>
}

export class SourceDataNode extends BaseNode<SourceDataNodeData> {
  readonly _tag = "SourceDataNode" as const
  readonly serializableSchema = SourceDataNodeSchema
  
  static make(params: {
    id: string
    sourceUri: string
    metadata?: Record<string, unknown>
  }): SourceDataNode {
    return new SourceDataNode({
      _tag: "SourceDataNode",
      id: params.id,
      sourceUri: params.sourceUri,
      metadata: params.metadata,
      createdAt: DateTime.now()
    })
  }
  
  // SourceDataNode is always serializable since it only contains primitive data
  hasSerializableSchema(): boolean {
    return true
  }
  
  // Getter for URI
  get uri(): string {
    return this.sourceUri
  }
  
  // Check if metadata exists
  hasMetadata(): boolean {
    return this.metadata !== undefined && Object.keys(this.metadata).length > 0
  }
  
  // Get specific metadata value
  getMetadataValue(key: string): unknown {
    return this.metadata?.[key]
  }
}