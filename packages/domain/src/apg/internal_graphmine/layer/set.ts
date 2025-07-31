import type { Effect, HashSet } from "effect"

export interface SetOperations<A> {
  // Creating variants
  readonly intersect: (a: Set<A>, b: Set<A>) => Effect.Effect<Set<A>>
  readonly union: (a: Set<A>, b: Set<A>) => Effect.Effect<Set<A>>
  readonly difference: (a: Set<A>, b: Set<A>) => Effect.Effect<Set<A>>

  // Count-only variants (key optimization!)
  readonly intersectCount: (a: Set<A>, b: Set<A>) => Effect.Effect<number>
  readonly unionCount: (a: Set<A>, b: Set<A>) => Effect.Effect<number>
  readonly differenceCount: (a: Set<A>, b: Set<A>) => Effect.Effect<number>

  // In-place variants (for memory efficiency)
  readonly intersectInPlace: (target: HashSet.HashSet<A>, other: Set<A>) => Effect.Effect<void>
  readonly unionInPlace: (target: HashSet.HashSet<A>, other: Set<A>) => Effect.Effect<void>
  readonly differenceInPlace: (target: HashSet.HashSet<A>, other: Set<A>) => Effect.Effect<void>

  // Element operations
  readonly add: (set: HashSet.HashSet<A>, elem: A) => Effect.Effect<void>
  readonly remove: (set: HashSet.HashSet<A>, elem: A) => Effect.Effect<void>
  readonly contains: (set: Set<A>, elem: A) => Effect.Effect<boolean>
}

// Usage in algorithms
