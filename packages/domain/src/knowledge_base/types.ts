import { Schema } from "effect"

export const EntityType = Schema.Literal(
  "recording",
  "work",
  "area",
  "artist",
  "release",
  "genre",
  "label",
  "release_group",
  // KEXP play instance
  "play"
)
export type EntityType = Schema.Schema.Type<typeof EntityType>

export const RelationType = Schema.String
export type RelationType = Schema.Schema.Type<typeof RelationType>

// Branded IDs for type safety
export const MbRecordingId = Schema.String.pipe(Schema.brand("mb_recording_id"))
export type MbRecordingId = Schema.Schema.Type<typeof MbRecordingId>

export const MbReleaseId = Schema.String.pipe(Schema.brand("mb_release_id"))
export type MbReleaseId = Schema.Schema.Type<typeof MbReleaseId>

export const MbReleaseGroupId = Schema.String.pipe(Schema.brand("mb_release_group_id"))
export type MbReleaseGroupId = Schema.Schema.Type<typeof MbReleaseGroupId>

export const MbLabelId = Schema.String.pipe(Schema.brand("mb_label_id"))
export type MbLabelId = Schema.Schema.Type<typeof MbLabelId>

export const MbArtistId = Schema.String.pipe(Schema.brand("mb_artist_id"))
export type MbArtistId = Schema.Schema.Type<typeof MbArtistId>

export const MbAreaId = Schema.String.pipe(Schema.brand("mb_area_id"))
export type MbAreaId = Schema.Schema.Type<typeof MbAreaId>

export const MbGenreId = Schema.String.pipe(Schema.brand("mb_genre_id"))
export type MbGenreId = Schema.Schema.Type<typeof MbGenreId>

export const MbWorkId = Schema.String.pipe(Schema.brand("mb_work_id"))
export type MbWorkId = Schema.Schema.Type<typeof MbWorkId>

// Base entity shape
export const BaseEntity = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: EntityType,
  disambiguation: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})

// Artist entity
export const Artist = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("artist"),
  disambiguation: Schema.optional(Schema.String),
  sort_name: Schema.optional(Schema.String),
  artist_type: Schema.optional(Schema.String),
  gender: Schema.optional(Schema.String),
  country: Schema.optional(Schema.String),
  begin_date: Schema.optional(Schema.String),
  end_date: Schema.optional(Schema.String),
  ended: Schema.optional(Schema.Boolean),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Artist = Schema.Schema.Type<typeof Artist>

// Recording entity
export const Recording = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("recording"),
  disambiguation: Schema.optional(Schema.String),
  recording_length: Schema.optional(Schema.Number), // in milliseconds
  isrc: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Recording = Schema.Schema.Type<typeof Recording>

// Release entity
export const Release = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("release"),
  disambiguation: Schema.optional(Schema.String),
  barcode: Schema.optional(Schema.String),
  country: Schema.optional(Schema.String),
  release_date: Schema.optional(Schema.String),
  status: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Release = Schema.Schema.Type<typeof Release>

// Release Group entity
export const ReleaseGroup = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("release_group"),
  disambiguation: Schema.optional(Schema.String),
  release_type: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type ReleaseGroup = Schema.Schema.Type<typeof ReleaseGroup>

// Work entity
export const Work = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("work"),
  disambiguation: Schema.optional(Schema.String),
  work_type: Schema.optional(Schema.String),
  iswc: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Work = Schema.Schema.Type<typeof Work>

// Label entity
export const Label = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("label"),
  disambiguation: Schema.optional(Schema.String),
  label_type: Schema.optional(Schema.String),
  ended: Schema.optional(Schema.Boolean),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Label = Schema.Schema.Type<typeof Label>

// Area entity
export const Area = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("area"),
  disambiguation: Schema.optional(Schema.String),
  area_type: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Area = Schema.Schema.Type<typeof Area>

// Genre entity
export const Genre = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("genre"),
  disambiguation: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Genre = Schema.Schema.Type<typeof Genre>

// Union type for any entity
export const Entity = Schema.Union(
  Artist,
  Recording,
  Release,
  ReleaseGroup,
  Work,
  Label,
  Area,
  Genre
)
export type Entity = Schema.Schema.Type<typeof Entity>

// =============================================
// Relationship Types
// =============================================

// Predicate types from MusicBrainz relationships
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
export type PredicateType = Schema.Schema.Type<typeof PredicateType>

// Relationship between entities
export const Relationship = Schema.Struct({
  subject_id: Schema.String,
  subject_type: EntityType,
  subject_name: Schema.optional(Schema.String),
  predicate: PredicateType,
  object_id: Schema.String,
  object_type: EntityType,
  object_name: Schema.optional(Schema.String),
  attribute_type: Schema.optional(Schema.String),
  source: Schema.Literal("musicbrainz", "kexp", "user", "inferred"),
  confidence: Schema.optional(Schema.Number.pipe(Schema.between(0, 1))),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Relationship = Schema.Schema.Type<typeof Relationship>

// =============================================
// Search and Normalization
