# Claude Coding Agent Rules: Effect Ecosystem

## 🧠 Meta Directives

You are working within a codebase that uses the [Effect](https://effect.website) platform and its ecosystem libraries (`@effect/platform`, `@effect/schema`, `@effect/data`, etc). Your task is to assist in writing, refactoring, and debugging code idiomatically and robustly using the _Effect way_ of doing things.

**You must not use intuition or general software engineering habits when implementing logic. You must always check for Effect-specific patterns, idioms, and constraints.**

---

## 📚 Canonical References (Local)

You are expected to **consult the following local documentation files before making any implementation decisions**:

- `effect_rules.md`: _GREP SEARCH HERE FIRST_ Implementation patterns, architectural rules, composition styles.
- `schema.md`: Canonical usage of `@effect/schema`, transformations, validation.
- `data.md`: Usage of `@effect/data`, immutability, pattern matching, utility types.
- `troubleshooting.md`: \_GREP_SEARCH_HERE_FOR_IMPROVEMENT_AND_FIXES_Decision graph for debugging, problem solving, idiomatic fixes.

All are located in: `/Users/pooks/Dev/crate/packages/claude_effect_docs/`

You may reference them directly in your replies by filename and section if needed.

---

## ✅ Operational Principles

You must follow these core behavioral rules at all times:

1. **Reflexive Lookup**: Before starting to code, thoroughly scan `effect_rules.md` for relevant patterns, constraints, and idioms.
2. **Cross-Check Plans**: If you're asked to produce a plan, list, or sequence of tasks, you must cross-check that plan with the `effect_rules.md` document for alignment with established best practices.
3. **Use the Troubleshooting Guide**: Whenever you are stuck, encounter ambiguity, or need to decide between approaches, consult `troubleshooting.md` and explain which path you chose and why.
4. **Assume Nothing**: Never assume you understand how to write correct Effect code unless explicitly shown in the documentation. Always defer to the documentation.
5. **No Overbuilding**: Always implement the smallest, simplest, narrowest, most testable unit of behavior. Never build entire features or speculative abstractions.
6. **Immutability & Purity**: Default to immutability, referential transparency, and separation of construction vs execution.
7. **Functional Composition First**: Prefer declarative pipelines, combinators, and expressions over imperative logic or control flow.
8. **Schema is Law**: For any data boundary, use `@effect/schema` explicitly. Validate all inputs/outputs as first-class effects.
9. **Explain the Effect Way**: Where a decision is made, explain not only what but why that choice fits the "Effect way" over traditional practices.

---

## 🔬 Implementation Heuristics

- If unsure about whether a common utility (e.g., map, fold, parseInt) exists in Effect, check `@effect/data` or `@effect/schema` first.
- For error handling or retries, follow idioms in `troubleshooting.md`, not general JS/TS practices.
- For any I/O, concurrency, or system integration, review `@effect/platform` modules and search for canonical compositions.

---

## 🧾 Recap (TL;DR)

- You _must_ check `effect_rules.md` before every implementation.
- Cross-check all plans and refactors against `effect_rules.md`.
- Use `troubleshooting.md` reflexively to resolve ambiguity.
- Always ask: “What is the Effect-native way to solve this?”
- Implement the smallest, testable unit, and stop.

---

### Rule: access-config-in-context

> **Description:** Access configuration from the Effect context.
> **When to apply:** When your business logic needs access to configuration values, `yield` the `Config` object from within an `Effect.gen` block instead of passing values as props.

---

### Rule: accessing-current-time-with-clock

> **Description:** Use the Clock service to get the current time, enabling deterministic testing with TestClock.
> **When to apply:** Anywhere you would use `Date.now()` or `new Date()`, inject the `Clock` service and use `Clock.currentTimeMillis` to make your logic testable.

---

### Rule: accumulate-multiple-errors-with-either

> **Description:** Use Either to accumulate multiple validation errors instead of failing on the first one.
> **When to apply:** When validating user input or any data source where you want to report all errors at once, rather than short-circuiting on the first failure.

---

### Rule: add-caching-by-wrapping-a-layer

> **Description:** Use a wrapping Layer to add cross-cutting concerns like caching to a service without altering its original implementation.
> **When to apply:** When you need to add functionality like caching, logging, or metrics to an existing service without modifying its original source code.

---

### Rule: add-custom-metrics

> **Description:** Use Metric.counter, Metric.gauge, and Metric.histogram to instrument code for monitoring.
> **When to apply:** When you need to track the health, performance, or business KPIs of your application for dashboards and alerting.

---

### Rule: stream-retry-on-failure

> **Description:** Compose a Stream with the .retry(Schedule) operator to automatically recover from transient failures.
> **When to apply:** When your stream processes items using a fallible operation (like an API call) and you want the entire pipeline to automatically retry on transient errors.

---

### Rule: avoid-long-andthen-chains

> **Description:** Prefer generators over long chains of .andThen.
> **When to apply:** When your logic involves more than two sequential, dependent `Effect` operations, use `Effect.gen` to avoid nested `.flatMap` or `.andThen` calls.

---

### Rule: beyond-the-date-type

> **Description:** Use the Clock service for testable time-based logic and immutable primitives for timestamps.
> **When to apply:** When storing or passing timestamps, use a primitive `number` (UTC milliseconds) or `string` (ISO 8601) instead of a mutable `Date` object.

---

### Rule: build-a-basic-http-server

> **Description:** Use a managed Runtime created from a Layer to handle requests in a Node.js HTTP server.
> **When to apply:** When building a long-running application like an HTTP server, create a reusable `Runtime` from your `AppLayer` once at startup to efficiently handle all incoming requests.

---

### Rule: stream-collect-results

> **Description:** Use Stream.runCollect to execute a stream and collect all its emitted values into a Chunk.
> **When to apply:** When you need to terminate a stream pipeline and gather all of its results into an in-memory array. Use only if the dataset is small enough to fit in memory.

---

### Rule: comparing-data-by-value-with-structural-equality

> **Description:** Use Data.struct or implement the Equal interface for value-based comparison of objects and classes.
> **When to apply:** Whenever you need to compare two objects by their contents rather than their memory reference, especially in tests or when managing state.

---

### Rule: conditionally-branching-workflows

> **Description:** Use predicate-based operators like Effect.filter and Effect.if to declaratively control workflow branching.
> **When to apply:** When you need to make a decision based on the successful result of an effect within a `.pipe()` chain, use `Effect.filter` to fail or `Effect.if` to branch.

---

### Rule: control-flow-with-combinators

> **Description:** Use conditional combinators for control flow.
> **When to apply:** For simple conditional logic inside a pipe, prefer declarative combinators like `Effect.if` over a more verbose `Effect.gen` block.

---

### Rule: control-repetition-with-schedule

> **Description:** Use Schedule to create composable policies for controlling the repetition and retrying of effects.
> **When to apply:** When you need to run an effect repeatedly or retry it on failure, use `Effect.repeat` or `Effect.retry` with a `Schedule` to define the timing and conditions.

---

### Rule: launch-http-server

> **Description:** Use Http.server.serve with a platform-specific layer to run an HTTP application.
> **When to apply:** At the entry point of your web application, use `Http.server.serve(app)` and provide a platform-specific layer (e.g., `NodeHttpServer.layer`) to launch the server.

---

### Rule: create-managed-runtime-for-scoped-resources

> **Description:** Create a managed runtime for scoped resources.
> **When to apply:** When your application layer contains scoped resources (e.g., a database pool), use `Layer.launch` to run your effect, as it guarantees finalizers will be executed.

---

### Rule: create-reusable-runtime-from-layers

> **Description:** Create a reusable runtime from layers.
> **When to apply:** In a long-running application (like a web server), use `Layer.toRuntime` once at startup to create an efficient, reusable runtime for handling multiple requests.

---

### Rule: stream-from-iterable

> **Description:** Use Stream.fromIterable to begin a pipeline from an in-memory collection.
> **When to apply:** When you want to start a data processing pipeline from a simple in-memory array or list.

---

### Rule: create-a-testable-http-client-service

> **Description:** Define an HttpClient service with distinct Live and Test layers to enable testable API interactions.
> **When to apply:** When your application needs to make external API calls, abstract `fetch` into a service with `Live` and `Test` `Layer` implementations.

---

### Rule: create-pre-resolved-effect

> **Description:** Create pre-resolved effects with succeed and fail.
> **When to apply:** When you need to lift a value you already have into an `Effect`, use `Effect.succeed(value)` for success or `Effect.fail(error)` for a known failure.

---

### Rule: decouple-fibers-with-queue-pubsub

> **Description:** Use Queue for point-to-point work distribution and PubSub for broadcast messaging between fibers.
> **When to apply:** When you need to communicate between concurrent fibers, use `Queue` for distributing tasks to workers and `PubSub` for broadcasting events to multiple listeners.

---

### Rule: define-config-schema

> **Description:** Define a type-safe configuration schema.
> **When to apply:** Before accessing any environment variables, define a `Config` schema to ensure all required configuration is present, correctly typed, and from a declared source.

---

### Rule: define-contracts-with-schema

> **Description:** Define contracts upfront with schema.
> **When to apply:** Before writing implementation logic, define the shape of your data models and function signatures using `Schema` to create a single source of truth for types and runtime validation.

---

### Rule: define-tagged-errors

> **Description:** Define type-safe errors with Data.TaggedError.
> **When to apply:** For any distinct, recoverable failure mode in your application, create a custom error class extending `Data.TaggedError` instead of using generic `Error`s or strings.

---

### Rule: distinguish-not-found-from-errors

> **Description:** Use Effect\<Option\<A\>\> to distinguish between recoverable 'not found' cases and actual failures.
> **When to apply:** When a function can have three outcomes (success, failure, or simply not found), model the return type as `Effect<Option<A>>` to keep the error channel clean for true failures.

---

### Rule: execute-with-runpromise

> **Description:** Execute asynchronous effects with Effect.runPromise.
> **When to apply:** At the "end of the world" for an application or script that contains asynchronous operations, use `Effect.runPromise` to get the result as a `Promise`.

---

### Rule: execute-long-running-apps-with-runfork

> **Description:** Use Effect.runFork to launch a long-running application as a manageable, detached fiber.
> **When to apply:** To run a non-blocking, long-running process like a server or daemon, use `Effect.runFork` to get a `Fiber` you can use to manage its lifecycle (e.g., for graceful shutdown).

---

### Rule: execute-with-runsync

> **Description:** Execute synchronous effects with Effect.runSync.
> **When to apply:** At the "end of the world" for an application or script that is guaranteed to contain no asynchronous operations.

---

### Rule: extract-path-parameters

> **Description:** Define routes with colon-prefixed parameters (e.g., /users/:id) and access their values within the handler.
> **When to apply:** When building an API route that needs to capture a dynamic part of the URL, define it in the path string (e.g., `/users/:id`) and access it via `req.params.id`.

---

### Rule: handle-get-request

> **Description:** Use Http.router.get to associate a URL path with a specific response Effect.
> **When to apply:** When building an API, use `Http.router.get`, `Http.router.post`, etc., to map URL paths and methods to specific handler `Effect`s.

---

### Rule: handle-api-errors

> **Description:** Model application errors as typed classes and use Http.server.serveOptions to map them to specific HTTP responses.
> **When to apply:** To provide meaningful error responses to API clients, centralize error handling by using `Http.server.serveOptions` to map your domain's `TaggedError`s to specific HTTP status codes.

---

### Rule: handle-errors-with-catch

> **Description:** Handle errors with catchTag, catchTags, and catchAll.
> **When to apply:** To recover from failures, use `Effect.catchTag` to handle specific, known errors in a type-safe way, and `Effect.catchAll` to handle any potential failure.

---

### Rule: handle-flaky-operations-with-retry-timeout

> **Description:** Use Effect.retry and Effect.timeout to build resilience against slow or intermittently failing effects.
> **When to apply:** When interacting with any external service over a network, compose `Effect.timeout` (to prevent getting stuck) and `Effect.retry` (to handle transient failures).

---

### Rule: handle-unexpected-errors-with-cause

> **Description:** Handle unexpected errors by inspecting the cause.
> **When to apply:** When you need to build a truly resilient system, use `Effect.catchAllCause` to differentiate between expected failures (`Fail`) and unexpected bugs (`Die`), allowing you to handle them differently.

---

### Rule: implement-graceful-shutdown

> **Description:** Use Effect.runFork and OS signal listeners to implement graceful shutdown for long-running applications.
> **When to apply:** For any long-running application that manages resources (like database connections), ensure clean-up by launching with `Effect.runFork` and using OS signals to trigger `Fiber.interrupt`.

---

### Rule: leverage-structured-logging

> **Description:** Leverage Effect's built-in structured logging.
> **When to apply:** For all application logging, use the built-in `Effect.log*` functions instead of `console.log` to get structured, context-aware, and testable logs.

---

### Rule: make-http-client-request

> **Description:** Use the Http.client module to make outgoing requests to keep the entire operation within the Effect ecosystem.
> **When to apply:** When your API server needs to call another external API, use the `Http.client` module instead of a raw `fetch` to gain cancellability and typed errors.

---

### Rule: manage-resource-lifecycles-with-scope

> **Description:** Use Scope for fine-grained, manual control over resource lifecycles and cleanup guarantees.
> **When to apply:** When you need to ensure a resource's cleanup logic is always executed, use `Effect.acquireRelease` within an `Effect.scoped` block for guaranteed resource safety.

---

### Rule: stream-manage-resources

> **Description:** Use Stream.acquireRelease to safely manage the lifecycle of a resource within a pipeline.
> **When to apply:** When a data pipeline depends on a resource that must be opened and closed (like a file handle), use `Stream.acquireRelease` to guarantee cleanup, even if the stream fails.

---

### Rule: manage-shared-state-with-ref

> **Description:** Use Ref to manage shared, mutable state concurrently, ensuring atomicity.
> **When to apply:** When you need to share a mutable value between different concurrent fibers, use `Ref` to prevent race conditions.

---

### Rule: mapping-errors-to-fit-your-domain

> **Description:** Use Effect.mapError to transform errors and create clean architectural boundaries between layers.
> **When to apply:** When a service calls another service, use `Effect.mapError` to transform the inner service's specific errors into more generic errors suitable for the outer service's domain, preventing leaky abstractions.

---

### Rule: mocking-dependencies-in-tests

> **Description:** Provide mock service implementations via a test-specific Layer to isolate the unit under test.
> **When to apply:** In a unit test, identify the service dependencies of the code under test and provide mock implementations for them using a test-specific `Layer`.

---

### Rule: model-dependencies-as-services

> **Description:** Model dependencies as services.
> **When to apply:** Represent any external dependency or distinct capability (database, API client, random number generator) as a `Service` to enable easy mocking and improve testability.

---

### Rule: model-optional-values-with-option

> **Description:** Use Option\<A\> to explicitly model values that may be absent, avoiding null or undefined.
> **When to apply:** For any function or data field that might not have a value, use `Option<A>` instead of returning `null` or `undefined` to eliminate null-related runtime errors.

---

### Rule: model-validated-domain-types-with-brand

> **Description:** Model validated domain types with Brand.
> **When to apply:** When a primitive type has business rules (e.g., a string must be a valid email), create a `Brand<"Email">` to ensure only validated values can be used in your domain logic.

---

### Rule: organize-layers-into-composable-modules

> **Description:** Organize services into modular Layers that are composed hierarchically to manage complexity in large applications.
> **When to apply:** In a large application, avoid a single flat `AppLayer`. Instead, group related services into feature-module `Layer`s that are then composed together.

---

### Rule: parse-with-schema-decode

> **Description:** Parse and validate data with Schema.decode.
> **When to apply:** When you need to parse or validate unknown data against a `Schema`, use `Schema.decode(schema)` to get an `Effect` that integrates with type-safe error handling.

---

### Rule: poll-for-status-until-task-completes

> **Description:** Use Effect.race to run a repeating polling task that is automatically interrupted when a main task completes.
> **When to apply:** When you need to run a periodic polling task only for the duration of a main long-running job, use `Effect.race(mainJob, repeatingPoller)`.

---

### Rule: process-collection-in-parallel-with-foreach

> **Description:** Use Effect.forEach with the `concurrency` option to process a collection in parallel with a fixed limit.
> **When to apply:** When processing an array of items with an effectful function, use `Effect.forEach(items, fn, { concurrency: N })` to avoid overwhelming downstream services.

---

### Rule: stream-from-file

> **Description:** Use Stream.fromReadable with a Node.js Readable stream to process files efficiently.
> **When to apply:** To process a file that is too large to fit in memory, create a `Readable` stream from it and pipe it into an Effect `Stream` to maintain constant memory usage.

---

### Rule: process-a-collection-of-data-asynchronously

> **Description:** Leverage Stream to process collections effectfully with built-in concurrency control and resource safety.
> **When to apply:** For any collection processing that involves asynchronous or effectful operations, prefer using a `Stream` over array methods to gain concurrency control and resource safety.

---

### Rule: stream-process-concurrently

> **Description:** Use Stream.mapEffect with the `concurrency` option to process stream items in parallel.
> **When to apply:** To improve the performance of an I/O-bound stream pipeline, use `Stream.mapEffect(fn, { concurrency: N })` to process multiple items at once.

---

### Rule: stream-process-in-batches

> **Description:** Use Stream.grouped(n) to transform a stream of items into a stream of batched chunks.
> **When to apply:** When interacting with an API that supports bulk operations, use `Stream.grouped(n)` to batch items together for significantly better performance.

---

### Rule: process-streaming-data-with-stream

> **Description:** Use Stream to model and process data that arrives over time in a composable, efficient way.
> **When to apply:** When dealing with data that arrives as a sequence over time (e.g., paginated APIs, WebSockets, large file reads), model it as a `Stream`.

---

### Rule: provide-config-layer

> **Description:** Provide configuration to your app via a Layer.
> **When to apply:** After defining a `Config` schema, transform it into a `Layer` with `Config.layer` and provide it to your main application `Effect` to make it available contextually.

---

### Rule: provide-dependencies-to-routes

> **Description:** Define dependencies with Effect.Service and provide them to your HTTP server using a Layer.
> **When to apply:** When your HTTP route handlers need to access services like a database, provide the service's `Layer` to the `Http.server` effect.

---

### Rule: race-concurrent-effects

> **Description:** Use Effect.race to get the result from the first of several effects to succeed, automatically interrupting the losers.
> **When to apply:** When you have multiple effects that can produce the same result (e.g., querying redundant data sources) and you only need the fastest one.

---

### Rule: representing-time-spans-with-duration

> **Description:** Use the Duration data type to represent time intervals instead of raw numbers.
> **When to apply:** Whenever an API requires a time interval (for a delay, timeout, etc.), use `Duration` (e.g., `Duration.seconds(5)`) instead of a raw number to avoid ambiguity.

---

### Rule: retry-based-on-specific-errors

> **Description:** Use predicate-based retry policies to retry an operation only for specific, recoverable errors.
> **When to apply:** When you want to retry an operation, but only for transient errors (like a network timeout) and not for permanent ones (like "not found").

---

### Rule: stream-run-for-effects

> **Description:** Use Stream.runDrain to execute a stream for its side effects when you don't need the final values.
> **When to apply:** To run a stream purely for its side effects (e.g., writing to a database) without collecting results, use `Stream.runDrain`. This is memory-safe for very large or infinite streams.

---

### Rule: run-background-tasks-with-fork

> **Description:** Use Effect.fork to start a non-blocking background process and manage its lifecycle via its Fiber.
> **When to apply:** To start a computation in the background without blocking the current flow, use `Effect.fork`. This returns a `Fiber` that acts as a handle to the background task.

---

### Rule: run-effects-in-parallel-with-all

> **Description:** Use Effect.all to execute a collection of independent effects concurrently.
> **When to apply:** When you have multiple effects that do not depend on each other's results, run them with `Effect.all` to improve performance.

---

### Rule: send-json-response

> **Description:** Use Http.response.json to automatically serialize data structures into a JSON response.
> **When to apply:** When returning a JavaScript object from an API route, use `Http.response.json(data)` to ensure correct serialization and `Content-Type` headers.

---

### Rule: setup-new-project

> **Description:** Set up a new Effect project.
> **When to apply:** When starting a new project, ensure your `tsconfig.json` has `"strict": true` to leverage Effect's full type-safety guarantees.

---

### Rule: solve-promise-problems-with-effect

> **Description:** Recognize that Effect solves the core limitations of Promises: untyped errors, no dependency injection, and no cancellation.
> **When to apply:** When deciding whether to use a `Promise` or an `Effect`, choose `Effect` if you need typed errors, dependency injection, or built-in cancellation.

---

### Rule: supercharge-your-editor-with-the-effect-lsp

> **Description:** Install and use the Effect LSP extension for enhanced type information and error checking in your editor.
> **When to apply:** To improve your development experience, install the Effect Language Server extension for your editor to get rich, inline type information.

---

### Rule: teach-your-ai-agents-effect-with-the-mcp-server

> **Description:** Use the MCP server to provide live application context to AI coding agents, enabling more accurate assistance.
> **When to apply:** When working with an AI coding agent like Cursor, run the Effect MCP server to give the agent live, structural context about your application's services and layers.

---

### Rule: trace-operations-with-spans

> **Description:** Use Effect.withSpan to create custom tracing spans for important operations.
> **When to apply:** To gain visibility into your application's performance, wrap logical units of work (like a database query or API call) with `Effect.withSpan("span-name")`.

---

### Rule: transform-data-with-schema

> **Description:** Use Schema.transform to safely convert data types during the validation and parsing process.
> **When to apply:** When your incoming data format (e.g., a date string) differs from your desired domain model format (e.g., a `Date` object), use `Schema.transform` to handle the conversion during parsing.

---

### Rule: transform-effect-values

> **Description:** Transform Effect values with map and flatMap.
> **When to apply:** Use `Effect.map` for simple, synchronous transformations of an Effect's success value, and `Effect.flatMap` when your transformation function itself returns another `Effect`.

---

### Rule: stream-from-paginated-api

> **Description:** Use Stream.paginateEffect to model a paginated data source as a single, continuous stream.
> **When to apply:** To handle fetching data from a paginated API, use `Stream.paginateEffect` to abstract away the complexity of managing pages and tokens.

---

### Rule: understand-fibers-as-lightweight-threads

> **Description:** Understand that a Fiber is a lightweight, virtual thread managed by the Effect runtime for massive concurrency.
> **When to apply:** When designing concurrent applications, remember that `Fiber`s enable massive I/O concurrency but do not provide CPU-bound parallelism in a standard Node.js environment.

---

### Rule: understand-layers-for-dependency-injection

> **Description:** Understand that a Layer is a blueprint describing how to construct a service and its dependencies.
> **When to apply:** When providing a service, think in terms of `Layer`s, which are composable recipes for building dependencies, rather than creating service instances directly.

---

### Rule: effects-are-lazy

> **Description:** Understand that effects are lazy blueprints.
> **When to apply:** Remember that defining an `Effect` does not execute it. Nothing happens until you pass the final, composed effect to a runtime executor like `Effect.runPromise`.

---

### Rule: understand-effect-channels

> **Description:** Understand that an Effect\<A, E, R\> describes a computation with a success type (A), an error type (E), and a requirements type (R).
> **When to apply:** When reading or writing an Effect type signature, consider all three channels to understand what the effect produces (`A`), how it can fail (`E`), and what it needs to run (`R`).

---

### Rule: use-pipe-for-composition

> **Description:** Use .pipe for composition.
> **When to apply:** To apply a sequence of operations to an `Effect`, always use the `.pipe()` method to create a readable, top-to-bottom flow, avoiding nested function calls.

---

### Rule: use-chunk-for-high-performance-collections

> **Description:** Prefer Chunk over Array for immutable collection operations within data processing pipelines for better performance.
> **When to apply:** In data processing pipelines where you perform many immutable transformations on a collection, use `Chunk` instead of `Array` for better performance.

---

### Rule: use-gen-for-business-logic

> **Description:** Use Effect.gen for business logic.
> **When to apply:** For any business logic that involves multiple sequential or conditional steps, use `Effect.gen` to write clear, readable, and maintainable code.

---

### Rule: use-default-layer-for-tests

> **Description:** Use the auto-generated .Default layer in tests.
> **When to apply:** In tests, when providing a service defined with `class MyService extends Effect.Service`, use `Effect.provide(MyService.Default)` instead of creating a manual layer.

---

### Rule: validate-request-body

> **Description:** Use Http.request.schemaBodyJson with a Schema to automatically parse and validate request bodies.
> **When to apply:** When handling a `POST` or `PUT` request, use `Http.request.schemaBodyJson(YourSchema)` to safely parse, validate, and type the incoming request body in a single step.

---

### Rule: wrap-asynchronous-computations

> **Description:** Wrap asynchronous computations with tryPromise.
> **When to apply:** To safely integrate any function that returns a `Promise` (like `fetch`) into your Effect-based code, wrap it with `Effect.tryPromise`.

---

### Rule: wrap-synchronous-computations

> **Description:** Wrap synchronous computations with sync and try.
> **When to apply:** To integrate a synchronous side-effect, use `Effect.sync` for functions that won't throw, and `Effect.try` for functions that might throw (like `JSON.parse`).

---

### Rule: write-sequential-code-with-gen

> **Description:** Write sequential code with Effect.gen.
> **When to apply:** For operations that must happen in a specific order, with each step potentially depending on the last, use `Effect.gen` to write in a familiar, `async/await`-like style.

---

### Rule: write-tests-that-adapt-to-application-code

> **Description:** Write tests that adapt to application code.
> **When to apply:** When a test fails due to a change in the application's interface, always update the test to match the new interface. Never modify the application code solely to make a test pass.
