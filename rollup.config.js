import copy from 'rollup-plugin-copy';
import sass from 'rollup-plugin-sass';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/scripts/rslider.ts',
  output: {
    file: './dist/js/rslider.js',
    format: 'iife',
    name: 'RSlider',
  },
  plugins: [
    copy({
      targets: [
        { src: './src/demo/*.css', dest: './dist/css/' },
        { src: './src/demo/*.js', dest: './dist/js/' },
        { src: './src/demo/*.html', dest: './dist/' },
      ],
    }),
    sass({
      output: './dist/css/rslider.css',
    }),
    typescript(),
  ],
};
