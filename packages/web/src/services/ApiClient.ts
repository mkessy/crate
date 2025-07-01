// packages/web/src/services/ApiClient.ts
import { FactPlays } from "@crate/domain/src/index.js"
import type { HttpClientError } from "@effect/platform"
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { Context, Effect, Layer, Schema } from "effect"
import type { ParseError } from "effect/ParseResult"

// API response schemas
const PlaysResponse = Schema.Array(FactPlays.FactPlay)

// Service interface
export interface ApiClient {
  readonly getRecentPlays: (params?: {
    limit?: number
    offset?: number
  }) => Effect.Effect<ReadonlyArray<FactPlays.FactPlay>, ParseError | HttpClientError.HttpClientError>
}

// Service tag
export const ApiClient = Context.GenericTag<ApiClient>("@crate/web/ApiClient")

// Service implementation
export const ApiClientLive = Layer.effect(
  ApiClient,
  Effect.gen(function*() {
    const baseUrl = window.location.origin // Use current origin in dev, proxy handles routing
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl))
    )

    return ApiClient.of({
      getRecentPlays: (params) =>
        client.get("/api/plays", {
          urlParams: new URLSearchParams({
            limit: String(params?.limit),
            offset: String(params?.offset)
          })
        }).pipe(
          Effect.flatMap(HttpClientResponse.schemaBodyJson(PlaysResponse))
        )
    })
  })
)
/* HttpClientRequest.get("/api/plays", {
            urlParams: params
          })) */

// Default layer composition
export const ApiClientDefault = ApiClientLive.pipe(
  Layer.provide(FetchHttpClient.layer)
)
