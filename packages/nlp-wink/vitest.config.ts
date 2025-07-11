import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    alias: {
      "@crate/domain": resolve(__dirname, "../domain/build/esm")
    }
  }
})
