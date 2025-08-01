import { Context, type Effect, type HashSet } from "effect"

export class SetOperations extends Context.Tag("SetOperations")<SetOperations, {
  readonly intersect: (a: Set<any>, b: Set<any>) => Effect.Effect<Set<any>>
  readonly union: (a: Set<any>, b: Set<any>) => Effect.Effect<Set<any>>
  readonly difference: (a: Set<any>, b: Set<any>) => Effect.Effect<Set<any>>

  // Count-only variants (key optimization!)
  readonly intersectCount: (a: Set<any>, b: Set<any>) => Effect.Effect<number>
  readonly unionCount: (a: Set<any>, b: Set<any>) => Effect.Effect<number>
  readonly differenceCount: (a: Set<any>, b: Set<any>) => Effect.Effect<number>

  // In-place variants (for memory efficiency)
  readonly intersectInPlace: (target: HashSet.HashSet<any>, other: Set<any>) => Effect.Effect<void>
  readonly unionInPlace: (target: HashSet.HashSet<any>, other: Set<any>) => Effect.Effect<void>
  readonly differenceInPlace: (target: HashSet.HashSet<any>, other: Set<any>) => Effect.Effect<void>

  // Element operations
  readonly add: (set: HashSet.HashSet<any>, elem: any) => Effect.Effect<void>
  readonly remove: (set: HashSet.HashSet<any>, elem: any) => Effect.Effect<void>
  readonly contains: (set: Set<any>, elem: any) => Effect.Effect<boolean>
}>() {}
