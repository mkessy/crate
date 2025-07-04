import type { Effect, Option } from "effect"
import { Data, HashMap, HashSet, SortedSet } from "effect"
import type { EntityType } from "../knowledge_base/types.js"
import type { Candidate, EntityUri, MentionId } from "./schemas.js"

// Immutable state
export class ResolutionState extends Data.Class<{
  readonly constraints: HashMap.HashMap<EntityType, HashSet.HashSet<EntityUri>>
  readonly candidates: HashMap.HashMap<MentionId, SortedSet.SortedSet<Candidate>>
  readonly resolved: HashMap.HashMap<MentionId, EntityUri>
  readonly metadata: {
    readonly iteration: number
    readonly startedAt: Date
    readonly lastExpansionAt: Option.Option<Date>
  }
}> {
  addConstraint(type: EntityType, uri: EntityUri): ResolutionState {
    return new ResolutionState({
      ...this,
      constraints: HashMap.modify(this.constraints, type, (set) => HashSet.add(set, uri))
    })
  }

  addCandidate(candidate: Candidate): ResolutionState {
    return new ResolutionState({
      ...this,
      candidates: HashMap.modify(
        this.candidates,
        candidate.mentionId,
        (sortedSet) => SortedSet.add(sortedSet, candidate)
      )
    })
  }

  resolve(mentionId: MentionId, uri: EntityUri): ResolutionState {
    return new ResolutionState({
      ...this,
      resolved: HashMap.set(this.resolved, mentionId, uri),
      metadata: {
        ...this.metadata,
        iteration: this.metadata.iteration + 1
      }
    })
  }
}

// State transition type
export interface StateTransition<A = void, E = never> {
  (state: ResolutionState): Effect.Effect<readonly [A, ResolutionState], E>
}
