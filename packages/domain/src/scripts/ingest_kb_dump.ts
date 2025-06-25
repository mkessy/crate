import { BunFileSystem, BunRuntime } from "@effect/platform-bun"
import { SqlClient } from "@effect/sql"
import { Effect, Schema, Stream } from "effect"
import { parseCsv, parseJsonl } from "../csv/parseLines.js"
import * as KbSchemas from "../data/schemas/index.js"
import { SqlLive } from "../Sql.js"

const kbDumpPath = "/Users/pooks/Dev/kexp_data_scripts/kexp_kb_export"
const bertopic_hierarchy = parseCsv(`${kbDumpPath}/bertopic_hierarchy.csv`, KbSchemas.BertopicHierarchy.insert)
const bertopic_runs = parseCsv(`${kbDumpPath}/bertopic_runs.csv`, KbSchemas.BertopicRuns.insert)
const bertopic_topics = parseCsv(`${kbDumpPath}/bertopic_topics.csv`, KbSchemas.BertopicTopics.insert)
const bridge_artist_id_to_names = parseCsv(
  `${kbDumpPath}/bridge_artist_id_to_names.csv`,
  KbSchemas.BridgeArtistIdToNames.insert
)
const bridge_chunk_topic = parseCsv(`${kbDumpPath}/bridge_chunk_topic.csv`, KbSchemas.BridgeChunkTopic.insert)
const bridge_kb_artist_to_kexp = parseCsv(
  `${kbDumpPath}/bridge_kb_artist_to_kexp.csv`,
  KbSchemas.BridgeKbArtistToKexp.insert
)
const bridge_kb_song_to_kexp = parseCsv(`${kbDumpPath}/bridge_kb_song_to_kexp.csv`, KbSchemas.BridgeKbSongToKexp.insert)
const bridge_label_id_to_names = parseCsv(
  `${kbDumpPath}/bridge_label_id_to_names.csv`,
  KbSchemas.BridgeLabelIdToNames.insert
)
const bridge_play_to_artist = parseCsv(`${kbDumpPath}/bridge_play_to_artist.csv`, KbSchemas.BridgePlayToArtist.insert)
const bridge_play_to_label = parseCsv(`${kbDumpPath}/bridge_play_to_label.csv`, KbSchemas.BridgePlayToLabel.insert)
const bridge_release_id_to_names = parseCsv(
  `${kbDumpPath}/bridge_release_id_to_names.csv`,
  KbSchemas.BridgeReleaseIdToNames.insert
)
const bridge_show_hosts = parseCsv(`${kbDumpPath}/bridge_show_hosts.csv`, KbSchemas.BridgeShowHosts.insert)
const chunk_embeddings = parseCsv(`${kbDumpPath}/chunk_embeddings.csv`, KbSchemas.ChunkEmbeddings.insert)
const comment_chunks_raw = parseCsv(`${kbDumpPath}/comment_chunks_raw.csv`, KbSchemas.CommentChunksRaw.insert)
const comment_splitting_strategies = parseCsv(
  `${kbDumpPath}/comment_splitting_strategies.csv`,
  KbSchemas.CommentSplittingStrategies.insert
)
const dim_artists_master = parseCsv(`${kbDumpPath}/dim_artists_master.csv`, KbSchemas.DimArtistsMaster.insert)
const dim_hosts = parseCsv(`${kbDumpPath}/dim_hosts.csv`, KbSchemas.DimHosts.insert)
const dim_labels = parseCsv(`${kbDumpPath}/dim_labels_master.csv`, KbSchemas.DimLabelsMaster.insert)
const dim_programs = parseCsv(`${kbDumpPath}/dim_programs.csv`, KbSchemas.DimPrograms.insert)
const dim_releases_master = parseCsv(`${kbDumpPath}/dim_releases_master.csv`, KbSchemas.DimReleasesMaster.insert)
const dim_shows = parseCsv(`${kbDumpPath}/dim_shows.csv`, KbSchemas.DimShows.insert)
const dim_timeslots = parseCsv(`${kbDumpPath}/dim_timeslots.csv`, KbSchemas.DimTimeslots.insert)
const dim_tracks = parseCsv(`${kbDumpPath}/dim_tracks.csv`, KbSchemas.DimTracks.insert)
const fact_plays = parseCsv(`${kbDumpPath}/fact_plays.csv`, KbSchemas.FactPlays.insert)
const kb_Album = parseCsv(`${kbDumpPath}/kb_album.csv`, KbSchemas.KbAlbum.insert)
const kb_Artist = parseCsv(`${kbDumpPath}/kb_artist.csv`, KbSchemas.KbArtist.insert)
const kb_Genre = parseCsv(`${kbDumpPath}/kb_genre.csv`, KbSchemas.KbGenre.insert)
const kb_Host = parseCsv(`${kbDumpPath}/kb_host.csv`, KbSchemas.KbHost.insert)
const kb_KexpComment = parseCsv(`${kbDumpPath}/kb_kexpcomment.csv`, KbSchemas.KbKexpComment.insert)
const kb_Location = parseCsv(`${kbDumpPath}/kb_location.csv`, KbSchemas.KbLocation.insert)
const kb_Play = parseCsv(`${kbDumpPath}/kb_play.csv`, KbSchemas.KbPlay.insert)
const kb_Program = parseCsv(`${kbDumpPath}/kb_program.csv`, KbSchemas.KbProgram.insert)
const kb_RecordLabel = parseCsv(`${kbDumpPath}/kb_recordlabel.csv`, KbSchemas.KbRecordLabel.insert)
const kb_Relationship = parseCsv(`${kbDumpPath}/kb_relationship.csv`, KbSchemas.KbRelationship.insert)
const kb_Release = parseCsv(`${kbDumpPath}/kb_release.csv`, KbSchemas.KbRelease.insert)
const kb_Show = parseCsv(`${kbDumpPath}/kb_show.csv`, KbSchemas.KbShow.insert)
const kb_Song = parseCsv(`${kbDumpPath}/kb_song.csv`, KbSchemas.KbSong.insert)
const mb_artists_raw = parseCsv(`${kbDumpPath}/mb_artists_raw.csv`, KbSchemas.MbArtistsRaw.jsonCreate)
const mb_relations_enhanced = parseJsonl(
  `${kbDumpPath}/mb_relations_enhanced.jsonl`,
  KbSchemas.MbRelationsEnhanced.insert
)

