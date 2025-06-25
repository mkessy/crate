import { SqlClient, SqlSchema } from "@effect/sql"
import { Data, Effect, Request, RequestResolver, Schema } from "effect"
import { MusicKBSqlLive } from "../../Sql.js"
import { ArtistEntity, EntityType, MbArtistId, RelationType } from "./schemas.js"

// =============================================================================
// TEMPLATE LITERAL QUERY SCHEMAS (unchanged)
// =============================================================================

export const ArtistEntityQuerySchema = Schema.TemplateLiteralParser(
  "artist:",
  MbArtistId,
  " entity:",
  EntityType
)
export type ArtistEntityQuery = Schema.Schema.Encoded<typeof ArtistEntityQuerySchema>

export const ArtistRelationQuerySchema = Schema.TemplateLiteralParser(
  "artist:",
  MbArtistId,
  " relation:",
  RelationType
)
export type ArtistRelationQuery = Schema.Schema.Encoded<typeof ArtistRelationQuerySchema>

export const ArtistEntityRelationQuerySchema = Schema.TemplateLiteralParser(
  "artist:",
  MbArtistId,
  " entity:",
  EntityType,
  " relation:",
  RelationType
)
export type ArtistEntityRelationQuery = Schema.Schema.Encoded<typeof ArtistEntityRelationQuerySchema>

export const EntityDiscoveryQuerySchema = Schema.TemplateLiteralParser(
  "entity:",
  Schema.String,
  " type:",
  EntityType
)
export type EntityDiscoveryQuery = Schema.Schema.Encoded<typeof EntityDiscoveryQuerySchema>

// =============================================================================
// ERROR TYPES
// =============================================================================

class MBQueryError extends Data.TaggedError("MBQueryError")<{
  readonly message: string
  readonly queryType: string
}> {}

// =============================================================================
// REQUEST INTERFACES - Following Effect Pattern
// =============================================================================

// Request for artist-entity queries
interface ArtistEntityRequest extends Request.Request<ReadonlyArray<ArtistEntity>, MBQueryError> {
  readonly _tag: "ArtistEntityRequest"
  readonly queryString: ArtistEntityQuery
}

// Create tagged constructor for ArtistEntityRequest
const ArtistEntityRequest = Request.tagged<ArtistEntityRequest>("ArtistEntityRequest")

// Request for artist-relation queries
interface ArtistRelationRequest extends Request.Request<ReadonlyArray<ArtistEntity>, MBQueryError> {
  readonly _tag: "ArtistRelationRequest"
  readonly queryString: ArtistRelationQuery
}

// Create tagged constructor for ArtistRelationRequest
const ArtistRelationRequest = Request.tagged<ArtistRelationRequest>("ArtistRelationRequest")

// Request for artist-entity-relation queries
interface ArtistEntityRelationRequest extends Request.Request<ReadonlyArray<ArtistEntity>, MBQueryError> {
  readonly _tag: "ArtistEntityRelationRequest"
  readonly queryString: ArtistEntityRelationQuery
}

// Create tagged constructor for ArtistEntityRelationRequest
const ArtistEntityRelationRequest = Request.tagged<ArtistEntityRelationRequest>("ArtistEntityRelationRequest")

// Request for entity discovery queries
interface EntityDiscoveryRequest extends Request.Request<ReadonlyArray<ArtistEntity>, MBQueryError> {
  readonly _tag: "EntityDiscoveryRequest"
  readonly queryString: EntityDiscoveryQuery
}

// Create tagged constructor for EntityDiscoveryRequest
const EntityDiscoveryRequest = Request.tagged<EntityDiscoveryRequest>("EntityDiscoveryRequest")

// Union type for all possible requests
export type MBRequest =
  | ArtistEntityRequest
  | ArtistRelationRequest
  | ArtistEntityRelationRequest
  | EntityDiscoveryRequest

// =============================================================================
// REQUEST RESOLVERS - Handle actual SQL execution
// =============================================================================

// Resolver for ArtistEntityRequest
const ArtistEntityResolver = RequestResolver.fromEffect(
  (request: ArtistEntityRequest): Effect.Effect<ReadonlyArray<ArtistEntity>, MBQueryError, SqlClient.SqlClient> =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const [, artistId, , entityType] = yield* Schema.decodeUnknown(ArtistEntityQuerySchema)(request.queryString)

      const query = SqlSchema.findAll({
        Request: Schema.Struct({ artist_mb_id: MbArtistId, entity_type: EntityType }),
        Result: ArtistEntity,
        execute: (params) =>
          sql`
            SELECT 
              artist_mb_id, artist_name, artist_disambiguation,
              entity_type, entity_mb_id, entity_name,
              relation_type, direction, attribute_type, entity_metadata
            FROM mb_master_lookup 
            WHERE ${
            sql.and([
              sql`artist_mb_id = ${params.artist_mb_id}`,
              sql`entity_type = ${sql(params.entity_type)}`
            ])
          }
            ORDER BY entity_name
          `
      })

      return yield* query({ artist_mb_id: artistId, entity_type: entityType })
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new MBQueryError({
            message: `Failed to fetch artist entity: ${error}`,
            queryType: "ArtistEntity"
          })
        )
      )
    )
).pipe(
  RequestResolver.contextFromServices(SqlClient.SqlClient)
)

