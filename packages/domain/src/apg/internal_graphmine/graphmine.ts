import { type HashMap } from "effect"
import type { Edge } from "../internal/edge.js"

export type EdgeId = number
export type NodeId = number

export interface GraphStorage<A> {
  nodes: HashMap.HashMap<NodeId, A>
  outgoingEdges: HashMap.HashMap<NodeId, Edge<A>>
  incomingEdges: HashMap.HashMap<NodeId, Edge<A>>
  edges: HashMap.HashMap<NodeId, Edge<A>>
  nodesByLabel: HashMap.HashMap<string, NodeId>
  edgesByType: HashMap.HashMap<string, Edge<A>>
  propertyIndex: HashMap.HashMap<string, NodeId>
}
