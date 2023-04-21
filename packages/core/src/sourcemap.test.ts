// @ts-ignore
import validate from 'sourcemap-validator';
import fs from 'fs';
import { assert, describe, test } from 'vitest';

const min = fs.readFileSync('./dist/index.js', 'utf-8');
const map = fs.readFileSync('./dist/index.js.map', 'utf-8');

describe('sourcemaps', () => {
  test('sourcemaps are valid', () => {
    assert.doesNotThrow(() => validate(min, map, { 'index.ts': './src/index.ts' }));
  });
});
console.log();