const SAFE_LOADING_ORDER = [
  // Tier 0: Independent entities
  // "comment_splitting_strategies",
  // "bertopic_runs",
  // "kb_artist",
  // "kb_album",
  // "kb_song",
  // "kb_genre",
  // "kb_location",
  // "kb_recordlabel",
  // "kb_host",
  // "kb_program",
  // "kb_show",
  // "kb_play",
  // "kb_kexpcomment",
  // "dim_hosts",
  // "dim_programs",
  // "dim_artists_master",
  // "dim_labels_master",
  // "dim_releases_master",
  // "dim_shows",
  // "dim_timeslots",
  // "dim_tracks",
  "mb_artists_raw",
  "mb_relations_enhanced"
  // Tier 1: Single dependencies
  // "kb_release", // depends on kb_Album
  // "bertopic_topics", // depends on bertopic_runs
  // "bertopic_hierarchy", // depends on bertopic_runs
  // "fact_plays", // depends on dimensions

  // Tier 2: Bridge tables
  // "bridge_kb_artist_to_kexp",
  // "bridge_kb_song_to_kexp",
  // "bridge_artist_id_to_names",
  // "bridge_label_id_to_names",
  // "bridge_release_id_to_names",
  // "bridge_play_to_artist",
  // "bridge_play_to_label",
  // "bridge_show_hosts",
  // "bridge_timeslot_hosts",
  // "comment_chunks_raw",
  // "bridge_chunk_topic",

  // Tier 3: Complex dependencies
  // "kb_relationship", // depends on multiple kb_* tables
  // "chunk_embeddings" // depends on comment_chunks_raw
]

