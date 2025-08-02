import type { Brand } from "effect"
import { Schema as S } from "effect"

// Branded types for type-safe identifiers

export type IdentityNodeId = string & Brand.Brand<"IdentityNodeId">
export const IdentityNodeId = S.String.pipe(S.brand("IdentityNodeId"))

export type NodeId = string & Brand.Brand<"NodeId">
export const NodeId = S.String.pipe(S.brand("NodeId"))

export type SchemaId = string & Brand.Brand<"SchemaId">
export const SchemaId = S.String.pipe(S.brand("SchemaId"))

export type StrategyId = string & Brand.Brand<"StrategyId">
export const StrategyId = S.String.pipe(S.brand("StrategyId"))

export type EdgeId = string & Brand.Brand<"EdgeId">
export const EdgeId = S.String.pipe(S.brand("EdgeId"))

export type CorrelationId = string & Brand.Brand<"CorrelationId">
export const CorrelationId = S.String.pipe(S.brand("CorrelationId"))

export type FunctorId = string & Brand.Brand<"FunctorId">
export const FunctorId = S.String.pipe(S.brand("FunctorId"))

export type OptimizerNodeId = string & Brand.Brand<"OptimizerNodeId">
export const OptimizerNodeId = S.String.pipe(S.brand("OptimizerNodeId"))
