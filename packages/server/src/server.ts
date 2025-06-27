import { DomainConfigLive } from "@crate/domain/src/config/DomainConfig.js"
import { HttpApiBuilder, HttpApiSwagger, HttpMiddleware } from "@effect/platform"
import { BunHttpServer, BunRuntime } from "@effect/platform-bun"
import { ConfigProvider, Layer } from "effect"
import * as API from "./api/index.js"

const HttpLive = Layer.setConfigProvider(ConfigProvider.fromEnv()).pipe(
  Layer.provide(HttpApiBuilder.serve(HttpMiddleware.logger)),
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(API.LayerAPI),
  Layer.provide(BunHttpServer.layer({ port: 3000 })),
  Layer.provide(DomainConfigLive),
  Layer.provide(Layer.scope)
)

Layer.launch(HttpLive).pipe(
  BunRuntime.runMain
)
