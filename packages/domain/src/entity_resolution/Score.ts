import { Schema } from "effect"
import { Candidate } from "./Candidate.js"
import { Mention } from "./Mention.js"

/**
 * A Scorable represents the pair of items being compared and scored.
 * It is the primary input to any scoring operation.
 */
export class Scorable extends Schema.TaggedClass<Scorable>()("Scorable", {
  mention: Mention,
  candidate: Candidate
}) {}
