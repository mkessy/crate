Of course. Here is a `GEMINI.md` file designed to onboard an AI assistant to the rigorous standards and principles of the Algebraic Graphs project. This document is both a guide and a directive, establishing the expected attitude and problem-solving approach.

---

# GEMINI.md: A Guide to Principled Contribution

Welcome. You are being asked to contribute to `@effect/graph`, a library that is more than just code—it is the manifestation of a deep mathematical theory within a highly principled engineering ecosystem. Your primary objective is not just to produce correct code, but to **uphold the rigor and elegance of the underlying algebra and the Effect-TS design philosophy.**

Of course. Here is a comprehensive overview designed for another instance of myself, detailing the project's vision, the power of its chosen tooling, and the deep concepts at play.

---

### **Project Overview: A Compositional Reasoning Engine**

The user you are assisting is developing a sophisticated, "online" reasoning engine, code-named "crate," designed to explore and demonstrate a powerful new paradigm at the intersection of several complex fields. The initial domain is music, but the principles are generalizable.

The project's core thesis is that the primary bottleneck in building robust neuro-symbolic systems is not a lack of theoretical models but a fundamental **implementation friction** between the worlds of statistical Machine Learning (primarily in Python) and formal, type-safe software development.

The goal of "crate" is to prove that by using a sufficiently powerful and principled toolset—the **`Effect` ecosystem**—one can build an application that elegantly unifies:

1.  **Statistical NLP & ML:** Using libraries like `wink-nlp` and semantic embeddings from LLMs to parse and understand unstructured text.
2.  **Formal Knowledge Representation:** Using **Algebraic Property Graphs (APGs)** as a central, verifiable data structure for knowledge.
3.  **High-Performance Software Engineering:** Building a robust, concurrent, and scalable application from the front-end to the back-end.

The project aims to be a first-in-class demonstration of how to solve this implementation friction, creating a system that is far more than the sum of its parts.

---

### **The "Effect" Paradigm: Why This Tooling is Critical (20 Concepts)**

`Effect` is not just a library; it's a complete programming paradigm for TypeScript that elevates it to the level of advanced functional languages like Haskell, while remaining accessible. It achieves this by respecting formal principles while providing a standard, batteries-included toolkit. Understanding the "Effect way" is key.

#### **Foundational Concepts**

1.  **`Effect<A, E, R>` (The Core Abstraction):** This is the heart of everything. An `Effect` is not a `Promise`; it's a **description of a program**. It models a computation that can succeed with a value of type `A`, fail with an error of type `E`, and requires a context (dependencies) of type `R`. This lazy, descriptive nature is what makes it so composable.
2.  **Structured Concurrency:** `Effect` treats concurrency as a first-class citizen. Using **Fibers** (lightweight virtual threads), it provides guarantees that no concurrent operation is ever "leaked." If an effect is interrupted, all of its children fibers are automatically and safely terminated. This is a monumental advantage over `Promise.race` or manual cancellation tokens.
3.  **`Layer<A, E, R>` (Dependency Injection):** A `Layer` is a blueprint for constructing a service. It describes how to acquire and release a resource, solving dependency injection in a purely functional, compositional, and type-safe way. This is how you manage dependencies like databases, API clients, or your own services without singletons or complex frameworks.
4.  **`Context<T>` (The Environment):** This is the "`R`" in `Effect`. It's a type-safe map of services that an effect needs to run. You don't pass dependencies as arguments; you ask for them from the context.
5.  **Error Handling as Values:** In `Effect`, errors are not thrown; they are returned as values in the `E` channel. This makes all failure paths explicit and forces the developer to handle them, eliminating an entire class of runtime exceptions. Functions like `Effect.catchTag` allow you to handle specific, typed errors gracefully.

#### **Schema & Data Modeling**

6.  **`Schema` (The Data Blueprint):** `Effect Schema` is arguably the most advanced data modeling and validation library in the JavaScript ecosystem. It allows you to define a single source of truth for your data types and derive parsers, encoders, and even arbitrary data generators from it.
7.  **Branded Types (`Brand`):** `Schema` allows you to create "branded" types (e.g., `string & Brand<"Email">`). This provides nominal typing, making it impossible to accidentally use a plain string where a validated `Email` is required. This is critical for enforcing the integrity of your APG's labels and IDs.
8.  **Declarative Transformation:** Instead of writing imperative validation logic, you compose schemas. A complex validation is just `S.String.pipe(S.minLength(5), S.filter(...))`. This is less error-prone and more readable.
9.  **AST-Based Power:** `Schema` works by first creating an **Abstract Syntax Tree (AST)** of your type definition. This AST can then be compiled to various targets—a validator, a JSON schema, a TypeScript type, etc. This is what gives it its incredible power and flexibility.
10. **`Data.Case` (Immutable Data Structures):** `Effect` provides helpers for creating immutable, structurally comparable data structures with ease. This is the foundation for implementing algebraic types like your `Graph` ADT.

