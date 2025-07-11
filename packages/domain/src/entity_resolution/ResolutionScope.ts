import type { HashSet } from "effect"
import { Data, DateTime, HashMap } from "effect"
import type { EntityType } from "../knowledge_base/types.js"
import type { Hits, Score } from "./Candidate.js"
import type { Mention, MentionId } from "./mention/Mention.js"
import type { EntityUri } from "./schemas.js"

export type Constraints = HashMap.HashMap<EntityType, HashSet.HashSet<EntityUri>>

// Immutable state
export class ResolutionScope extends Data.Class<{
  readonly constraints: Constraints
  readonly mentions: ReadonlyArray<Mention>
  readonly results: HashMap.HashMap<MentionId, Hits<Score>>
  readonly timestamp: string // ISO 8601
}> {
  static make(constraints: Constraints = HashMap.empty()): ResolutionScope {
    return new ResolutionScope({
      constraints,
      mentions: [],
      results: HashMap.empty(),
      timestamp: DateTime.unsafeNow().toString()
    })
  }
}
