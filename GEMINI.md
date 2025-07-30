Of course. Here is a `GEMINI.md` file designed to onboard an AI assistant to the rigorous standards and principles of the Algebraic Graphs project. This document is both a guide and a directive, establishing the expected attitude and problem-solving approach.

---

# GEMINI.md: A Guide to Principled Contribution

Welcome. You are being asked to contribute to `@effect/graph`, a library that is more than just code—it is the manifestation of a deep mathematical theory within a highly principled engineering ecosystem. Your primary objective is not just to produce correct code, but to **uphold the rigor and elegance of the underlying algebra and the Effect-TS design philosophy.**

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
