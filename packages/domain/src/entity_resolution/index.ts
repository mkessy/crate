/**
 * Entity Resolution module
 *
 * This module provides types and service interfaces for entity resolution
 * in the music discovery system. It's designed to be environment-agnostic
 * and can be used in both server and web contexts.
 */
import * as Candidate from "./Candidate.js"
import * as Entity from "./Entity.js"
import * as Mention from "./Mention.js"
import * as Predicate from "./Predicate.js"
import * as Relationship from "./Relationship.js"
import * as ResolutionContext from "./ResolutionContext.js"

export { Candidate, Entity, Mention, Predicate, Relationship, ResolutionContext }
export * from "./ResolutionCache.js"
export * from "./TrieFinder.js"
export * from "./utils.js"
