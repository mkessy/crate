import { Model } from "@effect/sql"
import { Schema } from "effect"

// Comment Splitting Strategies
export class CommentSplittingStrategies extends Model.Class<CommentSplittingStrategies>("CommentSplittingStrategies")({
  strategy_id: Schema.Number,
  strategy_name: Schema.String,
  description: Model.FieldOption(Schema.String),
  split_pattern: Schema.String
}) {}

// Comment Chunks Raw
export class CommentChunksRaw extends Model.Class<CommentChunksRaw>("CommentChunksRaw")({
  chunk_id: Schema.Number,
  play_id: Schema.Number,
  strategy_id: Schema.Number,
  chunk_index: Schema.Number,
  chunk_text: Schema.String,
  chunk_length: Schema.Number,
  normalized_chunk_text: Schema.String,
  is_url_only: Model.BooleanFromNumber,
  contains_url: Model.BooleanFromNumber,
  alpha_ratio: Model.FieldOption(Schema.Number),
  alphanum_ratio: Model.FieldOption(Schema.Number),
  created_at: Model.DateTimeInsert
}) {}

// Chunk Embeddings
export class ChunkEmbeddings extends Model.Class<ChunkEmbeddings>("ChunkEmbeddings")({
  chunk_id: Schema.Number,
  embedding: Schema.Unknown,
  created_at: Model.DateTimeInsert
}) {}

// BERTopic Runs
export class BertopicRuns extends Model.Class<BertopicRuns>("BertopicRuns")({
  run_id: Schema.Number,
  model_run_name: Schema.String,
  ingested_at: Model.DateTimeInsert
}) {}

// BERTopic Topics
export class BertopicTopics extends Model.Class<BertopicTopics>("BertopicTopics")({
  run_id: Schema.Number,
  topic_id: Schema.Number,
  name: Model.FieldOption(Schema.String),
  count: Model.FieldOption(Schema.Number),
  representation_main: Schema.Unknown,
  representation_mmr: Schema.Unknown,
  representation_pos: Schema.Unknown,
  representative_docs: Schema.Unknown,
  llm_summary: Model.FieldOption(Schema.String)
}) {}

// BERTopic Hierarchy
export class BertopicHierarchy extends Model.Class<BertopicHierarchy>("BertopicHierarchy")({
  run_id: Schema.Number,
  parent_id: Model.FieldOption(Schema.Number),
  parent_name: Model.FieldOption(Schema.String),
  child_left_id: Model.FieldOption(Schema.Number),
  child_left_name: Model.FieldOption(Schema.String),
  child_right_id: Model.FieldOption(Schema.Number),
  child_right_name: Model.FieldOption(Schema.String),
  distance: Model.FieldOption(Schema.Number)
}) {}

// Bridge Chunk Topic
export class BridgeChunkTopic extends Model.Class<BridgeChunkTopic>("BridgeChunkTopic")({
  run_id: Schema.Number,
  chunk_id: Schema.Number,
  topic_id: Schema.Number
}) {}
