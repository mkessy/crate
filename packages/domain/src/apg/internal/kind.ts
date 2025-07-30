// Internal module: src/internal/graph-kind.ts
import type { GraphImpl } from "./core.js"

// Following the pattern from Types.ts for Concurrency
export type GraphTransformKind =
  | "directed"
  | "undirected"
  | "reflexive"
  | "transitive"
  | "symmetric"
  | "acyclic"
  | "tree"
  | "forest"
  | "bipartite"

// Brand for specific graph forms
export interface GraphKindBrand<K extends GraphTransformKind> {
  readonly _kind: K
}

// Following HashSet/HashMap pattern for internal representation
export interface GraphFormInfo {
  readonly kind: GraphTransformKind
  readonly properties: ReadonlySet<string>
}
export interface GraphKindImpl<K extends GraphTransformKind> {
  readonly _tag: "GraphKind"
  readonly kind: K
  readonly transformer: (graph: GraphImpl<any>) => GraphImpl<any>
}
