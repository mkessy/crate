import { Schema } from "effect"

const CandidateTypeId = Symbol.for("Candidate")
export type CandidateTypeId = typeof CandidateTypeId

export const CandidateId = Schema.String.pipe(Schema.brand("CandidateId"))

export class Candidate extends Schema.Class<Candidate>("Candidate")({
  id: CandidateId
}, {
  disableValidation: true
}) {
  readonly [CandidateTypeId]: CandidateTypeId = CandidateTypeId
}