const ingest_comment_splitting_strategies = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.CommentSplittingStrategies.insert)
  const stream = comment_splitting_strategies.pipe(
    Stream.mapEffect((row) => sql`insert into comment_splitting_strategies ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into comment_splitting_strategies`))
  )
})

const ingest_bertopic_runs = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BertopicRuns.insert)
  const stream = bertopic_runs.pipe(
    Stream.mapEffect((row) => sql`insert into bertopic_runs ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bertopic_runs`))
  )
})

const ingest_kb_artist = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbArtist.insert)
  const stream = kb_Artist.pipe(
    Stream.mapEffect((row) => sql`insert into kb_artist ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_artist`))
  )
})

const ingest_kb_album = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbAlbum.insert)
  const stream = kb_Album.pipe(
    Stream.mapEffect((row) => sql`insert into kb_album ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_album`))
  )
})

const ingest_kb_song = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbSong.insert)
  const stream = kb_Song.pipe(
    Stream.mapEffect((row) => sql`insert into kb_song ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_song`))
  )
})

const ingest_kb_genre = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbGenre.insert)
  const stream = kb_Genre.pipe(
    Stream.mapEffect((row) => sql`insert into kb_genre ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_genre`))
  )
})

const ingest_kb_location = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbLocation.insert)
  const stream = kb_Location.pipe(
    Stream.mapEffect((row) => sql`insert into kb_location ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_location`))
  )
})

const ingest_kb_recordlabel = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbRecordLabel.insert)
  const stream = kb_RecordLabel.pipe(
    Stream.mapEffect((row) => sql`insert into kb_recordlabel ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_recordlabel`))
  )
})

const ingest_kb_host = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbHost.insert)
  const stream = kb_Host.pipe(
    Stream.mapEffect((row) => sql`insert into kb_host ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_host`))
  )
})

const ingest_kb_program = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbProgram.insert)
  const stream = kb_Program.pipe(
    Stream.mapEffect((row) => sql`insert into kb_program ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_program`))
  )
})

const ingest_kb_show = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbShow.insert)
  const stream = kb_Show.pipe(
    Stream.mapEffect((row) => sql`insert into kb_show ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_show`))
  )
})

const ingest_kb_play = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbPlay.insert)
  const stream = kb_Play.pipe(
    Stream.mapEffect((row) => sql`insert into kb_play ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_play`))
  )
})

const ingest_kb_kexpcomment = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbKexpComment.insert)
  const stream = kb_KexpComment.pipe(
    Stream.mapEffect((row) => sql`insert into kb_kexpcomment ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_kexpcomment`))
  )
})

const ingest_dim_hosts = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimHosts.insert)
  const stream = dim_hosts.pipe(
    Stream.mapEffect((row) => sql`insert into dim_hosts ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_hosts`))
  )
})

const ingest_dim_programs = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimPrograms.insert)
  const stream = dim_programs.pipe(
    Stream.mapEffect((row) => sql`insert into dim_programs ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_programs`))
  )
})

const ingest_dim_artists_master = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimArtistsMaster.insert)
  const stream = dim_artists_master.pipe(
    Stream.mapEffect((row) => sql`insert into dim_artists_master ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_artists_master`))
  )
})

const ingest_dim_labels_master = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimLabelsMaster.insert)
  const stream = dim_labels_master.pipe(
    Stream.mapEffect((row) => sql`insert into dim_labels_master ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_labels_master`))
  )
})

const ingest_dim_releases_master = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimReleasesMaster.insert)
  const stream = dim_releases_master.pipe(
    Stream.mapEffect((row) => sql`insert into dim_releases_master ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_releases_master`))
  )
})

