// packages/web/src/hooks/useService.ts
import type { Context, ManagedRuntime } from "effect"
import { Effect } from "effect"
import { useMemo } from "react"
import { AppRuntime } from "../services/AppRuntime.js"

// Hook to access a service from the runtime
export function useService<I, S>(tag: Context.Tag<I, S>): S {
  const runtime: ManagedRuntime.ManagedRuntime<I, S> = AppRuntime.useRuntime()

  return useMemo(() => {
    // To extract a service from ManagedRuntime, we need to run an effect
    // that accesses the service through the tag
    return runtime.runSync(Effect.flatMap(tag, (service) => Effect.succeed(service)))
  }, [runtime, tag])
}
