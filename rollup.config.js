import path from 'path'

import ts from 'rollup-plugin-typescript2'
import dts from 'rollup-plugin-dts'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

const external = id => !id.startsWith('.')
const extensions = ['.ts', '.tsx']

const bundle = ({
  input = 'src/index.ts',
  output = 'dist/wana.js',
  sourcemap = true,
  sourcemapExcludeSources = true,
  sourceRoot = path.dirname(input),
} = {}) => {
  const config = {
    input,
    output,
    sourcemap,
    sourcemapExcludeSources,
    sourceRoot,
  }
  return [esmBundle(config), cjsBundle(config), dtsBundle(config)]
}

const esmBundle = config => ({
  input: config.input,
  output: {
    file: config.output,
    format: 'esm',
    sourcemap: config.sourcemap,
    sourcemapExcludeSources: config.sourcemapExcludeSources,
  },
  external,
  plugins: [
    resolve({ extensions }),
    ts({ check: false }),
    babel(
      getBabelOptions(
        { useESModules: true },
        '>1%, not dead, not ie 11, not op_mini all'
      )
    ),
  ],
})

const cjsBundle = config => ({
  input: config.input,
  output: {
    file: config.output.replace(/\.js$/, '.cjs.js'),
    format: 'cjs',
    sourcemap: config.sourcemap,
    sourcemapExcludeSources: config.sourcemapExcludeSources,
  },
  external,
  plugins: [
    resolve({ extensions }),
    ts({ check: false }),
    babel(getBabelOptions({ useESModules: false })),
  ],
})

const dtsBundle = config => ({
  input: config.input,
  output: [
    {
      file: config.output.replace(/\.js$/, '.d.ts'),
      format: 'es',
    },
  ],
  plugins: [dts()],
  external,
})

const getBabelOptions = ({ useESModules }, targets) => ({
  babelrc: false,
  exclude: '**/node_modules/**',
  extensions: ['ts'],
  runtimeHelpers: true,
  comments: false,
  presets: [['@babel/preset-env', { loose: true, modules: false, targets }]],
  plugins: [
    ['@babel/plugin-transform-runtime', { regenerator: false, useESModules }],
  ],
})

export default bundle()
