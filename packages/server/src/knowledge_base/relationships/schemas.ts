import { Model } from "@effect/sql"
import { Equal, Hash, Schema } from "effect"

export const PredicateType = Schema.Literal(
  "adapter",
  "animation",
  "area",
  "arranger",
  "art direction",
  "artist rename",
  "artist-genre",
  "artistic director",
  "artists and repertoire",
  "artists and repertoire position at",
  "artwork",
  "audio",
  "audio director",
  "balance",
  "begin-area",
  "booking",
  "booklet editor",
  "choreographer",
  "chorus master",
  "cinematographer",
  "collaboration",
  "commissioned",
  "compiler",
  "composer",
  "composer-in-residence",
  "concertmaster",
  "conductor",
  "conductor position",
  "copyright",
  "creative direction",
  "creative position at",
  "dedicated to",
  "dedication",
  "design",
  "design/illustration",
  "editor",
  "end-area",
  "engineer",
  "engineer position at",
  "executive position at",
  "field recordist",
  "founder",
  "graphic design",
  "illustration",
  "instrument",
  "instrument arranger",
  "instrument technician",
  "instrumental supporting musician",
  "involved with",
  "is person",
  "label founder",
  "lacquer cut",
  "legal representation",
  "librettist",
  "licensor",
  "liner notes",
  "lyricist",
  "married",
  "mastering",
  "member of band",
  "misc",
  "mix",
  "mix-DJ",
  "named after artist",
  "named after label",
  "named after release group",
  "named after work",
  "orchestrator",
  "owner",
  "parent",
  "performer",
  "performing orchestra",
  "personal label",
  "personal publisher",
  "phonographic copyright",
  "photography",
  "position at",
  "premiere",
  "previous attribution",
  "producer",
  "producer position at",
  "production coordinator",
  "programming",
  "publishing",
  "reconstructed by",
  "recording",
  "recording contract",
  "remixer",
  "revised by",
  "samples from artist",
  "scriptwriter",
  "sibling",
  "sound",
  "sound effects",
  "subgroup",
  "supporting musician",
  "teacher",
  "transfer",
  "translator",
  "tribute",
  "video appearance",
  "video copyright",
  "video director",
  "vocal",
  "vocal arranger",
  "vocal supporting musician",
  "voice actor",
  "writer",
  // KEXP-specific predicates
  "played_on", // artist → play (reverse relationship)
  "has_recording", // play → recording
  "has_artist", // play → artist
  "has_release", // play → release
  "has_label" // play → label
)

export const EntityType = Schema.Literal(
  "area",
  "artist",
  "genre",
  "label",
  "recording",
  "release",
  "release_group",
  "work",
  // KEXP entity
  "play" // KEXP play instance
)
export class Relationship extends Model.Class<Relationship>("Relationship")({
  subject_id: Schema.String,
  subject_type: EntityType,
  subject_name: Schema.NullOr(Schema.String),
  predicate: PredicateType,
  object_id: Schema.String,
  object_type: EntityType,
  object_name: Schema.NullOr(Schema.String),
  attribute_type: Schema.NullOr(Schema.String),
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

export type PredicateTypeEncoded = Schema.Schema.Encoded<typeof PredicateType>
export type PredicateType = Schema.Schema.Type<typeof PredicateType>

export type EntityTypeEncoded = Schema.Schema.Encoded<typeof EntityType>

export type EntityType = Schema.Schema.Type<typeof EntityType>

export type RelationshipEncoded = Schema.Schema.Encoded<typeof Relationship>
