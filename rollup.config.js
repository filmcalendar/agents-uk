import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import cleanup from 'rollup-plugin-cleanup';
import json from '@rollup/plugin-json';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: {
    file: '.bin/fc-agent',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
    compact: true,
  },
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    json(),
    typescript({
      typescript: require('typescript'),
    }),
    resolve({
      modulesOnly: true,
      preferBuiltins: true,
    }),
    cleanup(),
  ],
};
