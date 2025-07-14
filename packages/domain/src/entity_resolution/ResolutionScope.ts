import type { HashSet } from "effect"
import { Data, HashMap } from "effect"
import type { EntityType } from "../knowledge_base/types.js"
import type { AnalyzedText } from "../nlp/nlp.js"
import type { Mention, MentionId } from "./mention/Mention.js"
import type { EntityUri } from "./schemas.js"

export type Constraints = HashMap.HashMap<EntityType, HashSet.HashSet<EntityUri>>

// Immutable state
export class ResolutionScope extends Data.Class<{
  readonly text: AnalyzedText
  readonly mentions: HashMap.HashMap<MentionId, Mention>
}> {
  static make(text: AnalyzedText, mentions: ReadonlyArray<Mention>): ResolutionScope {
    return new ResolutionScope({
      text,
      mentions: HashMap.fromIterable(mentions.map((mention) => [mention.id, mention]))
    })
  }
}