const ingest_dim_shows = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimShows.insert)
  const stream = dim_shows.pipe(
    Stream.mapEffect((row) => sql`insert into dim_shows ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_shows`))
  )
})

const ingest_dim_timeslots = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimTimeslots.insert)
  const stream = dim_timeslots.pipe(
    Stream.mapEffect((row) => sql`insert into dim_timeslots ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_timeslots`))
  )
})

const ingest_dim_tracks = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.DimTracks.insert)
  const stream = dim_tracks.pipe(
    Stream.mapEffect((row) => sql`insert into dim_tracks ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into dim_tracks`))
  )
})

const ingest_mb_artists_raw = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.MbArtistsRaw.jsonCreate)
  const stream = mb_artists_raw.pipe(
    Stream.mapEffect((row) => sql`insert into mb_artists_raw ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into mb_artists_raw`))
  )
})

const ingest_mb_relations_enhanced = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.MbRelationsEnhanced.insert)
  const stream = yield* mb_relations_enhanced
  return yield* stream.pipe(
    Stream.mapEffect((row) => sql`insert into mb_relations_enhanced ${sql.insert(encode(row))}`),
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into mb_relations_enhanced`))
  )
}).pipe(Effect.provide(BunFileSystem.layer))

const ingest_kb_release = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbRelease.insert)
  const stream = kb_Release.pipe(
    Stream.mapEffect((row) => sql`insert into kb_release ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_release`))
  )
})

const ingest_bertopic_topics = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BertopicTopics.insert)
  const stream = bertopic_topics.pipe(
    Stream.mapEffect((row) => sql`insert into bertopic_topics ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bertopic_topics`))
  )
})

const ingest_bertopic_hierarchy = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BertopicHierarchy.insert)
  const stream = bertopic_hierarchy.pipe(
    Stream.mapEffect((row) => sql`insert into bertopic_hierarchy ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bertopic_hierarchy`))
  )
})

const ingest_fact_plays = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.FactPlays.insert)
  const stream = fact_plays.pipe(
    Stream.mapEffect((row) => sql`insert into fact_plays ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into fact_plays`))
  )
})

const ingest_bridge_kb_artist_to_kexp = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeKbArtistToKexp.insert)
  const stream = bridge_kb_artist_to_kexp.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_kb_artist_to_kexp ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_kb_artist_to_kexp`))
  )
})

const ingest_bridge_kb_song_to_kexp = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeKbSongToKexp.insert)
  const stream = bridge_kb_song_to_kexp.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_kb_song_to_kexp ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_kb_artist_to_kexp`))
  )
})

const ingest_bridge_artist_id_to_names = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeArtistIdToNames.insert)
  const stream = bridge_artist_id_to_names.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_artist_id_to_names ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_artist_id_to_names`))
  )
})

const ingest_bridge_label_id_to_names = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeLabelIdToNames.insert)
  const stream = bridge_label_id_to_names.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_label_id_to_names ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_label_id_to_names`))
  )
})

const ingest_bridge_release_id_to_names = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeReleaseIdToNames.insert)
  const stream = bridge_release_id_to_names.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_release_id_to_names ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_release_id_to_names`))
  )
})

const ingest_bridge_play_to_artist = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgePlayToArtist.insert)
  const stream = bridge_play_to_artist.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_play_to_artist ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_play_to_artist`))
  )
})

const ingest_bridge_play_to_label = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgePlayToLabel.insert)
  const stream = bridge_play_to_label.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_play_to_label ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_play_to_label`))
  )
})

const ingest_bridge_show_hosts = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeShowHosts.insert)
  const stream = bridge_show_hosts.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_show_hosts ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_show_hosts`))
  )
})

const ingest_bridge_timeslot_hosts = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeTimeslotHosts.insert)
  const stream = bridge_timeslot_hosts.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_timeslot_hosts ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_timeslot_hosts`))
  )
})

