import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import type { Schema } from "effect"
import { Effect, Schedule } from "effect"
import { AuditLog, KEXPFetchMetaData } from "../knowledge_base/audit/schemas.js"
import * as AuditService from "../knowledge_base/audit/service.js"
import { MusicKBSqlLive } from "../Sql.js"
import * as KEXP from "./schemas.js"

const KEXP_API_URL = "https://api.kexp.org/v2"

interface PaginationOptions {
  limit: number
  offset: number
}

const defaultPaginationOptions: PaginationOptions = {
  limit: 100,
  offset: 0
}

export class KEXPApi extends Effect.Service<KEXPApi>()("KEXPAPI", {
  effect: Effect.gen(function*() {
    const audit = yield* AuditService.AuditService

    const withAudit = <I, R>(
      response: Effect.Effect<HttpClientResponse.HttpClientResponse, I, R>
    ) =>
      response.pipe(
        Effect.tap((response) =>
          audit.insertAuditLog(
            AuditLog.insert.make({
              type: "http_fetch",
              metadata: KEXPFetchMetaData.make({
                type: "kexp_fetch",
                kexp_url: response.request.url,
                status: response.status
              })
            })
          ).pipe(Effect.catchTags({
            SqlError: Effect.logError
          }))
        )
      )

    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(KEXP_API_URL)),
      HttpClient.mapRequest(HttpClientRequest.setHeaders({ "content-type": "application/json" })),
      HttpClient.retryTransient(
        {
          schedule: Schedule.spaced(500),
          times: 3
        }
      )
    )

    const fetchPrograms = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/programs", {
        urlParams: {
          ...options
        }
      }).pipe(
        withAudit,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpProgramsResponse))
      )

    const fetchShows = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/shows", {
        urlParams: {
          ...options
        }
      }).pipe(
        withAudit,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpShowsResponse))
      )

    const fetchTimeslots = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/timeslots", {
        urlParams: {
          ...options
        }
      }).pipe(
        withAudit,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpTimeslotsResponse))
      )

    const fetchPlays = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/plays", {
        urlParams: {
          ...options
        }
      }).pipe(
        withAudit,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpPlaysResponse))
      )

    const fetchHosts = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/hosts", {
        urlParams: {
          ...options
        }
      }).pipe(
        withAudit,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpHostsResponse))
      )

    const fetchPaginated = <A, I, R>(
      path: string,
      options: PaginationOptions = defaultPaginationOptions,
      schema: Schema.Schema<A, I, R>
    ) =>
      client.get(path, {
        urlParams: {
          ...options
        }
      }).pipe(
        withAudit,
        Effect.flatMap(HttpClientResponse.schemaBodyJson(schema))
      )

    return {
      fetchPrograms,
      fetchShows,
      fetchTimeslots,
      fetchPlays,
      fetchHosts,
      fetchPaginated
    }
  }),
  dependencies: [FetchHttpClient.layer, AuditService.AuditService.Default, MusicKBSqlLive]
}) {}
