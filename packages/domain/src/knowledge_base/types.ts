import { Schema } from "effect"
import { KexpTrackPlay } from "../kexp/schemas.js"

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
export const isArtist = Schema.is(Artist)
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
export const isRecording = Schema.is(Recording)
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
export const isRelease = Schema.is(Release)
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
export const isReleaseGroup = Schema.is(ReleaseGroup)
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
export const isWork = Schema.is(Work)
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
export const isLabel = Schema.is(Label)
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
export const isArea = Schema.is(Area)

export const Play = KexpTrackPlay.pipe(Schema.omit("play_type"))
// Play entity
export const isPlay = Schema.is(Play)
export type Play = Schema.Schema.Type<typeof Play>

// Genre entity
export const Genre = Schema.Struct({
  mb_id: Schema.String,
  name: Schema.String,
  type: Schema.Literal("genre"),
  disambiguation: Schema.optional(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export const isGenre = Schema.is(Genre)
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
  // Primary Creative (Artist -> Work)
  "composer",
  "lyricist",
  "writer",
  "librettist",
  "scriptwriter",
  "adapter",
  "translator",
  "revised by",
  "reconstructed by",
  "previous attribution",
  // Performance (Artist -> Recording/Release)
  "performer",
  "instrument",
  "vocal",
  "performing orchestra",
  "conductor",
  "chorus master",
  "concertmaster",
  "audio director",
  // Arrangement & Orchestration
  "arranger",
  "instrument arranger",
  "vocal arranger",
  "orchestrator",
  // Production & Engineering (Artist -> Recording/Release)
  "producer",
  "engineer",
  "audio",
  "mastering",
  "sound",
  "mix",
  "recording",
  "field recordist",
  "programming",
  "editor",
  "balance",
  "sound effects",
  "lacquer cut",
  // Remixing & Compilation
  "remixer",
  "mix-DJ",
  "compiler",
  "samples from artist",
  // Visual & Video
  "video director",
  "cinematographer",
  "animation",
  "choreographer",
  "video appearance",
  // Design & Visual Arts
  "artwork",
  "design",
  "graphic design",
  "illustration",
  "design/illustration",
  "photography",
  "art direction",
  "creative direction",
  "booklet editor",
  "liner notes",
  // Organizational (Artist -> Artist)
  "member of band",
  "subgroup",
  "collaboration",
  "tribute",
  "artist rename",
  "founder",
  "supporting musician",
  "vocal supporting musician",
  "instrumental supporting musician",
  "is person",
  "voice actor",
  // Leadership & Positions
  "artistic director",
  "conductor position",
  "composer-in-residence",
  "teacher",
  // Personal Relationships (Artist -> Artist)
  "parent",
  "sibling",
  "married",
  "involved with",
  // Business & Legal (Artist -> Label)
  "recording contract",
  "label founder",
  "owner",
  "personal label",
  "producer position at",
  "engineer position at",
  "executive position at",
  "creative position at",
  "artists and repertoire",
  "artists and repertoire position at",
  "position at",
  // Rights & Legal
  "copyright",
  "phonographic copyright",
  "video copyright",
  "publishing",
  "personal publisher",
  "licensor",
  "legal representation",
  // Geographic (Artist -> Area)
  "area",
  "begin-area",
  "end-area",
  // Miscellaneous Credits
  "misc",
  "booking",
  "production coordinator",
  "instrument technician",
  "commissioned",
  "dedication",
  "dedicated to",
  "premiere",
  "transfer",
  // Named After Relationships
  "named after artist",
  "named after label",
  "named after release group",
  "named after work",
  // Genre Relationship
  "artist-genre",
  // KEXP-specific predicates
  "played_on",
  "has_recording",
  "has_artist",
  "has_release",
  "has_label"
)

export type PredicateType = Schema.Schema.Type<typeof PredicateType>

// Relationship between entities
export const Relationship = Schema.Struct({
  subject_id: Schema.String,
  subject_type: EntityType,
  subject_name: Schema.NullOr(Schema.String),
  predicate: PredicateType,
  object_id: Schema.String,
  object_type: EntityType,
  object_name: Schema.NullOr(Schema.String),
  attribute_type: Schema.NullOr(Schema.String),
  source: Schema.Literal("musicbrainz", "kexp"),
  kexp_play_id: Schema.NullOr(Schema.String),
  created_at: Schema.DateTimeUtc,
  updated_at: Schema.DateTimeUtc
})
export type Relationship = Schema.Schema.Type<typeof Relationship>

// =============================================
// Search and Normalization

export type ArtistCacheView = Schema.Schema.Type<typeof ArtistCacheView>
export const ArtistCacheView = Schema.Struct({
  artist_id: Schema.String,
  total_plays: Schema.Number,
  recent_plays: Schema.Number,
  last_played: Schema.String,
  unique_albums: Schema.Number,
  unique_releases: Schema.Number,
  plays_this_year: Schema.Number,
  cache_score: Schema.Number
})

// =============================================
// Predicate Groupings by Semantic Meaning
// =============================================

// Primary Creative Relationships (WHO created the work)
export const CreativeAuthorshipPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "composer",
    "lyricist",
    "writer",
    "librettist",
    "scriptwriter"
  )
)

