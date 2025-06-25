import { SqlClient, SqlSchema } from "@effect/sql"
import { Effect, Schema } from "effect"
import { MusicKBSqlLive } from "../../Sql.js"
import { ArtistEntity, EntityType, MbArtistId, RelationType } from "./schemas.js"

// =============================================================================
// TEMPLATE LITERAL QUERY SCHEMAS
// =============================================================================

// B1.2: "artist:{artistId} entity:{entityType}"
export const ArtistEntityQuerySchema = Schema.TemplateLiteralParser(
  "artist:",
  MbArtistId,
  " entity:",
  EntityType
)
export type ArtistEntityQuery = Schema.Schema.Encoded<typeof ArtistEntityQuerySchema>

// B1.3: "artist:{artistId} relation:{relationType}"
export const ArtistRelationQuerySchema = Schema.TemplateLiteralParser(
  "artist:",
  MbArtistId,
  " relation:",
  RelationType
)
export type ArtistRelationQuery = Schema.Schema.Encoded<typeof ArtistRelationQuerySchema>

// B1.4: "artist:{artistId} entity:{entityType} relation:{relationType}"
export const ArtistEntityRelationQuerySchema = Schema.TemplateLiteralParser(
  "artist:",
  MbArtistId,
  " entity:",
  EntityType,
  " relation:",
  RelationType
)
export type ArtistEntityRelationQuery = Schema.Schema.Encoded<typeof ArtistEntityRelationQuerySchema>

// B2.1: "entity:{entityId} type:{entityType}"
export const EntityDiscoveryQuerySchema = Schema.TemplateLiteralParser(
  "entity:",
  Schema.String,
  " type:",
  EntityType
)
export type EntityDiscoveryQuery = Schema.Schema.Encoded<typeof EntityDiscoveryQuerySchema>

// =============================================================================
// CORE MUSICBRAINZ SERVICE WITH DSL
// =============================================================================

export class MusicBrainzService extends Effect.Service<MusicBrainzService>()("MusicBrainzService", {
  accessors: true,
  effect: Effect.gen(function*() {
    const sql = yield* SqlClient.SqlClient

    // Template literal DSL methods that parse and execute queries
    const artistEntity = (queryString: ArtistEntityQuery) =>
      Effect.gen(function*() {
        // Parse the template literal into structured data
        const [, artistId, , entityType] = yield* Schema.decodeUnknown(ArtistEntityQuerySchema)(queryString)

        // Execute the SQL query
        const query = SqlSchema.findAll({
          Request: Schema.Struct({ artist_mb_id: MbArtistId, entity_type: EntityType }),
          Result: ArtistEntity,
          execute: (request) =>
            sql`
          SELECT 
            artist_mb_id, artist_name, artist_disambiguation,
            entity_type, entity_mb_id, entity_name,
            relation_type, direction, attribute_type, entity_metadata
          FROM mb_master_lookup 
          WHERE ${
              sql.and([
                sql`artist_mb_id = ${request.artist_mb_id}`,
                sql`entity_type = ${sql(request.entity_type)}`
              ])
            }
          ORDER BY entity_name
        `
        })

        return yield* query({ artist_mb_id: artistId, entity_type: entityType })
      })

    const artistRelation = (queryString: ArtistRelationQuery) =>
      Effect.gen(function*() {
        const [, artistId, , relationType] = yield* Schema.decodeUnknown(ArtistRelationQuerySchema)(queryString)

        const query = SqlSchema.findAll({
          Request: Schema.Struct({ artist_mb_id: MbArtistId, relation_type: RelationType }),
          Result: ArtistEntity,
          execute: (request) =>
            sql`
          SELECT 
            artist_mb_id, artist_name, artist_disambiguation,
            entity_type, entity_mb_id, entity_name,
            relation_type, direction, attribute_type, entity_metadata
          FROM mb_master_lookup 
          WHERE ${
              sql.and([
                sql`artist_mb_id = ${request.artist_mb_id}`,
                sql`relation_type = ${sql(request.relation_type)}`
              ])
            }
          ORDER BY entity_name
        `
        })

        return yield* query({ artist_mb_id: artistId, relation_type: relationType })
      })

    const artistEntityRelation = (queryString: ArtistEntityRelationQuery) =>
      Effect.gen(function*() {
        const [, artistId, , entityType, , relationType] = yield* Schema.decodeUnknown(
          ArtistEntityRelationQuerySchema
        )(queryString)

        const query = SqlSchema.findAll({
          Request: Schema.Struct({
            artist_mb_id: MbArtistId,
            entity_type: EntityType,
            relation_type: RelationType
          }),
          Result: ArtistEntity,
          execute: (request) =>
            sql`
          SELECT 
            artist_mb_id, artist_name, artist_disambiguation,
            entity_type, entity_mb_id, entity_name,
            relation_type, direction, attribute_type, entity_metadata
          FROM mb_master_lookup 
          WHERE ${
              sql.and([
                sql`artist_mb_id = ${request.artist_mb_id}`,
                sql`entity_type = ${sql(request.entity_type)}`
              ])
            }
          AND relation_type = ${sql(request.relation_type)}
          ORDER BY entity_name
        `
        })

        return yield* query({ artist_mb_id: artistId, entity_type: entityType, relation_type: relationType })
      })

    const entityDiscovery = (queryString: EntityDiscoveryQuery) =>
      Effect.gen(function*() {
        const [, entityId, , entityType] = yield* Schema.decodeUnknown(EntityDiscoveryQuerySchema)(queryString)

        const query = SqlSchema.findAll({
          Request: Schema.Struct({ entity_mb_id: Schema.String, entity_type: EntityType }),
          Result: ArtistEntity,
          execute: (request) =>
            sql`
          SELECT 
            artist_mb_id, artist_name, artist_disambiguation,
            entity_type, entity_mb_id, entity_name,
            relation_type, direction, attribute_type, entity_metadata
          FROM mb_master_lookup 
          WHERE ${
              sql.and([
                sql`entity_mb_id = ${sql(request.entity_mb_id)}`,
                sql`entity_type = ${sql(request.entity_type)}`
              ])
            }
          ORDER BY relation_type, artist_name
        `
        })

        return yield* query({ entity_mb_id: entityId, entity_type: entityType })
      })

    return {
      // DSL query methods
      artistEntity,
      artistRelation,
      artistEntityRelation,
      entityDiscovery
    }
  }),
  dependencies: [MusicKBSqlLive] // SqlClient provided externally
}) {}
