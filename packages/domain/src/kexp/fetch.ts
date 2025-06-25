import { FetchHttpClient, HttpClient, HttpClientRequest, HttpClientResponse } from "@effect/platform"

import { BunRuntime } from "@effect/platform-bun"
import { Effect, Schedule } from "effect"
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
      }).pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpProgramsResponse)))

    const fetchShows = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/shows", {
        urlParams: {
          ...options
        }
      }).pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpShowsResponse)))

    const fetchTimeslots = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/timeslots", {
        urlParams: {
          ...options
        }
      }).pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpTimeslotsResponse)))

    const fetchPlays = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/plays", {
        urlParams: {
          ...options
        }
      }).pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpPlaysResponse)))

    const fetchHosts = (options: PaginationOptions = defaultPaginationOptions) =>
      client.get("/hosts", {
        urlParams: {
          ...options
        }
      }).pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(KEXP.KexpHostsResponse)))

    return {
      fetchPrograms,
      fetchShows,
      fetchTimeslots,
      fetchPlays,
      fetchHosts
    }
  }),
  dependencies: [FetchHttpClient.layer]
}) {}

const test = Effect.gen(function*() {
  const api = yield* KEXPApi
  const programs = yield* api.fetchPrograms()
  const shows = yield* api.fetchShows()
  const timeslots = yield* api.fetchTimeslots()
  const plays = yield* api.fetchPlays()
  const hosts = yield* api.fetchHosts()

  console.log(programs)
  console.log(shows)
  console.log(timeslots)
  console.log(plays)
  console.log(hosts)
})

test.pipe(Effect.provide(KEXPApi.Default), BunRuntime.runMain)
