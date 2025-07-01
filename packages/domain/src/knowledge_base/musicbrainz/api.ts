import type { Either, Schema } from "effect"
import { Effect } from "effect"
import type { ParseError } from "effect/ParseResult"
import * as Relationships from "../relationships/schemas.js"
import type * as MBSchemas from "./schemas.js"

// ==========================================
// SCHEMA
// ==========================================

export const relationsFromMBArtist = (
  artist: MBSchemas.MBArtistFromApi,
  kexpPlayId: number | null
): Effect.Effect<
  ReadonlyArray<Either.Either<Schema.Schema.Type<typeof Relationships.Relationship.insert>, ParseError>>
> =>
  Effect.forEach(artist.relations, (relation) =>
    Effect.gen(function*() {
      const targetType = relation["target-type"]

      // Extract target entity information based on the target type
      // Each relation type has its own field (url, artist, work, recording, etc.)
      let objectId: string
      let objectName: string

      if (relation.artist && targetType === "artist") {
        objectId = relation.artist.id
        objectName = relation.artist.name
      } else if (relation.work && targetType === "work") {
        objectId = relation.work.id
        objectName = relation.work.title
      } else if (relation.recording && targetType === "recording") {
        objectId = relation.recording.id
        objectName = relation.recording.title
      } else if (relation.release && targetType === "release") {
        objectId = relation.release.id
        objectName = relation.release.title
      } else if (relation["release-group"] && targetType === "release-group") {
        objectId = relation["release-group"].id
        objectName = relation["release-group"].title
      } else if (relation.genre && targetType === "genre") {
        objectId = relation.genre.id
        objectName = relation.genre.name
      } else if (relation.label && targetType === "label") {
        objectId = relation.label.id
        objectName = relation.label.name
      } else if (relation.area && targetType === "area") {
        objectId = relation.area.id
        objectName = relation.area.name
      }

      const result = yield* Effect.either(Effect.try({
        try: () =>
          Relationships.Relationship.insert.make({
            subject_id: artist.id,
            subject_type: "artist",
            subject_name: artist.name,
            predicate: relation.type as Relationships.PredicateType,
            object_id: objectId,
            object_type: targetType === "release-group" ? "release_group" : targetType as Relationships.EntityType,
            object_name: objectName,
            attribute_type: JSON.stringify(relation["attributes"]),
            source: "musicbrainz",
            kexp_play_id: kexpPlayId
          }),
        catch: (error) => error as ParseError
      }))
      return result
    }), { concurrency: "unbounded" })

// ==========================================
// MUSICBRAINZ SERVICE
// ==========================================

/*
You can request relationships with the appropriate includes:

 - area-rels
 - artist-rels
 - event-rels
 - genre-rels
 - instrument-rels
 - label-rels
 - place-rels
 - recording-rels
 - release-rels
 - release-group-rels
 - series-rels
 - url-rels
 - work-rels
 */
