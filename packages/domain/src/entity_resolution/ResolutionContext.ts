import { Schema } from "effect"
import { ParsedText } from "../nlp/index.js"
import { Entity, EntityUri } from "./Entity.js"
import { Mention, MentionId } from "./Mention.js"
import { Relationship, RelationsUri } from "./Relationship.js"

export type ResolutionContextId = Schema.Schema.Type<typeof ResolutionContextId>
export const ResolutionContextId = Schema.String.pipe(Schema.brand("ResolutionContextId"))

// Immutable state
export class ResolutionContext extends Schema.TaggedClass<ResolutionContext>()("ResolutionContext", {
  id: ResolutionContextId,
  text: ParsedText,
  mentions: Schema.HashMap({ key: MentionId, value: Mention }),
  entities: Schema.HashMap({ key: EntityUri, value: Entity }),
  relationships: Schema.HashMap({ key: RelationsUri, value: Relationship })
}) {
}
