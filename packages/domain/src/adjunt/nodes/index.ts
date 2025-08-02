// Re-export all node types
export { SourceDataNode } from "./SourceDataNode"
export { SchemaNode } from "./SchemaNode"
export { StrategyNode } from "./StrategyNode"
export { FunctorNode } from "./FunctorNode"
export { OptimizerNode } from "./OptimizerNode"
export { StrategyApplicationNode } from "./StrategyApplicationNode"

import { Schema as S } from "effect"
import { SourceDataNode } from "./SourceDataNode"
import { SchemaNode } from "./SchemaNode"
import { StrategyNode } from "./StrategyNode"
import { FunctorNode } from "./FunctorNode"
import { OptimizerNode } from "./OptimizerNode"
import { StrategyApplicationNode } from "./StrategyApplicationNode"

// Union type for all node types
export const AnyNode = S.Union(
  SourceDataNode,
  SchemaNode,
  StrategyNode,
  FunctorNode,
  OptimizerNode,
  StrategyApplicationNode
)

export type AnyNode = S.Schema.Type<typeof AnyNode>

// Type guards
export const isSourceDataNode = (node: AnyNode): node is SourceDataNode =>
  node._tag === "SourceDataNode"

export const isSchemaNode = (node: AnyNode): node is SchemaNode<any, any> =>
  node._tag === "SchemaNode"

export const isStrategyNode = (
  node: AnyNode
): node is StrategyNode<any, any, any> => node._tag === "StrategyNode"

export const isFunctorNode = (node: AnyNode): node is FunctorNode =>
  node._tag === "FunctorNode"

export const isOptimizerNode = (node: AnyNode): node is OptimizerNode =>
  node._tag === "OptimizerNode"

export const isStrategyApplicationNode = (
  node: AnyNode
): node is StrategyApplicationNode => node._tag === "StrategyApplicationNode"