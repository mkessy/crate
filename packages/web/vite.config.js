"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var plugin_react_1 = require("@vitejs/plugin-react");
var path_1 = require("path");
var vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    resolve: {
        alias: {
            "@": (0, path_1.resolve)(__dirname, "./src"),
            "@crate/domain": (0, path_1.resolve)(__dirname, "../domain/src")
        }
    },
    server: {
        port: 3001,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ""); }
            }
        }
    }
});
