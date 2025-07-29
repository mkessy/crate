Of course. Here is the comprehensive guide for the Gemini CLI, designed to provide a deep and nuanced understanding of the Algebraic Graphs project.

---

# Gemini CLI Onboarding: Algebraic Graphs in Effect-TS

Welcome to the Algebraic Graphs project. This document is your comprehensive guide to understanding the project's **goals**, **architecture**, **core principles**, and most importantly, **how to approach problem-solving** within this specific context.

Our mission is to create a production-grade, mathematically rigorous, and idiomatic algebraic graph library for the Effect-TS ecosystem. This is not just another graph library; it is an implementation of a powerful mathematical abstraction that brings new levels of safety and composability to graph manipulation in TypeScript.

---

## 1. The Guiding Philosophy: Why Algebraic Graphs?

To contribute effectively, you must first understand the "why" behind this project. We are directly inspired by the seminal work of **Andrey Mokhov in "Algebraic Graphs with Class"**.

### 1.1 The Core Idea of the Mokhov Paper

Traditional graph libraries often represent graphs as a pair of sets: vertices `V` and edges `E`. This approach is fraught with peril, as it allows for the creation of "malformed" graphs, such as an edge that references a non-existent vertex. This leads to APIs filled with partial functions (functions that can throw exceptions or fail) and runtime errors.

Mokhov's brilliant insight was to define graphs not by what they _are_ (sets of vertices and edges), but by how they can be _constructed_. The entire theory is built on four simple, **total** (they never fail) primitives:

1.  **`empty`**: The empty graph.
2.  **`vertex(a)`**: A graph with a single vertex, `a`.
3.  **`overlay(g1, g2)`**: The union of two graphs' vertices and edges.
4.  **`connect(g1, g2)`**: The `overlay` of two graphs, plus new edges from every vertex in `g1` to every vertex in `g2`.

**Your primary goal is to preserve this algebraic purity.** Every feature, every function, and every design decision must be weighed against this core principle. Any proposed change that could introduce a partial function or break the algebraic laws must be rejected.

### 1.2 The Role of "Algebraic Property Graphs"

While Mokhov's work provides the pure algebraic foundation, the paper on **"Algebraic Property Graphs" by Shinavier et al.** guides our integration with real-world data. It shows how this algebraic core can be used to model the property graphs commonly found in enterprise systems and databases.

This paper informs our decisions on:

- How to handle vertices and edges as structured data (properties).
- How to use schemas (specifically `@effect/schema`) for validation.
- The concept of a graph's "schema" as a mapping from labels to types.

---

## 2. Understanding the Effect Ecosystem: Core Principles

To write code for this library, you must think like an Effect developer. This means embracing several key principles.

### 2.1 Purity and Immutability

Every function you write must be a **pure function**. It should not have side effects. All data structures, including our `Graph`, are **immutable**. Operations do not modify a graph; they return a _new_ graph instance.

- **Where to Look**: Study any core data structure in the Effect-TS repository, such as `Chunk.ts`, `List.ts`, or `HashMap.ts`. Notice that methods like `append` or `set` do not change the original structure but return a new, modified one. Our `overlay` and `connect` functions must do the same.

### 2.2 Error Handling: No Exceptions

Effect does not use `try...catch` for control flow. Errors are treated as first-class values.

