import type { KeyValueStore } from "@effect/platform"
import type { PlatformError } from "@effect/platform/Error"
import type { Effect } from "effect"
import { Schema } from "effect"
import type { Area, Artist, Genre, Label, Play, Recording, ReleaseGroup } from "../knowledge_base/index.js"
import { Entity, Relationship } from "../knowledge_base/index.js"

export const StaticData = Schema.Struct({
  entities: Schema.NonEmptyArray(Entity),
  relations: Schema.NonEmptyArray(Relationship)
})
export type StaticData = Schema.Schema.Type<typeof StaticData>

export interface EntityStore extends KeyValueStore.KeyValueStore {
  // entities
  readonly artists: KeyValueStore.SchemaStore<Artist, never>
  readonly albums: KeyValueStore.SchemaStore<ReleaseGroup, never>
  readonly songs: KeyValueStore.SchemaStore<Recording, never>
  readonly plays: KeyValueStore.SchemaStore<Play, never>
  readonly genres: KeyValueStore.SchemaStore<Genre, never>
  readonly labels: KeyValueStore.SchemaStore<Label, never>
  readonly areas: KeyValueStore.SchemaStore<Area, never>

  // relations
  readonly relations: KeyValueStore.SchemaStore<Relationship, never>

  readonly hydrate: (
    staticData: StaticData
  ) => Effect.Effect<void, PlatformError>

  readonly getArtistWithDetails: (
    artistUri: string,
    relations: ReadonlyArray<Relationship>
  ) => Effect.Effect<
    { artist: Artist; relations: ReadonlyArray<Relationship> },
    PlatformError
  >
}
