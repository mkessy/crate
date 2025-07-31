import type { HashMap } from "effect"
import type { Edge } from "../internal/edge.js"
import type { NodeId } from "./algebraic_property.js"
import type { StreamBackedGraph } from "./graphone.js"

export interface AlgebraicGraph<A> {
  readonly nodes: HashMap.HashMap<NodeId, A>
  readonly edges: HashMap.HashMap<NodeId, Edge<A>>
  readonly nodesByLabel: HashMap.HashMap<string, NodeId>
  readonly edgesByType: HashMap.HashMap<string, Edge<A>>
  readonly propertyIndex: HashMap.HashMap<string, NodeId>
}