// Performance Relationships (WHO performed it)
export const PerformancePredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "performer",
    "instrument",
    "vocal",
    "performing orchestra",
    "conductor",
    "chorus master",
    "concertmaster",
    "audio director"
  )
)

// Arrangement & Adaptation (HOW it was adapted)
export const ArrangementPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "arranger",
    "instrument arranger",
    "vocal arranger",
    "orchestrator",
    "adapter",
    "translator",
    "revised by",
    "reconstructed by"
  )
)

// Production & Engineering (HOW it was recorded/produced)
export const ProductionEngineeringPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "producer",
    "engineer",
    "audio",
    "mastering",
    "sound",
    "mix",
    "recording",
    "field recordist",
    "programming",
    "editor",
    "balance",
    "sound effects",
    "lacquer cut"
  )
)

// Remixing & Derivative Works
export const RemixCompilationPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "remixer",
    "mix-DJ",
    "compiler",
    "samples from artist"
  )
)

// Visual & Video Production
export const VisualProductionPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "video director",
    "cinematographer",
    "animation",
    "choreographer",
    "video appearance"
  )
)

// Design & Visual Arts
export const DesignArtworkPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "artwork",
    "design",
    "graphic design",
    "illustration",
    "design/illustration",
    "photography",
    "art direction",
    "creative direction",
    "booklet editor",
    "liner notes"
  )
)

// Organizational Relationships (Artist -> Artist)
export const OrganizationalPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "member of band",
    "subgroup",
    "collaboration",
    "tribute",
    "artist rename",
    "founder",
    "supporting musician",
    "vocal supporting musician",
    "instrumental supporting musician",
    "is person",
    "voice actor"
  )
)

// Leadership & Educational Positions
export const LeadershipEducationalPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "artistic director",
    "conductor position",
    "composer-in-residence",
    "teacher"
  )
)

// Personal Relationships (Artist -> Artist)
export const PersonalRelationshipPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "parent",
    "sibling",
    "married",
    "involved with"
  )
)

// Business & Label Relationships (Artist -> Label)
export const BusinessLabelPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "recording contract",
    "label founder",
    "owner",
    "personal label",
    "producer position at",
    "engineer position at",
    "executive position at",
    "creative position at",
    "artists and repertoire",
    "artists and repertoire position at",
    "position at"
  )
)

// Rights & Legal Relationships
export const RightsLegalPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "copyright",
    "phonographic copyright",
    "video copyright",
    "publishing",
    "personal publisher",
    "licensor",
    "legal representation"
  )
)

// Geographic Relationships (Artist -> Area)
export const GeographicPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "area",
    "begin-area",
    "end-area"
  )
)

// Miscellaneous & Support Credits
export const MiscellaneousPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "misc",
    "booking",
    "production coordinator",
    "instrument technician",
    "commissioned",
    "dedication",
    "dedicated to",
    "premiere",
    "transfer",
    "previous attribution"
  )
)

// Named After Relationships
export const NamedAfterPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "named after artist",
    "named after label",
    "named after release group",
    "named after work"
  )
)

