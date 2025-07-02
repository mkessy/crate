Of course. Here is a more comprehensive, expanded decision graph designed to cover every pattern in the repository. It's structured to guide you from a high-level problem statement to a specific, actionable solution grounded in the provided rules.

---

## ⚡️ The Comprehensive Effect-TS Troubleshooting Graph ⚡️

This graph is your interactive guide to solving common problems in Effect. Start with the category that best matches your issue, then follow the questions to pinpoint the right pattern and solution.

---

### **Part 1: Core Concepts & Program Execution**

_My program isn't running, or I don't understand how to run it._

- **Is your code executing at all?**

  - **NO** → You've likely only defined the `Effect` blueprint. Effects are lazy and do nothing until you explicitly run them at the "end of the world."
    - **Action**: Pass your final `Effect` to a runtime executor.
    - **Docs Search**: `effects-are-lazy`, `execute-with-runpromise`, `execute-with-runsync`

- **How should you run your `Effect`?**

  - **Is it a simple script or a one-off task?** →
    - If it contains **asynchronous** operations (like network requests or delays), use **`Effect.runPromise`**.
      - **Docs Search**: `execute-with-runpromise`
    - If it's purely **synchronous**, use **`Effect.runSync`**. It's faster but will throw an error if it encounters any async code.
      - **Docs Search**: `execute-with-runsync`
  - **Is it a long-running application, like a server or a daemon?** → You need to manage its lifecycle.
    - **Action**: Use **`Effect.runFork`**. This starts the app in a background fiber and gives you a handle to manage it (e.g., for graceful shutdown).
    - **Docs Search**: `execute-long-running-apps-with-runfork`, `implement-graceful-shutdown`

- **How do you create a basic `Effect` from a value you already have?**

  - **Action**: To lift a value into the success channel, use **`Effect.succeed(value)`**. To lift an error, use **`Effect.fail(error)`**.
  - **Docs Search**: `create-pre-resolved-effect`

- **Why use `Effect` instead of `Promise`?**
  - **Problem**: Promises have untyped errors, no dependency injection, and no cancellation.
    - **Solution**: `Effect` solves these with its three channels: `A` (Success), `E` (Typed Errors), and `R` (Requirements/Dependencies).
    - **Docs Search**: `solve-promise-problems-with-effect`, `understand-effect-channels`

---

### **Part 2: Code Structure & Readability**

_My code is becoming difficult to read, reason about, or maintain._

- **Do you have long chains of `.pipe(Effect.flatMap(...))`?**

  - **YES** → This "callback hell" is hard to read and pass state through.
    - **Action**: Refactor using **`Effect.gen`**. This provides a flat, sequential, `async/await`-like style that is much cleaner.
    - **Docs Search**: `write-sequential-code-with-gen`, `use-gen-for-business-logic`, `avoid-long-andthen-chains`

- **Is your logic full of nested function calls like `Effect.map(Effect.succeed(...))`?**

  - **YES** → This inverted style is hard to follow.
    - **Action**: Use the **`.pipe()`** method to create a clean, top-to-bottom flow of transformations.
    - **Docs Search**: `use-pipe-for-composition`, `transform-effect-values`

- **Do you have simple `if/else` logic inside an `Effect.flatMap`?**
  - **YES** → This can be verbose. Effect has dedicated combinators for conditional logic.
    - **Action**: For simple branches, use **`Effect.if`**, **`Effect.when`**, or **`Effect.cond`** to keep the logic declarative and inside your pipe.
    - **Docs Search**: `control-flow-with-combinators`, `conditionally-branching-workflows`

---

### **Part 3: Dependency Injection & Services (Context & Layer)**

_I'm struggling with managing dependencies like database clients, loggers, or API services._

- **Are you manually creating and passing classes/objects to your functions?**

  - **YES** → This is manual dependency injection ("prop drilling") and leads to tightly-coupled, untestable code.
    - **Action**:
      1.  Model every dependency as a **`Service`**.
      2.  Provide its implementation via a **`Layer`** at the top level of your app.
      3.  Access the service from the `Context` anywhere it's needed.
    - **Docs Search**: `model-dependencies-as-services`, `understand-layers-for-dependency-injection`, `provide-dependencies-to-routes`

- **How do you add a feature like caching or metrics to an existing service without modifying its code?**

  - **Problem**: You want to add cross-cutting concerns cleanly.
    - **Action**: Use the **Wrapper Layer** pattern. Create a new layer that _requires_ the original service, and in its implementation, call the original service's methods while adding your new logic around them.
    - **Docs Search**: `add-caching-by-wrapping-a-layer`

- **Is your app slow to start or handle requests because it's rebuilding layers?**
  - **YES** → For long-running apps, you should only build the dependency graph once.
    - **Action**: At application startup, compile your `AppLayer` into a reusable **`Runtime`** using **`Layer.toRuntime()`**. Use this single runtime to execute all incoming requests.
    - **Docs Search**: `create-reusable-runtime-from-layers`, `build-a-basic-http-server`

