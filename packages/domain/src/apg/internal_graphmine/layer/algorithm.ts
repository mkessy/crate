import type { HashMap, Ref } from "effect"
import type { Edge } from "../internal/edge.js"

export declare function findTriangles(): void

// Example 2: PageRank using fold
export declare function pageRank(iterations: number): void

export type NodeId = number
export type EdgeId = number

export interface GraphStorage<A> {
  nodes: HashMap.HashMap<NodeId, A>
  outgoingEdges: HashMap.HashMap<NodeId, Edge<A>>
  incomingEdges: HashMap.HashMap<NodeId, Edge<A>>
  edges: HashMap.HashMap<NodeId, Edge<A>>
  nodesByLabel: HashMap.HashMap<string, NodeId>
  edgesByType: HashMap.HashMap<string, Edge<A>>
  propertyIndex: HashMap.HashMap<string, NodeId>
}

export interface AlgebraicGraphDB<A> {
  storage: Ref.Ref<GraphStorage<A>>
  nodes: HashMap.HashMap<NodeId, A>
  edges: HashMap.HashMap<NodeId, Edge<A>>
  nodesByLabel: HashMap.HashMap<string, NodeId>
  edgesByType: HashMap.HashMap<string, Edge<A>>
  propertyIndex: HashMap.HashMap<string, NodeId>
}
