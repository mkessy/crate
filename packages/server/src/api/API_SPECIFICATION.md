# Crate Music API Specification

## Overview

The Crate Music API provides access to KEXP play history data through a type-safe, Effect-based HTTP API. This is a focused implementation with a single endpoint for retrieving recent plays.

## Architecture

### Framework Stack
- **Effect-ts**: Functional TypeScript framework for composable, type-safe programs
- **@effect/platform**: HTTP server and API building blocks
- **@effect/platform-node**: Node.js-specific implementations
- **Effect Schema**: Type-safe schema validation and transformation

### API Structure
- **Domain Layer**: Business logic and data access (`@crate/domain`)
- **HTTP Layer**: API definitions and handlers (`@crate/server`)
- **Type Safety**: Full type inference from domain models to HTTP responses
- **Auto Documentation**: Swagger/OpenAPI generation
- **Error Handling**: Structured error responses with proper HTTP status codes

## Endpoints

### GET /plays

Retrieves recent KEXP plays with optional pagination.

#### Request

**URL Parameters:**
- `limit` (optional): Maximum number of results to return (1-100, default: 50)
- `offset` (optional): Number of results to skip for pagination (default: 0)

**Example Requests:**
```bash
GET /plays
GET /plays?limit=10
GET /plays?limit=25&offset=50
```

#### Response

**Success (200):**
```json
[
  {
    "id": 12345,
    "airdate": "2024-01-15T14:30:00Z",
    "show": 567,
    "show_uri": "https://kexp.org/shows/567",
    "image_uri": "https://kexp.org/images/12345.jpg",
    "thumbnail_uri": "https://kexp.org/thumbnails/12345.jpg",
    "song": "Song Title",
    "track_id": "track_123",
    "recording_id": "rec_456",
    "artist": "Artist Name",
    "artist_ids": "[\"artist_1\", \"artist_2\"]",
    "album": "Album Name",
    "release_id": "release_789",
    "release_group_id": "rg_101",
    "labels": "[\"Label One\", \"Label Two\"]",
    "label_ids": "[\"label_1\", \"label_2\"]",
    "release_date": "2023-06-15",
    "rotation_status": "Heavy",
    "is_local": 1,
    "is_request": 0,
    "is_live": 1,
    "comment": "Live in studio",
    "play_type": "trackplay",
    "created_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
]
```

**Error (400):**
```json
{
  "error": "BadRequest",
  "message": "Invalid query parameters"
}
```

#### Schema Details

**FactPlay Model:**
- `id`: Unique play identifier (number)
- `airdate`: ISO timestamp when played
- `show`: KEXP show identifier
- `show_uri`: Link to KEXP show page
- `image_uri`: Album artwork URL (nullable)
- `thumbnail_uri`: Album thumbnail URL (nullable)
- `song`: Track title (nullable)
- `track_id`: KEXP track identifier (nullable)
- `recording_id`: MusicBrainz recording ID (nullable)
- `artist`: Primary artist name (nullable)
- `artist_ids`: JSON array of artist IDs (nullable)
- `album`: Album/release title (nullable)
- `release_id`: MusicBrainz release ID (nullable)
- `release_group_id`: MusicBrainz release group ID (nullable)
- `labels`: JSON array of label names (nullable)
- `label_ids`: JSON array of label IDs (nullable)
- `release_date`: Album release date (nullable)
- `rotation_status`: KEXP rotation category (nullable)
- `is_local`: Whether artist is Seattle/local (0 or 1)
- `is_request`: Whether play was requested (0 or 1)
- `is_live`: Whether performance was live (0 or 1)
- `comment`: Additional notes (nullable)
- `play_type`: Type of play ("trackplay" or "nontrackplay")
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

## Implementation Details

### File Structure
```
packages/server/src/
├── api/
│   ├── CrateMusicAPI.ts          # Main API definition
│   └── plays/
│       ├── endpoints.ts          # Endpoint definitions
│       ├── group.ts             # API group configuration
│       └── index.ts             # Exports
└── http/
    ├── PlaysApi.ts              # Handler implementations
    ├── server.ts                # Server setup and runtime
    └── API_SPECIFICATION.md     # This document
```

### Key Components

1. **API Definition** (`CrateMusicAPI.ts`):
   - Defines the overall API structure
   - Includes OpenAPI metadata
   - Composes endpoint groups

2. **Endpoint Definition** (`plays/endpoints.ts`):
   - Defines URL structure and parameters
   - Specifies request/response schemas
   - Declares possible error types

3. **Handler Implementation** (`PlaysApi.ts`):
   - Implements business logic
   - Handles pagination
   - Transforms domain models to HTTP responses
   - Manages error handling

4. **Server Setup** (`server.ts`):
   - Configures HTTP server
   - Provides dependency injection
   - Sets up logging and runtime

### Error Handling

The API uses Effect's structured error handling:
- Domain errors are caught and transformed to appropriate HTTP errors
- All errors return as `BadRequest` (400) for this endpoint
- Error responses follow a consistent structure

### Type Safety

- Full type inference from database schema to HTTP response
- Compile-time validation of request/response shapes
- Schema-driven parameter validation
- Automatic OpenAPI documentation generation

## Development

### Running the Server
```bash
cd packages/server
npm run http:dev
```

### Testing
```bash
# Basic request
curl "http://localhost:3000/plays"

# With pagination
curl "http://localhost:3000/plays?limit=10&offset=20"

# Invalid parameters (returns 400)
curl "http://localhost:3000/plays?limit=invalid"
```

### Adding Features

To extend this API:

1. **Add New Endpoints**: Define in `plays/endpoints.ts`
2. **Implement Handlers**: Add to `PlaysApi.ts`
3. **Update Schema**: Modify response types if needed
4. **Add Error Types**: Define custom errors if required

### Dependencies

The server requires these services:
- `FactPlaysService`: Domain service for play data
- `SqlClient`: Database connection
- `KEXPApi`: External KEXP API integration

All dependencies are injected via Effect's Layer system.