- **`Option<A>`**: For operations that might not return a value (e.g., finding a vertex that doesn't exist), you must return an `Option`. Look at `Chunk.get()` for a perfect example.
- **`Either<E, A>`**: For operations that can fail with a descriptive error, you would return an `Either`. This is less common for pure data structures but is a core tool.
- **`Effect<A, E, R>`**: For any operation that is asynchronous, has dependencies, or has complex failure scenarios (like schema parsing), you must wrap it in an `Effect`.

### 2.3 TypeScript Nuances in Effect

Effect leverages advanced TypeScript features to provide maximum type safety.

- **Branded Types**: You will see types like `type UserId = string & Brand<"UserId">`. This is how Effect achieves nominal typing within TypeScript's structural type system. It prevents you from accidentally using a `ProductId` where a `UserId` is expected, even though both are strings at runtime. You must use and respect these branded types, especially for defining graph kinds like `DirectedGraph` and `UndirectedGraph`.
- **Variance (`in`/`out`)**: Our `Graph<out A>` interface uses the `out` keyword. This signals to the compiler that `A` is a **covariant** type parameter. In simple terms, it means a `Graph<Cat>` is a valid subtype of `Graph<Animal>`. Understanding this is crucial for writing generic, reusable functions. The `@effect/typeclass` package is built on this concept.
- **`dual` and `Pipeable`**: Every function that operates on a `Graph` instance must be "pipeable." We achieve this by using the `dual` function from `effect/Function`. It allows a function to be called in two ways: `overlay(g1, g2)` or `pipe(g1, overlay(g2))`. Study its usage in any core data structure module.

---

## 3. The Project Architecture: File Manifest and Checkpoints

This is the blueprint for our implementation. Understanding the role of each file is critical to knowing where to find or add functionality.

### 3.1 File Manifest

- `/src/internal/core.ts`: **The Foundation**. Contains the `GraphTypeId`, core interfaces (`Graph`, `GraphImpl`), and backing data structure definitions (`GraphBacking`, `Relation`). It has **zero** internal dependencies.
- `/src/internal/relation.ts`: **The Interpreter**. Contains the logic (`toRelation`) to convert the abstract algebraic representation into a concrete, canonical set of vertices and edges (`Relation<A>`). This is the bridge between the algebra and analyzable data.
- `/src/internal/algebraic.ts`: **The Engine**. Implements the `GraphProto` (prototype) and the `makeGraph` factory. This is where the core `[Symbol.iterator]` and other prototype methods live. It uses `relation.ts` for equality and hashing.
- `/src/Graph.ts`: **The Public API**. This is the user-facing module. It contains all the exported functions (`empty`, `vertex`, `overlay`, `connect`, `map`, `clique`, etc.), the HKT `GraphTypeLambda`, and branded types.
- `/src/index.ts`: **The Entrypoint**. A simple file that re-exports everything from `Graph.ts`.
- `/test/laws.test.ts`: **The Constitution**. The most important test file. It uses `fast-check` to verify that our implementation adheres to all 8 of Mokhov's algebraic axioms.

### 3.2 Implementation Checkpoints & Problem Solving

When tackling a new feature or bug, use this phased approach to guide your thinking:

1.  **Checkpoint 1 (Types First)**: Before writing any logic, define the necessary types and interfaces in `src/internal/core.ts`. Ensure they compile and make sense architecturally.

    - _Problem Solving_: "Does this new feature require a new backing type? A new kind of graph? Does the public `Graph` interface need to change?"

2.  **Checkpoint 2 (The Interpreter)**: If the feature requires analysis or observation of the graph's structure, the first step is to ensure `src/internal/relation.ts` can correctly interpret it.

    - _Problem Solving_: "How does this new graph kind (e.g., reflexive) change the final set of vertices and edges? I need to modify `toRelation` to add self-loops for reflexive graphs."

3.  **Checkpoint 3 (The Engine)**: Once the interpreter is ready, implement the core runtime logic in `src/internal/algebraic.ts`.

    - _Problem Solving_: "Does this feature require a new method on the `GraphProto`? How does the `makeGraph` factory need to change to support this new kind?"

4.  **Checkpoint 4 (The Public API)**: Expose the new functionality through a clean, well-documented, and pipeable function in `src/Graph.ts`.

    - _Problem Solving_: "What is the most ergonomic API for the user? Should this function take an `Equivalence` parameter? Should it return an `Option`? How should it be documented?"

5.  **Checkpoint 5 (Verification)**: This step is non-negotiable.
    - If you changed the algebra, you **must** add a new property-based test to `test/laws.test.ts`.
    - You **must** add unit tests for your new public API function in `test/Graph.test.ts`.
    - _Problem Solving_: "What property must hold true for all graphs for my new feature to be correct? I will write a `fast-check` property to verify this against 10,000 random graphs."

By following this guide, you will be able to contribute to the Algebraic Graphs project in a way that is consistent, correct, and aligned with the deep principles of both modern functional programming and the Effect-TS ecosystem. Welcome aboard.

# Style And Workflow

The architecture is set, and the principles are clear. Now, we must define the _process_. A project of this nature, where mathematical rigor meets production engineering, demands a workflow that is equally rigorous and principled.

Here is the strategic document detailing our workflow optimizations and routines. This is our "how"—a guide to navigating complexity, ensuring correctness at every step, and iteratively building this library with precision.

---

### **The Algebraic Development Workflow: A Principled Implementation Strategy**

This document outlines the routine for all development on the Algebraic Graphs library. It is not a rigid set of rules but a collection of coherent heuristics designed to manage complexity and ensure our output is always verifiable, precise, and true to our core design principles.

Our central metaphor is **Development as Graph Traversal**. Every task, from fixing a bug to adding a new feature, can be seen as identifying and correctly constructing a subgraph within the larger project graph.

- **Nodes**: The artifacts we create (types, functions, tests, documentation).
- **Edges**: The dependencies and relationships between them (implementation, verification, explanation).

Our goal is to ensure this graph is always **well-formed** (correct) and **acyclic** (logically structured).

---

### **The Core Routine: A 4-Phase Iterative Cycle**

Every development task, regardless of size, will follow this four-phase cycle. This is our traversal algorithm for the project graph.

#### **Phase 1: Decomposition (Defining the Target Subgraph)**

Before a single line of code is written, we must understand the scope of the change.

1.  **Identify the Goal Node**: Start with a clear, concise statement of the objective. This is the primary node you want to add to the graph.

    - _Example Goal_: "Implement the `transpose` function, which reverses the direction of all edges in a graph."

2.  **Backwards Dependency Traversal**: From the goal node, trace its dependencies _backwards_. Ask "What is needed to support this?" This process identifies all the nodes that will be part of your work.

    - **API Node**: `Graph.ts` needs a public `transpose` function signature.
    - **Implementation Node**: We need an internal function that can recursively traverse a `GraphBacking` expression tree. This function must know how to handle each variant (`IEmpty`, `IVertex`, `IOverlay`, `IConnect`). For the `IConnect` case, it will swap the `left` and `right` operands.
    - **Verification Node**: The most critical dependency is proof of correctness. From Mokhov's paper, we know the key property of `transpose` is that it is an involution: `transpose(transpose(g))` must equal `g`. This defines our primary test case.
    - **Documentation Node**: The public API function needs a JSDoc comment explaining what it does, its complexity, and referencing the involution property.

3.  **Finalize the Subgraph**: You have now defined the complete scope of your work: one public function, one internal recursive helper, one property-based test, and one JSDoc block. This isolated subgraph is your checkpoint.

#### **Phase 2: Principled Implementation (Constructing the Nodes)**

With a clear subgraph defined, construction begins, strictly following the dependency order (a topological sort of your subgraph).

1.  **Types First (`core.ts`)**: Does the change require new types or modifications to existing interfaces? If so, this is always the first step. (For our `transpose` example, no changes are needed here).

2.  **Internal Logic First (`internal/*.ts`)**: Implement the core logic. This is the engine of the feature.

    - _Example (`transpose`)_: Implement the recursive helper in `internal/algebraic.ts`. It will be a function `g => makeGraph(transformBacking(g.backing), g.kind)` where `transformBacking` is a `switch` statement that rebuilds the graph expression, crucially swapping `left` and `right` in the `IConnect` case.

3.  **Public API Last (`Graph.ts`)**: Implement the public function. Often, this is just a thin wrapper around the internal logic, ensuring it's pipeable with `dual`.

4.  **Continuous Re-evaluation (The Heuristic Checks)**: At every step of implementation, you must pause and verify against our core principles:
    - **The Mokhov Heuristic**: Does this code introduce a partial function? Does it violate an axiom? (e.g., "My `transpose` implementation must not throw an error on an empty graph.")
    - **The Effect Heuristic**: Is this function pure? Is the data structure treated as immutable? Is error handling (if any) managed with `Option` or `Either`? (e.g., "My implementation returns a _new_ graph instance, it does not mutate the original.")
    - **The `Equivalence` Heuristic**: Does this operation depend on the equality of vertices? If yes, it _must_ be parameterized by an `Equivalence<A>` instance. (e.g., "`transpose` only cares about structure, so it does not need an `Equivalence` parameter.")

#### **Phase 3: Rigorous Verification (Certifying the Subgraph)**

Implementation is not complete until it is proven correct. Testing is the process of certifying that the subgraph you've built is well-formed.

1.  **Certify the Logic (`relation.test.ts` / `Graph.test.ts`)**:

    - **What**: Write unit tests for the new functionality against concrete, simple examples.
    - **Why**: This provides a fast feedback loop and confirms the basic, expected behavior of the implementation.
    - **How**: For `transpose(edge(1, 2))`, use `toRelation` to check that the resulting graph has the edge `(2, 1)`.

2.  **Certify the Mathematics (`laws.test.ts`)**:
    - **What**: Write a property-based test that verifies the core mathematical property of your feature.
    - **Why**: This is the highest level of confidence. It proves your implementation is correct for _all possible graphs_, not just the few you thought of. This is the essence of our commitment to mathematical rigor.
    - **How**: Use `fast-check` to create an `arbitrary` for graphs. For `transpose`, the property is: `fc.assert(property(graphArb, g => equals(transpose(transpose(g)), g, E)))`.

#### **Phase 4: Documentation (Annotating the Graph for Others)**

Code is not complete until it is explained. Every new node in our project graph must be documented.

1.  **JSDoc Referencing**: Your documentation should link back to the principles.

    - _Example (`transpose`)_: The JSDoc for `transpose` should explicitly mention that it is an involution and that `transpose(transpose(g))` is equivalent to `g`. This connects the code directly to its mathematical foundation.

2.  **Examples (`/examples`)**: If the new feature introduces a new pattern or is particularly powerful, add a clear, concise example to the `examples` directory. This shows users _how_ to use the feature in a practical context.

3.  **Checkpoints and Iteration**: Each completed 4-phase cycle for a given subgraph constitutes a verifiable checkpoint. This allows us to build the library iteratively, with each new feature being a well-formed, verified, and documented addition to the whole. This process transforms complexity into a manageable series of precise, verifiable steps.

## Master's Notes on the Algebraic Development Workflow

As we stand at the precipice of implementation, having traversed the theoretical heights of our design journey, this workflow document represents the crystallisation of methodological wisdom gained through decades of mathematical software engineering. Allow me to annotate this remarkable guide with insights that will elevate your implementation from merely correct to truly exceptional.

### On the Central Metaphor: Development as Graph Traversal

The choice of graph traversal as our guiding metaphor is not merely poetic—it's profoundly practical. This recursive self-reference (using graph theory to build a graph library) creates a powerful cognitive framework that reinforces our algebraic thinking at every step.

**Additional Consideration**: Consider maintaining an actual graph representation of your development progress. Each completed subgraph becomes a vertex in a meta-graph of project evolution. This isn't merely documentation—it's a living proof of the library's construction correctness.

### Phase 1 Enhancements: Decomposition as Algebraic Analysis

The backwards dependency traversal is brilliant, but I propose an additional heuristic: **The Algebraic Decomposition Check**.

Before defining any subgraph, ask:

1. Can this feature be expressed using only our four primitives?
2. If not, does it represent a fundamental limitation of the algebra, or merely a convenience function?

**Example**: When implementing `transpose`, we must first prove it's expressible algebraically:

```
transpose(empty) = empty
transpose(vertex(a)) = vertex(a)
transpose(overlay(g1, g2)) = overlay(transpose(g1), transpose(g2))
transpose(connect(g1, g2)) = connect(transpose(g2), transpose(g1))
```

This algebraic definition _is_ the specification. The implementation merely translates it to code.

### Phase 2 Refinements: The Types-Algebra-Code Trinity

Your "Types First" principle is sound, but I suggest a more nuanced approach: **The Trinity Pattern**.

1. **Types** (What can exist)
2. **Algebra** (How things relate)
3. **Code** (The mechanical translation)

**Critical Addition**: Between types and implementation, always write the algebraic specification as comments:

```typescript
// Algebraic specification for transpose:
// transpose :: Graph a -> Graph a
// transpose ε = ε
// transpose (v x) = v x
// transpose (g₁ + g₂) = transpose g₁ + transpose g₂
// transpose (g₁ → g₂) = transpose g₂ → transpose g₁
const transposeImpl = <A>(backing: GraphBacking<A>): GraphBacking<A> => {
  switch (backing._tag) {
    case "Empty":
      return backing
    case "Vertex":
      return backing
    case "Overlay":
      return {
        _tag: "Overlay",
        left: makeGraph(transposeImpl(backing.left.backing)),
        right: makeGraph(transposeImpl(backing.right.backing))
      }
    case "Connect":
      return {
        _tag: "Connect",
        left: makeGraph(transposeImpl(backing.right.backing)), // Note the swap
        right: makeGraph(transposeImpl(backing.left.backing))
      }
  }
}
```

### Phase 3 Augmentations: Verification as Mathematical Proof

Your verification strategy is exemplary, but consider this enhancement: **The Proof Hierarchy**.

1. **Constructive Proofs** (Unit tests with specific examples)
2. **Universal Proofs** (Property-based tests)
3. **Metamathematical Proofs** (Tests that verify the tests)

**Novel Addition**: For each algebraic property, create a "proof witness" test:

```typescript
// This test doesn't just verify transpose works—it verifies our
// understanding of what transpose means algebraically
describe("Transpose Algebraic Properties", () => {
  test("transpose is self-inverse (involution)", () => {
    fc.assert(
      fc.property(graphArb, (g) => {
        const once = transpose(g)
        const twice = transpose(once)
        return equals(g, twice, Equivalence.equals())
      })
    )
  })

  test("transpose preserves graph size", () => {
    fc.assert(
      fc.property(graphArb, (g) => {
        const original = toRelation(g, Equivalence.equals())
        const transposed = toRelation(transpose(g), Equivalence.equals())
        return (
          HashSet.size(original.vertices) ===
            HashSet.size(transposed.vertices) &&
          HashSet.size(original.edges) === HashSet.size(transposed.edges)
        )
      })
    )
  })
})
```

### Phase 4 Elaborations: Documentation as Formal Specification

Documentation isn't merely explanation—it's formal specification in natural language. I propose the **Four Pillars of Mathematical Documentation**:

1. **Definition** (What it is algebraically)
2. **Properties** (What laws it satisfies)
3. **Complexity** (Time and space characteristics)
4. **Relationships** (How it interacts with other operations)

**Template Enhancement**:

````typescript
/**
 * Reverses the direction of all edges in a graph.
 *
 * **Algebraic Definition**:
 * - transpose(empty) = empty
 * - transpose(vertex(x)) = vertex(x)
 * - transpose(g₁ + g₂) = transpose(g₁) + transpose(g₂)
 * - transpose(g₁ → g₂) = transpose(g₂) → transpose(g₁)
 *
 * **Properties**:
 * - Involution: transpose(transpose(g)) = g
 * - Preserves vertex set: vertices(transpose(g)) = vertices(g)
 * - Reverses edge set: edges(transpose(g)) = {(b,a) | (a,b) ∈ edges(g)}
 *
 * **Complexity**: O(n) where n is the size of the algebraic expression
 *
 * **Relationships**:
 * - transpose(undirected(g)) = undirected(g) (undirected graphs are self-transpose)
 * - transpose(path(a,b,c)) = path(c,b,a)
 *
 * @since 1.0.0
 * @category transformations
 * @example
 * ```ts
 * import { edge, transpose } from "@effect/graph"
 *
 * const forward = edge(1, 2)  // 1 → 2
 * const backward = transpose(forward)  // 2 → 1
 * ```
 */
export const transpose: <A>(graph: Graph<A>) => Graph<A>
````

### Workflow Optimisation: The Checkpoint Journal

Maintain a **Checkpoint Journal**—a formal record of each development cycle:

```markdown
## Checkpoint: Transpose Implementation

**Date**: 2024-01-15
**Goal Node**: Implement graph edge reversal
**Subgraph Nodes**:

- transpose function (Graph.ts)
- transposeImpl helper (internal/algebraic.ts)
- involution property test (laws.test.ts)
- size preservation test (Graph.test.ts)

**Algebraic Verification**: ✓ Expressed using only primitives
**Effect Compliance**: ✓ Pure, immutable, no Equivalence needed
**Mathematical Properties**: ✓ Involution verified for 10,000 cases
**Documentation**: ✓ Complete with algebraic definition

**Insights**: The Connect case swap emerged naturally from the algebra.
No special handling needed for empty/vertex cases.
```

### Style Refinements: The Newcastle Academic Voice

Your communication should embody the precision of Northumbrian engineering tradition whilst maintaining the warmth of academic mentorship:

1. **Lead with Mathematics**: "The algebraic structure suggests..." rather than "I think we should..."
2. **Cite Liberally**: Every design decision should reference either Mokhov, Effect patterns, or established graph theory
3. **Embrace Formalism**: Use mathematical notation in comments where it clarifies
4. **Question Assumptions**: "Does this operation preserve the graph homomorphism?" should be a reflexive question

### Final Wisdom: The Recursive Nature of Excellence

This workflow itself exhibits the properties we seek in our implementation:

- **Composable**: Each phase can be applied recursively to subproblems
- **Verifiable**: Each checkpoint produces testable artifacts
- **Pure**: No phase depends on hidden state or context
- **Total**: Every phase produces a definite outcome

Remember: we're not merely implementing a library—we're encoding mathematical truth in executable form. This workflow ensures that every line of code we write is a theorem, every test a proof, and every documentation block a mathematical treatise.

May your implementation journey be as rigorous as it is rewarding. The cathedral of algebraic graphs awaits its construction through these principled methods.

_Fortuna audaces iuvat in mathematica_ - Fortune favours the bold in mathematics.