// Resolver for ArtistRelationRequest
const ArtistRelationResolver = RequestResolver.fromEffect(
  (request: ArtistRelationRequest): Effect.Effect<ReadonlyArray<ArtistEntity>, MBQueryError, SqlClient.SqlClient> =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const [, artistId, , relationType] = yield* Schema.decodeUnknown(ArtistRelationQuerySchema)(request.queryString)

      const query = SqlSchema.findAll({
        Request: Schema.Struct({ artist_mb_id: MbArtistId, relation_type: RelationType }),
        Result: ArtistEntity,
        execute: (params) =>
          sql`
            SELECT 
              artist_mb_id, artist_name, artist_disambiguation,
              entity_type, entity_mb_id, entity_name,
              relation_type, direction, attribute_type, entity_metadata
            FROM mb_master_lookup 
            WHERE ${
            sql.and([
              sql`artist_mb_id = ${params.artist_mb_id}`,
              sql`relation_type = ${sql(params.relation_type)}`
            ])
          }
            ORDER BY entity_name
          `
      })

      return yield* query({ artist_mb_id: artistId, relation_type: relationType })
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new MBQueryError({
            message: `Failed to fetch artist relation: ${error}`,
            queryType: "ArtistRelation"
          })
        )
      )
    )
).pipe(
  RequestResolver.contextFromServices(SqlClient.SqlClient)
)

// Resolver for ArtistEntityRelationRequest
const ArtistEntityRelationResolver = RequestResolver.fromEffect(
  (
    request: ArtistEntityRelationRequest
  ): Effect.Effect<ReadonlyArray<ArtistEntity>, MBQueryError, SqlClient.SqlClient> =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const [, artistId, , entityType, , relationType] = yield* Schema.decodeUnknown(
        ArtistEntityRelationQuerySchema
      )(request.queryString)

      const query = SqlSchema.findAll({
        Request: Schema.Struct({ artist_mb_id: MbArtistId, entity_type: EntityType, relation_type: RelationType }),
        Result: ArtistEntity,
        execute: (params) =>
          sql`
            SELECT 
              artist_mb_id, artist_name, artist_disambiguation,
              entity_type, entity_mb_id, entity_name,
              relation_type, direction, attribute_type, entity_metadata
            FROM mb_master_lookup 
            WHERE ${
            sql.and([
              sql`artist_mb_id = ${params.artist_mb_id}`,
              sql`entity_type = ${sql(params.entity_type)}`
            ])
          }
            AND relation_type = ${sql(params.relation_type)}
            ORDER BY entity_name
          `
      })

      return yield* query({ artist_mb_id: artistId, entity_type: entityType, relation_type: relationType })
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new MBQueryError({
            message: `Failed to fetch artist entity relation: ${error}`,
            queryType: "ArtistEntityRelation"
          })
        )
      )
    )
).pipe(
  RequestResolver.contextFromServices(SqlClient.SqlClient)
)

// Resolver for EntityDiscoveryRequest
const EntityDiscoveryResolver = RequestResolver.fromEffect(
  (
    request: EntityDiscoveryRequest
  ): Effect.Effect<ReadonlyArray<ArtistEntity>, MBQueryError, SqlClient.SqlClient> =>
    Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient

      const [, entityId, , entityType] = yield* Schema.decodeUnknown(EntityDiscoveryQuerySchema)(request.queryString)

      const query = SqlSchema.findAll({
        Request: Schema.Struct({ entity_mb_id: Schema.String, entity_type: EntityType }),
        Result: ArtistEntity,
        execute: (params) =>
          sql`
            SELECT 
              artist_mb_id, artist_name, artist_disambiguation,
              entity_type, entity_mb_id, entity_name,
              relation_type, direction, attribute_type, entity_metadata
            FROM mb_master_lookup 
            WHERE ${
            sql.and([
              sql`entity_mb_id = ${sql(params.entity_mb_id)}`,
              sql`entity_type = ${sql(params.entity_type)}`
            ])
          }
            ORDER BY relation_type, artist_name
          `
      })

      return yield* query({ entity_mb_id: entityId, entity_type: entityType })
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new MBQueryError({
            message: `Failed to fetch entity discovery: ${error}`,
            queryType: "EntityDiscovery"
          })
        )
      )
    )
).pipe(
  RequestResolver.contextFromServices(SqlClient.SqlClient)
)

// =============================================================================
// QUERY FUNCTIONS - Using Effect.request pattern
// =============================================================================

// Query function for artist-entity requests
const getArtistEntity = (queryString: ArtistEntityQuery) =>
  Effect.request(ArtistEntityRequest({ queryString }), ArtistEntityResolver)

// Query function for artist-relation requests
const getArtistRelation = (queryString: ArtistRelationQuery) =>
  Effect.request(
    ArtistRelationRequest({
      queryString
    }),
    ArtistRelationResolver
  )

// Query function for artist-entity-relation requests
const getArtistEntityRelation = (queryString: ArtistEntityRelationQuery) =>
  Effect.request(
    ArtistEntityRelationRequest({
      queryString
    }),
    ArtistEntityRelationResolver
  )

// Query function for entity discovery requests
const getEntityDiscovery = (queryString: EntityDiscoveryQuery) =>
  Effect.request(
    EntityDiscoveryRequest({
      queryString
    }),
    EntityDiscoveryResolver
  )

// =============================================================================
// ENHANCED MUSICBRAINZ SERVICE WITH REQUEST/RESOLVER PATTERN
// =============================================================================

export class MBDataService extends Effect.Service<MBDataService>()("MBDataService", {
  accessors: true,
  sync: () => {
    // Template literal DSL methods - API unchanged, implementation improved

    return {
      // New direct query functions
      getArtistEntity,
      getArtistRelation,
      getArtistEntityRelation,
      getEntityDiscovery
    }
  },
  dependencies: [MusicKBSqlLive]
}) {}

// =============================================================================
// EXPORT REQUEST CONSTRUCTORS FOR EXTERNAL USE
// =============================================================================
