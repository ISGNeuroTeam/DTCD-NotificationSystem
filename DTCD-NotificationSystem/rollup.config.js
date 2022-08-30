import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pluginMeta from './src/Plugin.Meta';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { version } from './package.json';

const watch = Boolean(process.env.ROLLUP_WATCH);

const pluginName = pluginMeta.name;

const output = watch
  ? `./../../DTCD/server/plugins/DTCD-${pluginName}_${version}/${pluginName}.js`
  : `./build/${pluginName}.js`;

const plugins = [
  babel({babelHelpers: 'bundled'}),
  commonjs(),
  resolve({ jsnext: true, preferBuiltins: true, browser: true }),
  json(),
];

export default {
  input: `./src/Plugin.js`,
  output: {
    file: output,
    format: 'esm',
    sourcemap: false,
  },
  watch: {
    include: ['./src/**'],
  },
  plugins,
};
