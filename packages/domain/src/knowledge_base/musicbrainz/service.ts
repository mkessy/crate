import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import type { RequestError, ResponseError } from "@effect/platform/HttpClientError"
import { SqlClient, SqlSchema } from "@effect/sql"
import type { SqlError } from "@effect/sql/SqlError"
import { Array, DateTime, Effect, Schedule, Schema, Stream } from "effect"
import type { ParseError } from "effect/ParseResult"
import { MusicKBSqlLive } from "../../Sql.js"
import { AuditLog, MBArtistFetchMetaData } from "../audit/schemas.js"
import * as AuditService from "../audit/service.js"
import * as MBEntities from "../mb_entity/schemas.js"
import * as MBDataService from "../mb_entity/service.js"
import * as RelationshipService from "../relationships/service.js"
import { relationsFromMBArtist } from "./api.js"
import * as MBSchemas from "./schemas.js"

export class MusicBrainzService extends Effect.Service<MusicBrainzService>()("MusicBrainzService", {
  accessors: true,
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient
    const mbData = yield* MBDataService.MBDataService
    const relationshipService = yield* RelationshipService.RelationshipService
    const audit = yield* AuditService.AuditService

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

    const fetchArtist = (
      artistId: string,
      kexpPlayId: number | null,
      userAgent: string = "CrateAPI/1.0 (https://github.com/mkessy)"
    ): Effect.Effect<MBSchemas.MBArtistResponse, ParseError | RequestError | ResponseError | SqlError> =>
      Effect.gen(function*() {
        const inclString = Object.entries(MBRElationshipParams).map(([_key, value]) => `${value}`).join("+")
        const mbUrl = `https://musicbrainz.org/ws/2/artist/${artistId}?inc=${inclString}&fmt=json`

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
          mbUrl
        ).pipe(
          Effect.catchTag("ResponseError", (error) =>
            Effect.gen(function*() {
              if (error.response.status === 404) {
                yield* Effect.logError(`Artist ${artistId} not found in MusicBrainz API`)
                yield* audit.insertAuditLog(AuditLog.insert.make({
                  type: "http_fetch",
                  metadata: MBArtistFetchMetaData.make({
                    type: "musicbrainz_artist_fetch",
                    artist_mb_id: artistId,
                    kexp_play_id: kexpPlayId,
                    mb_url: mbUrl,
                    mb_response: null,
                    status: error.response.status
                  })
                }))
              }
              return yield* Effect.fail(error)
            })),
          Effect.tap((response) =>
            audit.insertAuditLog(AuditLog.insert.make({
              type: "http_fetch",
              metadata: MBArtistFetchMetaData.make({
                type: "musicbrainz_artist_fetch",
                artist_mb_id: artistId,
                kexp_play_id: kexpPlayId,
                mb_url: mbUrl,
                mb_response: response.toJSON(),
                status: response.status
              })
            }))
          ),
          Effect.flatMap(HttpClientResponse.schemaBodyJson(MBSchemas.MBArtistResponse))
        )

        return response
      }).pipe(Effect.provide(FetchHttpClient.layer))

    // Fetch artists and extract their relationships
    const fetchArtistWithRelationships = (artistId: string, kexpPlayId: number | null, userAgent: string) =>
      Effect.gen(function*() {
        const { relations, ...artist } = yield* fetchArtist(artistId, kexpPlayId, userAgent)

        const artistInsert = yield* Schema.decode(MBEntities.ArtistMBEntityMaster.insert)({
          artist_mb_id: MBEntities.MbArtistId.make(artist.id),
          artist_name: artist.name,
          artist_disambiguation: artist.disambiguation ?? null,
          artist_type: artist.type ?? null,
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
          created_at: DateTime.formatIsoDateUtc(DateTime.unsafeNow()),
          updated_at: DateTime.formatIsoDateUtc(DateTime.unsafeNow())
        })

        // Process all relationships from all artists
        const allRelationships = yield* relationsFromMBArtist({ ...artist, relations }, kexpPlayId)

        return {
          artistInsert,
          relationships: allRelationships
        } as const
      })

    const fetchUnresolvedMBArtists = (limit: number = 100) =>
      SqlSchema.findAll({
        Request: Schema.Void,
        Result: MBSchemas.UnresolvedMBArtist,
        execute: (_) => sql`SELECT * FROM mb_artist_unresolved LIMIT ${limit}`
      })

    const processUnresolvedMBArtists: (config?: {
      limit?: number
    }) => Stream.Stream<
      MBSchemas.UnresolvedMBArtist,
      | ParseError
      | SqlError
      | MBDataService.MBQueryError
      | RelationshipService.RelationshipQueryError
      | RequestError
      | ResponseError,
      never
    > = (config?: {
      limit?: number
    }) =>
      fetchUnresolvedMBArtists(config?.limit)().pipe(
        Stream.fromIterableEffect,
        Stream.tap((unresolved) =>
          Effect.gen(function*() {
            const { artistInsert, relationships } = yield* fetchArtistWithRelationships(
              unresolved.artist_mb_id,
              unresolved.kexp_play_id,
              "CrateAPI/1.0 "
            )

            const artistEntity = yield* mbData.insertArtistEntity(artistInsert).pipe(
              Effect.tap((a) => mbData.deleteUnresolvedMBArtists(a.artist_mb_id))
            )
            yield* Effect.logInfo(
              `Inserted and deleted unresolved artist entity: ${artistEntity.artist_mb_id} ${artistEntity.artist_name}`
            )

            if (Array.getRights(relationships).length > 0) {
              yield* relationshipService.insertRelationships(Array.getRights(relationships))
              yield* Effect.logInfo(`Inserted ${Array.getRights(relationships).length} relationships`)
            }

            const _invalidRelationships = Array.getLefts(relationships)
            yield* Effect.logInfo(`Skipped ${_invalidRelationships.length} relationships`)
            return artistEntity
          }).pipe(
            sql.withTransaction,
            Effect.catchTag("ResponseError", (error) =>
              Effect.gen(function*() {
                if (error.response.status === 404) {
                  yield* Effect.logError(`Artist ${unresolved.artist_mb_id} not found in MusicBrainz API`)
                  return unresolved
                }
                return yield* Effect.fail(error) // Re-throw other errors
              }))
          )
        ),
        Stream.throttle({
          cost: () => 1,
          duration: "1.8 seconds",
          units: 1
        })
      )

    return {
      processUnresolvedMBArtists
    } as const
  }),
  dependencies: [
    MBDataService.MBDataService.Default,
    RelationshipService.RelationshipService.Default,
    AuditService.AuditService.Default,
    MusicKBSqlLive
  ]
}) {}
