// @ts-ignore
import validate from 'sourcemap-validator';
import fs from 'fs';

const min = fs.readFileSync('./dist/index.js', 'utf-8');
const map = fs.readFileSync('./dist/index.js.map', 'utf-8');

validate(min, map, { 'index.ts': './src/index.ts' });
