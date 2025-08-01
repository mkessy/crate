import type { Effect, HashMap, Ref } from "effect"
import type { Graph } from "../Graph.js"
import type { Relation } from "../Relation.js"
import type { GraphStorage } from "./algebraic_property.js"
import type { GraphMineConfig } from "./config.js"
import type { Precompute } from "./Precompute.js"
import type { SetOperations } from "./set.js"

export interface StreamBackedGraph<A> extends Graph<A> {
  storage: Ref.Ref<GraphStorage<A>>
  setOps: SetOperations

  config: GraphMineConfig

  views: HashMap.HashMap<string, Graph<A>>

  map<B>(f: (a: A) => B): Graph<B>

  filter(predicate: (a: A) => boolean): Graph<A>

  flatMap<B>(f: (a: A) => Graph<B>): Graph<B>

  fold<B>(initial: B, f: (acc: B, a: A) => B): Effect.Effect<B>

  toArray(): Effect.Effect<ReadonlyArray<A>>

  toRelation(): Effect.Effect<Relation<A>>

  materialize(name: string, config?: any): Effect.Effect<Graph<A>>

  withPreprocessing(strategy: "degree" | "degeneracy" | "triangles"): Graph<A>
}