// Genre Relationships
export const GenrePredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "artist-genre"
  )
)

// KEXP Play Tracking
export const KexpPlayPredicates = PredicateType.pipe(
  Schema.pickLiteral(
    "played_on",
    "has_recording",
    "has_artist",
    "has_release",
    "has_label"
  )
)

// =============================================
// High-Level Predicate Categories
// =============================================

// All creative/authorship predicates
export const AllCreativePredicates = Schema.Union(
  CreativeAuthorshipPredicates,
  ArrangementPredicates
)

// All performance-related predicates
export const AllPerformancePredicates = Schema.Union(
  PerformancePredicates,
  ProductionEngineeringPredicates,
  RemixCompilationPredicates
)

// All organizational/group predicates
export const AllOrganizationalPredicates = Schema.Union(
  OrganizationalPredicates,
  LeadershipEducationalPredicates
)

// All business/commercial predicates
export const AllBusinessPredicates = Schema.Union(
  BusinessLabelPredicates,
  RightsLegalPredicates
)

// All visual/design predicates
export const AllVisualPredicates = Schema.Union(
  VisualProductionPredicates,
  DesignArtworkPredicates
)

// =============================================
// Predicate Importance Levels
// =============================================

// Primary predicates (most important for understanding music relationships)
export const PrimaryPredicates = Schema.Union(
  CreativeAuthorshipPredicates,
  PredicateType.pipe(Schema.pickLiteral("performer", "producer", "member of band"))
)

// Secondary predicates (important supporting information)
export const SecondaryPredicates = Schema.Union(
  PredicateType.pipe(
    Schema.pickLiteral(
      "instrument",
      "vocal",
      "conductor",
      "engineer",
      "mix",
      "mastering",
      "remixer",
      "arranger",
      "orchestrator"
    )
  )
)

// =============================================
// Helper functions for predicate analysis
// =============================================

// Check if a predicate is about creative authorship
export const isCreativeAuthorship = Schema.is(CreativeAuthorshipPredicates)

// Check if a predicate is about performance
export const isPerformance = Schema.is(PerformancePredicates)

// Check if a predicate is about production/engineering
export const isProductionEngineering = Schema.is(ProductionEngineeringPredicates)

// Check if a predicate is organizational
export const isOrganizational = Schema.is(OrganizationalPredicates)

// Check if a predicate is primary (most important)
export const isPrimaryPredicate = Schema.is(PrimaryPredicates)

// Check if a predicate is secondary
export const isSecondaryPredicate = Schema.is(SecondaryPredicates)

// Get predicate category
export const getPredicateCategory = (predicate: PredicateType): string => {
  if (isCreativeAuthorship(predicate)) return "creative_authorship"
  if (isPerformance(predicate)) return "performance"
  if (isProductionEngineering(predicate)) return "production_engineering"
  if (Schema.is(RemixCompilationPredicates)(predicate)) return "remix_compilation"
  if (Schema.is(VisualProductionPredicates)(predicate)) return "visual_production"
  if (Schema.is(DesignArtworkPredicates)(predicate)) return "design_artwork"
  if (isOrganizational(predicate)) return "organizational"
  if (Schema.is(LeadershipEducationalPredicates)(predicate)) return "leadership_educational"
  if (Schema.is(PersonalRelationshipPredicates)(predicate)) return "personal_relationship"
  if (Schema.is(BusinessLabelPredicates)(predicate)) return "business_label"
  if (Schema.is(RightsLegalPredicates)(predicate)) return "rights_legal"
  if (Schema.is(GeographicPredicates)(predicate)) return "geographic"
  if (Schema.is(KexpPlayPredicates)(predicate)) return "kexp_play"
  if (Schema.is(GenrePredicates)(predicate)) return "genre"
  if (Schema.is(NamedAfterPredicates)(predicate)) return "named_after"
  return "miscellaneous"
}

// Get predicate importance level
export const getPredicateImportance = (predicate: PredicateType): "primary" | "secondary" | "tertiary" => {
  if (isPrimaryPredicate(predicate)) return "primary"
  if (isSecondaryPredicate(predicate)) return "secondary"
  return "tertiary"
}
