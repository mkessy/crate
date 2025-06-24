import { Model } from "@effect/sql"
import { Schema } from "effect"

// Comment Splitting Strategies
export class CommentSplittingStrategies extends Model.Class<CommentSplittingStrategies>("CommentSplittingStrategies")({
  strategy_id: Schema.NumberFromString,
  strategy_name: Schema.String,
  description: Model.FieldOption(Schema.String),
  split_pattern: Schema.String
}) {}

// Comment Chunks Raw
export class CommentChunksRaw extends Model.Class<CommentChunksRaw>("CommentChunksRaw")({
  chunk_id: Schema.NumberFromString,
  play_id: Schema.NumberFromString,
  strategy_id: Schema.NumberFromString,
  chunk_index: Schema.NumberFromString,
  chunk_text: Schema.String,
  chunk_length: Schema.parseNumber(Schema.String),
  normalized_chunk_text: Model.FieldOption(Schema.String),
  is_url_only: Model.BooleanFromNumber,
  contains_url: Model.BooleanFromNumber,
  alpha_ratio: Model.FieldOption(Schema.NumberFromString),
  alphanum_ratio: Model.FieldOption(Schema.NumberFromString),
  created_at: Model.DateTimeInsert
}) {}

// Chunk Embeddings
export class ChunkEmbeddings extends Model.Class<ChunkEmbeddings>("ChunkEmbeddings")({
  chunk_id: Schema.NumberFromString,
  embedding: Model.JsonFromString(Schema.Array(Schema.Number)),
  created_at: Model.DateTimeInsert
}) {}

// BERTopic Runs
export class BertopicRuns extends Model.Class<BertopicRuns>("BertopicRuns")({
  run_id: Schema.NumberFromString,
  model_run_name: Schema.String,
  ingested_at: Model.DateTimeInsert
}) {}

// BERTopic Topics
export class BertopicTopics extends Model.Class<BertopicTopics>("BertopicTopics")({
  run_id: Schema.NumberFromString,
  topic_id: Schema.NumberFromString,
  count: Model.FieldOption(Schema.NumberFromString),
  representation_main: Model.FieldOption(Schema.String),
  representation_mmr: Model.FieldOption(Schema.String),
  representation_pos: Model.FieldOption(Schema.String),
  representative_docs: Model.FieldOption(Schema.String),
  llm_summary: Model.FieldOption(Schema.String)
}) {}

// BERTopic Hierarchy
export class BertopicHierarchy extends Model.Class<BertopicHierarchy>("BertopicHierarchy")({
  run_id: Schema.NumberFromString,
  parent_id: Model.FieldOption(Schema.NumberFromString),
  parent_name: Model.FieldOption(Schema.String),
  child_left_id: Model.FieldOption(Schema.NumberFromString),
  child_left_name: Model.FieldOption(Schema.String),
  child_right_id: Model.FieldOption(Schema.NumberFromString),
  child_right_name: Model.FieldOption(Schema.String),
  distance: Model.FieldOption(Schema.NumberFromString)
}) {}

// Bridge Chunk Topic
export class BridgeChunkTopic extends Model.Class<BridgeChunkTopic>("BridgeChunkTopic")({
  run_id: Schema.NumberFromString,
  chunk_id: Schema.NumberFromString,
  topic_id: Schema.NumberFromString
}) {}