---

### **Part 4: Application Configuration**

_My application's configuration is messy, unsafe, or hard to test._

- **Are you accessing `process.env` directly in your business logic?**

  - **YES** → This is not type-safe and scatters configuration access everywhere.
    - **Action**: Define a **`Config` schema** at the top level of your application using functions like `Config.string` and `Config.number`.
    - **Docs Search**: `define-config-schema`

- **How do you make your `Config` schema available to the rest of the app?**

  - **Action**: Convert your `Config` schema into a **`Layer`** using **`Config.layer(myConfig)`**. Provide this layer to your application.
  - **Docs Search**: `provide-config-layer`

- **How do you _use_ the configuration values inside your logic?**
  - **Action**: Inside an `Effect.gen` block, simply `yield*` your `Config` object (e.g., `const config = yield* MyConfig;`). Effect will resolve it from the context.
  - **Docs Search**: `access-config-in-context`

---

### **Part 5: Error Handling & Resilience**

_My application is brittle and crashes on errors._

- **Are you using generic `Error` objects or strings in `Effect.fail()`?**

  - **YES** → This loses all type information, making it impossible to handle different errors in different ways.
    - **Action**: Define custom, type-safe errors by extending **`Data.TaggedError`**. This gives each error a unique `_tag`.
    - **Docs Search**: `define-tagged-errors`

- **How do you recover from specific, typed errors?**

  - **Action**: Use **`Effect.catchTag("MyError", (e) => ...)`** to handle a specific tagged error. Use `Effect.catchAll` as a last resort for any failure.
  - **Docs Search**: `handle-errors-with-catch`

- **Is "user not found" a true, catastrophic error?**

  - **NO** → A "not found" case is often a normal part of application flow. Conflating it with real errors (like a database connection failure) makes logic messy.
    - **Action**: For functions that can find nothing, return an **`Effect<Option<A>>`**. Use `Effect.succeed(Option.none())` for the "not found" case and reserve the `E` channel for real failures.
    - **Docs Search**: `distinguish-not-found-from-errors`, `model-optional-values-with-option`

- **How do you automatically retry a flaky network request?**

  - **Action**: Use **`Effect.retry(mySchedule)`**. You can build complex retry policies (e.g., exponential backoff) with the `Schedule` module.
  - **Docs Search**: `handle-flaky-operations-with-retry-timeout`, `retry-based-on-specific-errors`, `control-repetition-with-schedule`

- **How do you distinguish between an expected failure (`Fail`) and a critical bug (`Die`)?**
  - **Problem**: `Effect.catchAll` treats both the same, potentially hiding bugs.
    - **Action**: Use **`Effect.catchAllCause`** to inspect the `Cause` of the failure. You can then check `Cause.isDie(cause)` to identify and handle unexpected defects differently (e.g., log a fatal error).
    - **Docs Search**: `handle-unexpected-errors-with-cause`

---

### **Part 6: Data Modeling & Validation**

_I need to work with data safely and expressively._

- **Is your code full of checks like `if (user.email.includes('@'))`?**

  - **YES** → You have "primitive obsession." A `string` is not an `Email`.
    - **Action**: Create validated domain types using **`Brand`**. This ensures that once a value like `Email` is created, it's guaranteed to be valid throughout your application.
    - **Docs Search**: `model-validated-domain-types-with-brand`

- **How do you parse and validate unknown data (e.g., from an API response)?**

  - **Action**: Define your expected data shape using **`Schema`**. Then, use **`Schema.decode(MySchema)(unknownData)`**, which returns an `Effect` that either succeeds with your typed data or fails with a `ParseError`.
  - **Docs Search**: `define-contracts-with-schema`, `parse-with-schema-decode`

- **How do you convert data during validation (e.g., a date `string` into a `Date` object)?**

  - **Action**: Use **`Schema.transform`** or **`Schema.transformOrFail`**. This integrates the data conversion directly into the parsing step, keeping your domain model clean.
  - **Docs Search**: `transform-data-with-schema`

- **Does `obj1 === obj2` return `false` even though they have the same values?**
  - **YES** → You're comparing by reference, not by value.
    - **Action**: Define your data structures with **`Data.struct`** or **`Data.Class`**, and compare them with **`Equal.equals(a, b)`**.
    - **Docs Search**: `comparing-data-by-value-with-structural-equality`

---

### **Part 7: Time & Scheduling**

_I need to work with time in a safe and testable way._

- **Are you using `Date.now()` or `new Date()` in your logic?**

  - **YES** → This makes your code impure and untestable.
    - **Action**: Depend on the **`Clock` service**. Use `Clock.currentTimeMillis` to get the time. In tests, you can provide the `TestClock` to control time precisely.
    - **Docs Search**: `accessing-current-time-with-clock`, `beyond-the-date-type`

- **Are you passing timeouts as raw numbers (e.g., `2000`)?**
  - **YES** → This is ambiguous. Is it 2000 milliseconds or seconds?
    - **Action**: Use the **`Duration`** data type for all time intervals (e.g., `Duration.seconds(2)`).
    - **Docs Search**: `representing-time-spans-with-duration`