#### **Composition & Control Flow**

11. **Piping (`pipe`):** The `pipe` function is the primary way to compose operations. It avoids nested function calls (`g(f(x))`) in favor of a readable, linear flow (`pipe(x, f, g)`). This is the standard style for all `Effect` code.
12. **`Stream<A, E, R>` (Streaming Data):** A `Stream` is an effectful, pull-based stream of data. It's built on top of `Effect` and inherits all its benefits: structured concurrency, robust error handling, and dependency management. It's the perfect tool for processing database results, parsing large files, or handling real-time data.
13. **`Sink<A, E, R, L, Z>` (Consuming Streams):** A `Sink` is a consumer that can be attached to a `Stream` to produce a summary value. You can `run` a stream against a sink like `Sink.sum`, `Sink.count`, or a custom sink that finds the highest-scoring entity.
14. **`Effect.gen` (Generator-based Pipelines):** For complex, sequential workflows that look like imperative code, `Effect.gen` with `function*` syntax provides a highly readable alternative to long `pipe` chains. It's syntactic sugar for `Effect.flatMap`.
15. **`Request` & Caching (`Effect.cached`):** `Effect` provides a built-in, powerful request-caching system. This allows you to easily memoize expensive operations like LLM calls or database queries, ensuring they only run once for a given input within a specific scope.

#### **Advanced Concepts**

16. **`Scope` (Resource Management):** A `Scope` is a powerful primitive that manages the lifecycle of resources. It ensures that resources (like file handles or database connections) acquired within the scope are safely released when the scope is closed, even in the presence of errors or interruptions.
17. **`Ref<A>` (Concurrent, Mutable State):** While `Effect` encourages immutability, it provides `Ref` for managing shared, mutable state in a concurrent environment safely. This is useful for things like in-memory caches or application-level state.
18. **The Power of `any` and `unknown`:** `Effect`'s APIs are expertly typed to handle `unknown` inputs safely and flow `any` types through when necessary, but the "happy path" is always fully typed. Understanding this distinction is key to writing idiomatic code.
19. **Testability by Design:** Because an `Effect` is just a description of a program, it's incredibly easy to test. You can inspect its requirements and provide mock `Layer`s for its dependencies, allowing for true unit testing of complex, asynchronous, and effectful logic.
20. **Integration & Interoperability:** `Effect` is designed to work with the existing ecosystem. It has built-in, safe functions for interacting with `Promise`s (`Effect.promise`, `Effect.tryPromise`) and other asynchronous patterns, making gradual adoption seamless.

---

### **The APG Paradigm: Why This Abstraction is Central (10 Concepts)**

The Algebraic Property Graph is not just another graph data model; it's a formal system for reasoning about structure and composition. We are focusing on it because it provides the perfect **formal landing zone** for the fuzzy outputs of NLP and LLMs.

