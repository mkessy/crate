# Entity Resolution Implementation Structure

## Overview

With the types and service interfaces now in the `@crate/domain` package, you can implement the actual services in the server package while keeping the web package free from server-specific dependencies.

## Server Implementation Pattern

Here's how to structure the implementation in your server package:

```typescript
// packages/server/src/entity-resolution/text-normalizer.ts
import { Effect, Layer } from "effect"
import { TextNormalizer } from "@crate/domain"

// Implementation using server-specific libraries
const TextNormalizerLive = Layer.succeed(
  TextNormalizer,
  {
    normalize: (text: string) => {
      // Your normalization logic here
      return text.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    },
    
    toPhonetic: (text: string) => {
      // Could use a library like soundex-code or metaphone
      // For now, a simple implementation
      return text
    },
    
    toNGrams: (text: string, n: number) => {
      const ngrams: string[] = []
      for (let i = 0; i <= text.length - n; i++) {
        ngrams.push(text.slice(i, i + n))
      }
      return ngrams
    },
    
    extractFeatures: (text: string) => {
      // Feature extraction logic
      return {
        tokens: text.split(/\s+/),
        hasYear: Option.none(), // Implement year detection
        hasFeaturing: Option.none(), // Implement featuring detection
        hasParenthetical: text.includes("("),
        hasRemix: /remix|rmx/i.test(text)
      }
    }
  }
)
```

## Web Implementation Pattern

In the web package, you can create different implementations:

```typescript
// packages/web/src/entity-resolution/text-normalizer.ts
import { Effect, Layer } from "effect"
import { TextNormalizer } from "@crate/domain"

// Browser-compatible implementation
const TextNormalizerBrowser = Layer.succeed(
  TextNormalizer,
  {
    normalize: (text: string) => {
      // Same logic but ensure no Node dependencies
      return text.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    },
    // ... other methods
  }
)
```

## Benefits of This Structure

1. **Type Safety**: Both server and web packages share the same types from domain
2. **No Build Conflicts**: Web package doesn't depend on server package
3. **Environment-Specific Implementations**: Server can use Node libraries, web can use browser APIs
4. **Testability**: Mock implementations can be created for testing
5. **Modularity**: Easy to swap implementations based on context

## Usage Example

```typescript
// In server context
import { EntityResolver } from "@crate/domain"
import { EntityResolverLive } from "./entity-resolution/resolver.js"

const program = Effect.gen(function* () {
  const resolver = yield* EntityResolver
  const result = yield* resolver.resolve({
    text: "The Beatles - Hey Jude",
    type: "recording"
  })
  // ... use result
})

// Provide the implementation
const runnable = program.pipe(
  Effect.provide(EntityResolverLive)
)
```

## Next Steps

1. Move any other shared types from server to domain
2. Update server package to import types from domain
3. Implement the services in the server package
4. Create browser-compatible implementations in web package if needed
