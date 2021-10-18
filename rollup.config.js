// @ts-check
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import path from 'path'

const name = require('./package.json').name

/**
 * @param {import('rollup').RollupOptions} options
 * @returns {import('rollup').RollupOptions}
 */
const bundle = options => ({
  input: {
    [name]: 'src/index.ts',
    core: 'src/core.ts',
    debug: 'src/debug/index.ts',
    shims: 'src/shims.ts',
  },
  external: id => !/^[./]/.test(id),
  ...options,
})

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        dir: 'dist',
        format: 'es',
        sourcemap: true,
        entryFileNames: '[name].mjs',
        chunkFileNames: 'shared/[hash].mjs',
        minifyInternalExports: false,
      },
      {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[hash].js',
        minifyInternalExports: false,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      dir: 'dist',
      format: 'es',
      entryFileNames: '[name].d.ts',
      chunkFileNames: 'shared/[hash].d.ts',
      minifyInternalExports: false,
    },
  }),
]
