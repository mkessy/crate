import type { Effect, HashMap, Ref } from "effect"
import type { Graph } from "../Graph.js"
import type { Relation } from "../Relation.js"
import type { GraphStorage } from "./algebraic_property.js"
import type { MaterializeConfig } from "./config.js"
import type { PrecomputedIndices } from "./precompute.js"
import type { SetOperations } from "./set.js"

export interface StreamBackedGraph<A> extends Graph<A> {
  storage: Ref.Ref<GraphStorage<A>>
  setOps: SetOperations<A>

  config: {
    materializedViews: HashMap.HashMap<string, MaterializeConfig>
    preprocessing: PrecomputedIndices
  }

  views: HashMap.HashMap<string, Graph<A>>

  map<B>(f: (a: A) => B): Graph<B>

  filter(predicate: (a: A) => boolean): Graph<A>

  flatMap<B>(f: (a: A) => Graph<B>): Graph<B>

  fold<B>(initial: B, f: (acc: B, a: A) => B): Effect.Effect<B>

  toArray(): Effect.Effect<ReadonlyArray<A>>

  toRelation(): Effect.Effect<Relation<A>>

  findTriangles(): Graph<[A, A, A]>

  materialize(name: string, config?: any): Effect.Effect<Graph<A>>

  withPreprocessing(strategy: "degree" | "degeneracy" | "triangles"): Graph<A>
}
