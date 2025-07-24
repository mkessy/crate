import { Schema } from "effect"
import { ParsedText } from "../nlp/index.js"
import { Entity, EntityUri, Triple, TripleURI } from "../rdf/index.js"
import { Mention, MentionId } from "./Mention.js"

export type ResolutionContextId = Schema.Schema.Type<typeof ResolutionContextId>
export const ResolutionContextId = Schema.String.pipe(Schema.brand("ResolutionContextId"))

// Immutable state
export class ResolutionContext extends Schema.TaggedClass<ResolutionContext>()("ResolutionContext", {
  id: ResolutionContextId,
  text: ParsedText,
  mentions: Schema.HashMap({ key: MentionId, value: Mention }),
  entities: Schema.HashMap({ key: EntityUri, value: Entity }),
  triples: Schema.HashMap({ key: TripleURI, value: Triple })
}) {
}
