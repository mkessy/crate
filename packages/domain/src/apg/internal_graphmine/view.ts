import type { Brand, Cache, Chunk, Effect, Option, Ref, Stream } from "effect"
import type { EdgeId } from "./algebraic_property.js"
import type { VertexId } from "./layer/storage.js"

export type ViewId = string & Brand.Brand<"ViewId">

export interface View<A> {
  readonly id: ViewId
  readonly compute: Stream.Stream<A>
  readonly cache: Ref.Ref<Option.Option<Chunk.Chunk<A>>>
  readonly config: ViewCache
}

export type ViewCache = Cache.Cache<VertexId | EdgeId, VertexId | EdgeId, VertexId | EdgeId>

export interface ViewService {
  readonly create: <A>(
    id: ViewId,
    materialize: Stream.Stream<A>,
    cache: ViewCache
  ) => Effect.Effect<View<A>>

  readonly get: <A>(id: ViewId) => Effect.Effect<Option.Option<View<A>>>
  readonly invalidate: (id: ViewId) => Effect.Effect<void>
  readonly refresh: (id: ViewId) => Effect.Effect<boolean>
}
