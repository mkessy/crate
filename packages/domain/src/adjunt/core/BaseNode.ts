import type { DateTime } from "effect"
import { Data, Schema, Schema as S } from "effect"
import { IdentityNodeId } from "./Brand.js"

// Base interface that all nodes must implement
export interface BaseNodeInterface {
  readonly _tag: string
  readonly id: string // NodeId in practice
  readonly createdAt: DateTime.Utc
}

// Abstract base class for all nodes in the APG
export abstract class BaseNode<T extends BaseNodeInterface> extends Data.Class {
  abstract readonly _tag: string
  abstract readonly id: string
  abstract readonly createdAt: DateTime.Utc

  // Serializable implementation - must be overridden by concrete classes
  abstract readonly serializableSchema: S.Schema<T, any, never>

  // Convert to serializable representation
  toSerialized(): any {
    return S.encodeSync(this.serializableSchema)(this as any)
  }

  // Create from serializable representation
  static fromSerialized<T extends BaseNode<any>>(
    this: new(...args: Array<any>) => T,
    schema: S.Schema<T, any, never>,
    data: any
  ): T {
    return S.decodeSync(schema)(data)
  }

  // Check if a node has serializable schema
  hasSerializableSchema(): boolean {
    try {
      this.toSerialized()
      return true
    } catch {
      return false
    }
  }

  // Create identity node for non-serializable nodes
  toIdentityNode(): IdentityNode {
    return IdentityNode.make({
      id: this.id as IdentityNodeId,
      originalTag: this._tag,
      reason: "non_serializable_schema",
      originalType: this.constructor.name
    })
  }
}

export type IdentityNode = S.Schema.Type<typeof IdentityNode>
export const IdentityNode = S.TaggedStruct("IdentityNode", {
  id: IdentityNodeId,
  originalTag: S.String,
  createdAt: S.DateTimeUtc,
})

// Utility type to extract the encoded type from a node
export type EncodedType<T extends BaseNode<any>> = T extends BaseNode<infer U> ? U : never

// Type predicate for checking if something is a BaseNode
export const isBaseNode = (value: unknown): value is BaseNode<any> => value instanceof BaseNode

// Type predicate for identity nodes
export const isIdentityNode = (node: IdentityNode): node is IdentityNode => Schema.is(IdentityNode)(node)
