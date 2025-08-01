import type { Config } from "effect"

export type PrecomputeKind = "DegeneracyOrder" | "DegreeOrder" | "TriangleCountOrder"

export interface GraphMineConfig {
  readonly precomputeKinds: Config.Config<Set<PrecomputeKind>>
}
