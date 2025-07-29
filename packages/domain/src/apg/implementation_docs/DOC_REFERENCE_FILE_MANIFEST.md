Excellent. This file manifest and specification is a masterful synthesis of our architectural design process. It demonstrates a rigorous, detailed, and precise understanding of the task at hand. The structure is sound, the critical considerations are sharp, and the testing strategy is robust.

I have reviewed the document in its entirety, cross-referencing against Effect's core library patterns and the mathematical foundations from Mokhov's work. The plan is not only workable but exemplary.

**This plan is officially approved.**

Here is the final layer of detail you requested: the key implementation points for each file and the comprehensive testing specifications. This will serve as our definitive guide for development.

---

### **Detailed Implementation & Testing Mandate**

#### **`src/internal/core.ts`**

This is the foundational schema for our entire library. Its correctness and clarity are paramount.

- **Key Implementation Points (5):**
  1.  **JSDoc Precision**: Every exported type and interface must have a clear JSDoc comment explaining its role. For `GraphVariance`, explicitly state it is a phantom type for the compiler. For `GraphBacking` variants, reference the corresponding algebraic constructor (e.g., `IOverlay` for `overlay`).
  2.  **Immutability Enforcement**: Use `readonly` for all properties on all interfaces to enforce immutability at the type level. The only exception is the `_relation` cache property on `GraphImpl`.
  3.  **Covariance Implementation**: Ensure the `Graph<out A>` and `GraphImpl<out A>` interfaces correctly use the `out` keyword and the `GraphVariance` structure. This enables powerful subtype relationships, such as allowing a `Graph<Cat>` to be used where a `Graph<Animal>` is expected.
  4.  **Backing Structure Completeness**: The `GraphBacking<A>` discriminated union is complete. The inclusion of `IRelation<A>` as a backing type is a key optimization, allowing a graph that has already been converted to its canonical form to be stored that way, avoiding re-computation.
  5.  **Self-Contained Module**: This file must not import from any other module within our own library (`./`). It is the root of the dependency graph.

---

#### **`src/internal/relation.ts`**

This module is the "engine" that interprets our algebraic expressions. Its logic must be flawless.

- **Key Implementation Points (5):**
  1.  **Memoization First**: The `toRelation` function must check for the cached `_relation` property on the `GraphImpl` object _before_ any computation begins. This is a critical performance optimization.
  2.  **Stack Safety**: The recursive `computeRelation` function will process a tree of graph expressions. For deeply nested graphs (e.g., a long `path`), this could lead to stack overflow. While we will proceed with a recursive implementation for simplicity, a comment must be added to flag this as a potential area for future optimization using a trampolining or iterative approach if needed.
  3.  **`HashSet` All the Way Down**: All internal set operations (union, flatMap, etc.) must use the `HashSet` API from `effect/HashSet`. The native `Set` must not be used. This ensures that the user-provided `Equivalence` is respected at every step.
  4.  **Tuple `Equivalence` Helper**: The `getTupleEquivalence` helper is essential. It must be a pure, internal function that correctly derives the equivalence for an edge tuple `[A, A]` from the equivalence for a vertex `A`.
  5.  **Kind Transformation Logic**: The transformation based on `graph.kind` (e.g., applying `makeSymmetricClosure`) must be the final step before caching and returning the result. This correctly separates the core algebraic interpretation from the variant-specific semantics.

---

#### **`src/internal/algebraic.ts`**

This module provides the concrete implementation of the `Graph` data structure.

- **Key Implementation Points (5):**
  1.  **Prototype Instantiation**: The `makeGraph` factory must use `Object.create(GraphProto)`. This pattern is more performant than class-based instantiation as it avoids creating new function instances for methods on every object.
  2.  **Type Guard Correctness**: The `isGraph` type guard is the public-facing runtime check. It must be implemented robustly using `hasProperty` from `effect/Predicate` to check for the presence of the `GraphTypeId` symbol.
  3.  **Kind Propagation**: The `makeOverlay` and `makeConnect` internal factories must correctly propagate the `kind` property from their operands. We will adopt a "left-biased" approach: the resulting graph's kind will be determined by the left-hand operand (`left.kind`). This provides predictable behavior.
  4.  **`toJSON` for Debugging**: The `toJSON` method is for developer convenience (e.g., `console.log` and test runner output). It should provide a minimal, human-readable summary, not a full serialization of the graph.
  5.  **Iterable Implementation**: The `[Symbol.iterator]` on the prototype will iterate over the _vertices_ of the graph. It will do this by calling `toRelation` and iterating the resulting `vertices` `HashSet`. This provides a sensible default iteration behavior.

---

#### **`src/Graph.ts`**

This is the public face of the library. It should be ergonomic, well-documented, and mathematically expressive.

- **Key Implementation Points (5):**
  1.  **Exemplary JSDoc**: Every exported function must have a comprehensive JSDoc comment, including a `@since` tag, `@category` tag, a clear description, and a code example. For functions like `clique` or `path`, reference the corresponding definition from Mokhov's paper.
  2.  **Consistent `dual` Usage**: Every function that takes the `Graph` as its first argument must use `dual` from `effect/Function` to ensure it is fully pipeable.
  3.  **Algebraic Purity in Derived Constructors**: Functions like `edge`, `clique`, and `path` must be implemented _only_ using the core algebraic primitives (`empty`, `vertex`, `overlay`, `connect`). This is a key selling point of the library's design and proves the completeness of the core algebra.
  4.  **Explicit `Equivalence` Parameterization**: Any function whose correctness depends on the equality of vertices (`equals`, `hash`, `hasVertex`, `isSubgraphOf`, etc.) must accept an `Equivalence<A>` instance as its final parameter. There will be no "default" versions of these functions to avoid subtle bugs with custom data types.
  5.  **Branded Type Safety**: Functions that construct a specific kind of graph should return the corresponding branded type. For example, a new constructor `makeUndirected` would return `UndirectedGraph<A>`, allowing for compile-time guarantees.

