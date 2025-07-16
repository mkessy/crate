/**
 * Entity Resolution module
 *
 * This module provides types and service interfaces for entity resolution
 * in the music discovery system. It's designed to be environment-agnostic
 * and can be used in both server and web contexts.
 */

export * from "./Candidate.js"
export * as EntityStore from "./EntityStore.js"
export * from "./mention/Mention.js"
export * from "./ResolutionCache.js"
export * from "./ResolutionScope.js"
export * from "./schemas.js"
export * from "./TrieFinder.js"
export * from "./utils.js"
