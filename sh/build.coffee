#!/usr/bin/env coffee

> esbuild > build
  @rmw/thisdir
  path > dirname

ROOT = dirname thisdir import.meta

build({
  absWorkingDir: ROOT
  bundle: true
  logLevel: "info"
  entryPoints: [
    "lib/index.js"
  ]
  outdir: ROOT
  #minify: true
  outExtension:
    '.js': '.mjs'
  format: "esm"
  target: "node18"
  platform: "node"
  banner:
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);"
}).catch =>
  process.exit(1)