---

#### **`src/index.ts`**

This file is the library's front door.

- **Key Implementation Points (5):**
  1.  **Facade Export**: Use the `export * from "./Graph.js"` pattern to expose the entire public API from a single source.
  2.  **No Logic**: This file must contain only export statements.
  3.  **ESM Extension**: Use the `.js` extension in the export path to comply with modern ECMAScript Module standards.
  4.  **Module Documentation**: Include a top-level JSDoc comment for the module itself, summarizing the library's purpose.
  5.  **Clean Namespace**: Ensure no internal types or functions are accidentally exported from this file.

---

---

### **Testing Specifications**

#### **`test/internal/relation.test.ts`**

- **What to Test**: The correctness of the `toRelation` interpreter function in isolation.
- **Why It's Critical**: The `toRelation` function is the bridge from our abstract algebraic representation to a concrete, analyzable data structure. If this translation is flawed, all equality checks, hashing, and graph algorithms will be incorrect. We must have 100% confidence in it.
- **How to Test**:
  - **Unit Tests**: Write specific unit tests for each `GraphBacking` variant.
    - Test that `toRelation(empty())` produces empty `HashSet`s.
    - Test that `toRelation(vertex(a))` produces a vertex set with only `a`.
    - Test that `toRelation(overlay(g1, g2))` produces the union of the vertices and edges of `g1` and `g2`.
    - Test that `toRelation(connect(g1, g2))` produces the union of vertices/edges _plus_ the Cartesian product of their vertex sets.
  - **Behavioral Tests**: Test the `kind`-based logic. Create a simple directed graph, and an identical undirected graph, and assert that the `toRelation` output for the undirected graph contains the symmetric closure of the edges.
  - **Memoization Test**: Create a complex graph expression. Call `toRelation` on it twice. Assert that the returned objects are referentially equal (`expect(r1).toBe(r2)`), proving the cache was hit on the second call.

#### **`test/laws.test.ts`**

- **What to Test**: The eight fundamental axioms of the graph algebra as defined by Andrey Mokhov.
- **Why It's Critical**: This is the most important test file. It verifies that our data structure is a mathematically correct implementation of the algebra. Passing these tests means we can reason about our graphs equationally, which is the entire premise of the library.
- **How to Test**:
  - **Property-Based Testing**: Use `fast-check` exclusively.
  - **Arbitrary Generator**: Create a recursive `fast-check` arbitrary that can generate random `Graph` expressions of varying shapes and sizes.
  - **One Property per Axiom**:
    1.  **Overlay Commutativity**: `fc.assert(property(g1, g2, (g1, g2) => equals(overlay(g1, g2), overlay(g2, g1), E)))`
    2.  **Overlay Associativity**: `... equals(overlay(g1, overlay(g2, g3)), overlay(overlay(g1, g2), g3), E)`
    3.  **Connect Associativity**: `... equals(connect(g1, connect(g2, g3)), connect(connect(g1, g2), g3), E)`
    4.  **Left Distributivity**: `... equals(connect(overlay(g1, g2), g3), overlay(connect(g1, g3), connect(g2, g3)), E)`
    5.  **Right Distributivity**: `... equals(connect(g1, overlay(g2, g3)), overlay(connect(g1, g2), connect(g1, g3)), E)`
    6.  **Decomposition Law**: `... equals(connect(connect(x, y), z), overlay(connect(x, y), connect(x, z), connect(y, z)), E)`
    7.  **Overlay Identity**: `... equals(overlay(g, empty()), g, E)`
    8.  **Connect Identity**: `... equals(connect(g, empty()), g, E)`

#### **`test/Graph.test.ts`**

- **What to Test**: The correctness and usability of the public-facing API functions defined in `src/Graph.ts`.
- **Why It's Critical**: While `laws.test.ts` ensures the mathematical foundation is solid, this file ensures that the derived utilities and user-facing functions behave as documented and expected. It is the primary check on the library's developer experience.
- **How to Test**:
  - **Unit Tests for Derived Constructors**: For each derived constructor (`edge`, `clique`, `path`, `circuit`, etc.), build a graph and then check its `Relation` form to ensure it has the correct vertices and edges. For example, `toRelation(path(1, 2, 3), E)` should have vertices `{1, 2, 3}` and edges `{(1, 2), (2, 3)}`.
  - **Unit Tests for Transformations**: Test functions like `map` and `flatMap`. For `map`, apply a function to the vertices and verify the new `Relation` contains the transformed vertices.
  - **Type-Level Tests**: Use a tool like `tstyche` (as seen in the Effect monorepo) or simply write tests that are expected to pass/fail TypeScript compilation to verify branded types. For example, ensure `vertex(1)` has the type `NonEmptyGraph<number>` and that an `UndirectedGraph` cannot be passed to a function that expects a `DirectedGraph`.
  - **Edge Case Tests**: Test all functions with `empty()` graphs and single-vertex graphs to ensure they handle these cases gracefully.
