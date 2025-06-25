import { BunFileSystem, BunRuntime } from "@effect/platform-bun"
import { Effect, Stream } from "effect"
import { parseJsonl } from "../csv/parseLines.js"
import * as KEXP from "../kexp/schemas.js"
import { FactPlaysRepo } from "../repos/fact_plays.js"

const ingestKexpJson = Effect.gen(function*() {
  const path = "/Users/pooks/Dev/kexp_data_scripts/data/kexp_plays.jsonl"
  const repo = yield* FactPlaysRepo

  const plays = (yield* parseJsonl(path, KEXP.KexpPlay)).pipe(
    Stream.filter(KEXP.isTrackPlay),
    Stream.mapEffect((play) =>
      repo.upsert(
        {
          id: play.id,
          play_type: play.play_type,
          is_local: play.is_local,
          is_request: play.is_request,
          is_live: play.is_live,
          rotation_status: play.rotation_status,
          album: play.album,
          song: play.song,
          airdate: play.airdate,
          show: play.show,
          track_id: play.id.toString(),
          comment: play.comment,
          artist: play.artist,
          artist_ids: JSON.stringify(play.artist_ids),
          release_id: play.release_id,
          release_group_id: play.release_group_id,
          labels: JSON.stringify(play.labels),
          label_ids: JSON.stringify(play.label_ids),
          release_date: play.release_date,
          show_uri: play.show_uri,
          image_uri: play.image_uri,
          thumbnail_uri: play.thumbnail_uri,
          recording_id: play.recording_id,
          created_at: undefined,
          updated_at: undefined
        }
      )
    ),
    Stream.runCount
  )
  yield* Effect.log(`Ingested ${plays} plays`)

  return yield* plays
})

ingestKexpJson.pipe(Effect.provide(FactPlaysRepo.Default), Effect.provide(BunFileSystem.layer), BunRuntime.runMain)