const ingest_comment_chunks_raw = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.CommentChunksRaw.insert)
  const stream = comment_chunks_raw.pipe(
    Stream.mapEffect((row) => sql`insert into comment_chunks_raw ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into comment_chunks_raw`))
  )
})

const ingest_bridge_chunk_topic = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.BridgeChunkTopic.insert)
  const stream = bridge_chunk_topic.pipe(
    Stream.mapEffect((row) => sql`insert into bridge_chunk_topic ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into bridge_chunk_topic`))
  )
})

const ingest_kb_relationship = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.KbRelationship.insert)
  const stream = kb_Relationship.pipe(
    Stream.mapEffect((row) => sql`insert into kb_relationship ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into kb_relationship`))
  )
})

const ingest_chunk_embeddings = Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  const encode = Schema.encodeSync(KbSchemas.ChunkEmbeddings.insert)
  const stream = chunk_embeddings.pipe(
    Stream.mapEffect((row) => sql`insert into chunk_embeddings ${sql.insert(encode(row))}`)
  )
  return yield* stream.pipe(
    Stream.runCount,
    Effect.tap((count) => Effect.log(`Ingested ${count} rows into chunk_embeddings`))
  )
})

const all_ingest_effects: Record<string, Effect.Effect<void, any, SqlClient.SqlClient>> = {
  comment_splitting_strategies: ingest_comment_splitting_strategies,
  bertopic_runs: ingest_bertopic_runs,
  kb_artist: ingest_kb_artist,
  kb_album: ingest_kb_album,
  kb_song: ingest_kb_song,
  kb_genre: ingest_kb_genre,
  kb_location: ingest_kb_location,
  kb_recordlabel: ingest_kb_recordlabel,
  kb_host: ingest_kb_host,
  kb_program: ingest_kb_program,
  kb_show: ingest_kb_show,
  kb_play: ingest_kb_play,
  kb_kexpcomment: ingest_kb_kexpcomment,
  dim_hosts: ingest_dim_hosts,
  dim_programs: ingest_dim_programs,
  dim_artists_master: ingest_dim_artists_master,
  dim_labels_master: ingest_dim_labels_master,
  dim_releases_master: ingest_dim_releases_master,
  dim_shows: ingest_dim_shows,
  dim_timeslots: ingest_dim_timeslots,
  dim_tracks: ingest_dim_tracks,
  mb_artists_raw: ingest_mb_artists_raw,
  mb_relations_enhanced: ingest_mb_relations_enhanced,
  kb_release: ingest_kb_release,
  bertopic_topics: ingest_bertopic_topics,
  bertopic_hierarchy: ingest_bertopic_hierarchy,
  fact_plays: ingest_fact_plays,
  bridge_kb_artist_to_kexp: ingest_bridge_kb_artist_to_kexp,
  bridge_kb_song_to_kexp: ingest_bridge_kb_song_to_kexp,
  bridge_artist_id_to_names: ingest_bridge_artist_id_to_names,
  bridge_label_id_to_names: ingest_bridge_label_id_to_names,
  bridge_release_id_to_names: ingest_bridge_release_id_to_names,
  bridge_play_to_artist: ingest_bridge_play_to_artist,
  bridge_play_to_label: ingest_bridge_play_to_label,
  bridge_show_hosts: ingest_bridge_show_hosts,
  bridge_timeslot_hosts: ingest_bridge_timeslot_hosts,
  comment_chunks_raw: ingest_comment_chunks_raw,
  bridge_chunk_topic: ingest_bridge_chunk_topic,
  kb_relationship: ingest_kb_relationship,
  chunk_embeddings: ingest_chunk_embeddings
}

const program = Effect.forEach(SAFE_LOADING_ORDER, (table_name) =>
  Effect.log(`Ingesting ${table_name}...`).pipe(
    Effect.flatMap(() => all_ingest_effects[table_name]!)
  ), { concurrency: 1 })

program.pipe(Effect.provide(SqlLive), BunRuntime.runMain)
