import { HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { Effect, Either, Schedule, Schema } from "effect"
import type { ParseError } from "effect/ParseResult"
import * as MBEntities from "../mb_entity/schemas.js"
import * as Relationships from "../relationships/schemas.js"
import * as MBSchemas from "./schemas.js"

// ==========================================
// SCHEMA
// ==========================================

export const relationsFromMBArtist = (artist: MBSchemas.MBArtistFromApi) =>
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
      } else {
        // Skip relations we don't have target entity data for
        return Either.left(relation)
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
            kexp_play_id: null
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

const MBRElationshipParams = {
  "area": "area-rels",
  "genre": "genre-rels",
  "artist": "artist-rels",
  "instrument": "instrument-rels",
  "work": "work-rels",
  "release": "release-rels",
  "recording": "recording-rels",
  "release-group": "release-group-rels"
}

const fetchArtist = (artistId: string, userAgent: string) =>
  Effect.gen(function*() {
    const inclString = Object.entries(MBRElationshipParams).map(([_key, value]) => `${value}`).join("+")

    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(HttpClientRequest.setHeaders({
        "User-Agent": userAgent,
        "Accept": "application/json"
      })),
      HttpClient.retryTransient({
        schedule: Schedule.exponential("2 seconds"),
        times: 3
      }),
      HttpClient.filterStatusOk
    )

    const response = yield* client.get(
      `https://musicbrainz.org/ws/2/artist/${artistId}?inc=${inclString}&fmt=json`
    ).pipe(
      Effect.tap((a) => a.json.pipe(Effect.flatMap(Effect.log))),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(MBSchemas.MBArtistResponse))
    )

    return response
  })

// Fetch artists and extract their relationships
export const fetchArtistWithRelationships = (artistId: string, userAgent: string) =>
  Effect.gen(function*() {
    const { relations, ...artist } = yield* fetchArtist(artistId, userAgent)

    const artistInsert = yield* Schema.decode(MBEntities.ArtistMBEntityMaster.insert)({
      artist_mb_id: MBEntities.MbArtistId.make(artist.id),
      artist_name: artist.name,
      artist_disambiguation: artist.disambiguation ?? null,
      artist_type: artist.type ?? "artist",
      artist_gender: artist.gender ?? null,
      artist_country: artist.country ?? null,
      artist_life_begin: artist["life-span"]?.begin ?? null,
      artist_life_end: artist["life-span"]?.end ?? null,
      artist_life_ended: artist["life-span"]?.ended ? 1 : 0,
      entity_type: "artist",
      entity_metadata: JSON.stringify(artist),
      entity_mb_id: artist.id,
      relation_type: "artist",
      direction: "forward",
      entity_disambiguation: artist.disambiguation ?? "",
      ended: artist["life-span"]?.ended ? 1 : 0,
      begin_date: artist["life-span"]?.begin ?? null,
      end_date: artist["life-span"]?.end ?? null,
      attribute_type: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Process all relationships from all artists
    const allRelationships = yield* relationsFromMBArtist({ ...artist, relations })

    return {
      artistInsert,
      relationships: allRelationships
    } as const
  })