1.  **Algebraic Closure:** The core operations (`overlay`, `connect`) take graphs as input and produce a graph as output. This means you can compose operations indefinitely and the result is always a well-defined graph.
2.  **`Empty` (The Identity):** The `Empty` graph is the identity element for the `overlay` operation. This is a crucial algebraic property that makes many algorithms simpler. `overlay(g, Empty) = g`.
3.  **`Overlay` (The Union/Composition):** This is the commutative and associative `+` operator for graphs. It allows you to merge disparate pieces of knowledge into a coherent whole without losing information.
4.  **`Connect` (The Relational Operator):** This is the non-commutative `*` operator that introduces new relationships. It's how you build structure and meaning on top of the raw collection of vertices.
5.  **Mokhov's Purity:** We start with Mokhov's work because it provides the pure, simple, and powerful algebraic core. His ADT is the structural blueprint for our system.
6.  **Shinavier's Properties:** We extend Mokhov's work with ideas from Shinavier to add rich, schema-validated properties to both vertices and edges, making the graph useful for real-world data modeling.
7.  **The Graph as a Description:** Our `Graph<V, E>` type is not the final, efficient data structure for querying. It is a **lazy, algebraic description** of a graph. This is a powerful idea because it separates the _what_ (the graph's structure) from the _how_ (its runtime implementation).
8.  **The `fold` (Deconstruction):** The `fold` operation is the universal way to interpret or "compile" the algebraic description into anything else: a count of vertices, a list of edges, a visual representation, or a more efficient runtime data structure.
9.  **Homomorphisms (Structure-Preserving Maps):** This is the key to verifiable data transformations. A homomorphic function (like our type-safe `connect` method) guarantees that the rules of your schema are never violated during graph construction.
10. **The Unifying Abstraction:** The APG is powerful because it can elegantly model wildly different things—the syntax of a sentence, the relationships in a knowledge base, the steps in a computational workflow—using the exact same set of underlying algebraic principles. This allows us to write generic, reusable algorithms that operate on "graphs," regardless of their specific domain.

This is a seminal work. Precision, thoughtfulness, and a deep respect for the established principles are paramount.

## 1. The Core Mission

Our mission is to implement a mathematically pure, safe, and highly compositional algebraic graph library for Effect-TS, based on the work of Andrey Mokhov. This library must be a first-class citizen of the Effect ecosystem, adhering to all its patterns and principles without compromise.

## 2. The Sacred Laws

There are two sets of laws that govern this project. They are inviolable. Before taking any action, you must verify that you are not breaking them. **If you are ever in doubt, you must stop and ask for clarification.** It is always better to ask than to violate a principle.

### 2.1 The Laws of Mathematics (The Mokhov Axioms)

These laws define what an algebraic graph _is_. Our library is a failure if it does not satisfy them. They are primarily verified in `test/laws.test.ts`.

- **Law I (Overlay is a Commutative Monoid)**: The `overlay` operation (`+`) must be commutative (`a + b === b + a`) and associative (`a + (b + c) === (a + b) + c`), with `empty` as its identity (`a + empty === a`).
- **Law II (Connect is Associative)**: The `connect` operation (`→`) must be associative (`a → (b → c) === (a → b) → c`).
- **Law III (Distributivity)**: `connect` must distribute over `overlay` from both the left and the right.
- **Law IV (Decomposition)**: `(x → y → z) === (x → y) + (x → z) + (y → z)`. This is the most complex and powerful law, defining how connections compose.

**Directive**: Before modifying any core logic in `internal/algebraic.ts` or `internal/relation.ts`, you must state which axiom your change impacts and how you will ensure it remains satisfied. All core logic changes must be accompanied by a property-based test that verifies the relevant axioms.

### 2.2 The Laws of Engineering (The Effect Principles)

These laws ensure our library is a robust, ergonomic, and idiomatic component of the Effect ecosystem.

- **Law V (Purity & Immutability)**: All functions must be pure. Data structures are immutable. An operation on a `Graph` must always return a _new_ `Graph` instance. Never mutate existing state.
- **Law VI (Errors as Values)**: We do not throw exceptions for control flow. Operations that can fail must return `Option`, `Either`, or `Effect`. Reference `Chunk.get` which returns `Option` as the canonical example.
- **Law VII (Structural Equality via `Equivalence`)**: The `Equal.Equal` and `Hash.Hash` interfaces are not implemented on the `Graph` prototype because generic structural equality is impossible without user-provided context. All user-facing functions that depend on equality or hashing **must** be explicitly parameterized by an `Equivalence<A>` instance.
- **Law VIII (Idiomatic API Design)**: All functions that take a `Graph` as their primary argument must be pipeable, using the `dual` helper from `effect/Function`. JSDoc is mandatory for all public APIs and must follow the established format (`@since`, `@category`, `@example`).

**Directive**: Before implementing any public-facing function in `Graph.ts`, you must first consider which of these laws apply. If an operation requires equality, state that it needs an `Equivalence` parameter. If it can fail, state that it must return `Option`.

## 3. Your Mandate for Problem Solving

Your role is to act as a careful and precise collaborator.

1.  **Decompose First**: When given a task, first break it down according to our 4-phase workflow (Decomposition, Implementation, Verification, Documentation). State the "subgraph" of files you intend to modify.
2.  **Verify, Then Act**: Before writing implementation code, reference the Sacred Laws. State which ones are relevant to the task and how you will adhere to them.
3.  **Cite Your Sources**: When implementing a pattern (e.g., a prototype, a variance annotation, a dual-signature function), cite the specific Effect-TS file (`Chunk.ts`, `HashMap.ts`, etc.) that establishes the precedent. When implementing a graph concept, cite the relevant paper (Mokhov or Shinavier).
4.  **Prioritize Questions Over Assumptions**: If a request is ambiguous, or if a proposed change seems to conflict with one of the Sacred Laws, your primary directive is to **stop and ask for clarification**. For example:
    - _"This request to add a default `equals` method seems to violate Law VII regarding `Equivalence`. Proceeding would compromise type safety for custom vertex types. Please confirm how to proceed."_
    - _"The requested `findAndModify` operation implies mutation, which violates Law V. A correct implementation would be a `findAndReplace` function that returns a new `Graph`. Please confirm."_

By adhering to this guide, you will ensure that every contribution is a step toward creating the definitive, mathematically sound algebraic graph library for the Effect ecosystem.
