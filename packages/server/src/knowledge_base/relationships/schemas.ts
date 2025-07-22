import { KnowledgeBase } from "@crate/domain"
import { Model } from "@effect/sql"
import { ParseResult, Schema } from "effect"

export class PersistedRelationship extends Model.Class<PersistedRelationship>("PersistedRelationship")({
  ...KnowledgeBase.Relationship.fields,
  kexp_play_id: Schema.NullOr(Schema.Number),
  created_at: Model.DateTimeInsert,
  updated_at: Model.DateTimeUpdate
}) {}

export class PersistedNonArtistRelationship
  extends Model.Class<PersistedNonArtistRelationship>("PersistedNonArtistRelationship")({
    ...KnowledgeBase.NonArtistRelationship.fields,
    kexp_play_id: Schema.NullOr(Schema.Number),
    created_at: Model.DateTimeInsert,
    updated_at: Model.DateTimeUpdate
  })
{}

export type NonArtistEntityFromPersistedRel = Schema.Schema.Type<typeof NonArtistEntityFromPersistedRel>
export const NonArtistEntityFromPersistedRel = Schema.transformOrFail(
  Schema.asSchema(PersistedNonArtistRelationship),
  KnowledgeBase.EntityFromNonArtistRelationship,
  {
    strict: true,
    decode: (persisted) =>
      ParseResult.succeed(
        KnowledgeBase.NonArtistRelationship.make({
          subject_id: persisted.subject_id,
          subject_type: persisted.subject_type,
          subject_name: persisted.subject_name,
          predicate: persisted.predicate,
          object_id: persisted.object_id,
          object_type: persisted.object_type,
          object_name: persisted.object_name,
          attribute_type: persisted.attribute_type,
          source: persisted.source,
          kexp_play_id: persisted.kexp_play_id
        })
      ),
    encode: (domain, _, ast) =>
      ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          domain,
          "Cannot encode persisted relationship from domain"
        )
      )
  }
)
