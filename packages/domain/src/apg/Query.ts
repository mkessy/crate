import type { Cache, Types } from "effect"

export interface CacheQuery<A> {
  readonly _A: Types.Covariant<A>
  readonly kind: "cache"
  readonly cache: Cache.Cache<string, A>
}
