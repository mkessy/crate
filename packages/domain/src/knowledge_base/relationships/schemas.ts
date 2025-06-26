import { Model } from "@effect/sql"
import { Equal, Hash, Schema } from "effect"

export class Relationship extends Model.Class<Relationship>("Relationship")({
  subject_id: Schema.Number,
  subject_type: Schema.String,
  subject_name: Schema.String,
  predicate: Schema.String,
  object_id: Schema.Number,
  object_type: Schema.String,
  object_name: Schema.String,
  attribute_type: Schema.OptionFromNonEmptyTrimmedString,
  source: Schema.Literal("musicbrainz", "kexp"),
  kexp_play_id: Schema.NullOr(Schema.Number),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) implements Equal.Equal {
  [Equal.symbol](that: Equal.Equal): boolean {
    if (that instanceof Relationship) {
      return (
        this.subject_id === that.subject_id &&
        this.predicate === that.predicate &&
        this.object_id === that.object_id &&
        this.attribute_type === that.attribute_type
      )
    }
    return false
  }
  [Hash.symbol](): number {
    return Hash.structure({
      subject_id: this.subject_id,
      predicate: this.predicate,
      object_id: this.object_id,
      attribute_type: this.attribute_type
    })
  }
}