---

### **Part 8: Concurrency & State Management**

_I'm building a concurrent application and facing race conditions or complexity._

- **How do you run a task in the background without blocking?**

  - **Action**: Use **`Effect.fork`**. This starts the effect on a new, lightweight **`Fiber`** (a virtual thread) and immediately returns control to the parent.
  - **Docs Search**: `run-background-tasks-with-fork`, `understand-fibers-as-lightweight-threads`

- **How do you safely share and update state between concurrent fibers?**

  - **Problem**: Using a mutable `let` variable will cause race conditions.
    - **Action**: Use **`Ref`**. It provides a fiber-safe, atomic reference for shared mutable state.
    - **Docs Search**: `manage-shared-state-with-ref`

- **How do you distribute work to a pool of consumers or broadcast events?**
  - **Problem**: You need safe, decoupled communication between fibers.
    - **Action**:
      - For point-to-point work distribution (one producer, one consumer), use a **`Queue`**.
      - For broadcasting events to multiple subscribers, use **`PubSub`**.
    - **Docs Search**: `decouple-fibers-with-queue-pubsub`

---

### **Part 9: Data Pipelines (Stream)**

_I need to process a sequence of data efficiently._

- **How do you start a data pipeline?**

  - **From a simple array?** → `Stream.fromIterable`
  - **From a large file?** → `Stream.fromReadable`
  - **From a paginated API?** → `Stream.paginateEffect`
  - **Docs Search**: `stream-from-iterable`, `stream-from-file`, `stream-from-paginated-api`

- **How do you perform an async action for each item in the stream?**

  - **Action**: Use **`Stream.mapEffect`**. To improve performance, use the `{ concurrency: N }` option to process items in parallel.
  - **Docs Search**: `stream-process-concurrently`, `process-a-collection-of-data-asynchronously`

- **How do you process items in batches (e.g., for bulk database inserts)?**

  - **Action**: Use **`Stream.grouped(batchSize)`** to transform a stream of items into a stream of `Chunk`s.
  - **Docs Search**: `stream-process-in-batches`

- **How do you run the pipeline?**

  - **To get all results in an array?** → `Stream.runCollect` (Warning: only for finite streams that fit in memory).
  - **For its side effects only?** → `Stream.runDrain` (Safe for large or infinite streams).
  - **Docs Search**: `stream-collect-results`, `stream-run-for-effects`

- **How do you ensure resources (like file handles) are cleaned up, even if the stream fails?**
  - **Action**: Use **`Stream.acquireRelease`**. It guarantees the release effect is always called.
  - **Docs Search**: `stream-manage-resources`, `stream-retry-on-failure`

---

### **Part 10: Building APIs (@effect/platform)**

_I'm building an HTTP server and need to handle requests._

- **How do you start a server?**

  - **Action**: Define your app logic (`Http.App`) and run it with `Http.server.serve`, providing a platform layer like `NodeHttpServer.layer`.
  - **Docs Search**: `launch-http-server`

- **How do you handle a `GET` request for `/users/:id`?**

  - **Action**: Use **`Http.router.get("/users/:id", handler)`**. The router will parse `id` from the path and make it available on the request object.
  - **Docs Search**: `handle-get-request`, `extract-path-parameters`

- **How do you handle a `POST` request with a JSON body?**

  - **Action**: Define a `Schema` for your body and use **`Http.request.schemaBodyJson(MySchema)`**. This parses, validates, and types the body in one step, automatically returning a `400` error on failure.
  - **Docs Search**: `validate-request-body`

- **How do you send a JSON response?**

  - **Action**: Use the **`Http.response.json(data)`** helper. It automatically stringifies the data and sets the correct `Content-Type` header.
  - **Docs Search**: `send-json-response`

- **How does your API call another API?**
  - **Action**: Use the built-in **`Http.client`**. It is fully integrated with Effect's runtime, providing cancellability and typed errors, unlike a raw `fetch`.
  - **Docs Search**: `make-http-client-request`

---

### **Part 11: Observability & Tooling**

_I need to understand what my application is doing in production or improve my developer experience._

- **How do you add logging?** → Use **`Effect.log`**, **`Effect.logInfo`**, etc. It's structured and context-aware. (Docs: `leverage-structured-logging`)
- **How do you add metrics (counters, gauges)?** → Use the **`Metric`** module. (Docs: `add-custom-metrics`)
- **How do you trace performance bottlenecks?** → Wrap key operations with **`Effect.withSpan("my-operation")`**. (Docs: `trace-operations-with-spans`)
- **How do you improve the type information in your editor?** → Install the **Effect LSP** extension for VS Code. (Docs: `supercharge-your-editor-with-the-effect-lsp`)
- **How do you give an AI coding agent (like Cursor) context about your app?** → Run the **Effect MCP Server**. (Docs: `teach-your-ai-agents-effect-with-the-mcp-server`)
