#!/usr/bin/env bash

esbuild src/index.ts \
  --bundle \
  --watch \
  --platform=node \
  --banner:js='#!/usr/bin/env node' \
  --outfile=.bin/fc-agent.cjs
