#!/usr/bin/env bash

rimraf .bin
esbuild src/index.ts --bundle --platform=node --banner:js='#!/usr/bin/env node'  --outfile=.bin/fc-agent.cjs
chmod 755 .bin/fc-agent.cjs
