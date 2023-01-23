import { beforeEach, describe, expect, it } from 'vitest';
import postcss from 'postcss';
import plugin from './data-attribute-prefixer';

// declare module 'vitest' {
//   export interface TestContext {
//     processor: Processor;
//   }
// }

describe.concurrent('Test data-attribute-prefixer PostCSS plugin:', () => {
  beforeEach(async (context) => {
    context.processor = postcss([plugin({ prefix: 'lk-' })]);
  });

  it('Test use of data attributes as selectors:', async ({ processor }) => {
    expect((await processor.process("[data-selector='value'] { color: red }")).css).toBe(
      "[data-lk-selector='value'] { color: red }",
    );
    expect(
      (await processor.process('.lk-media-muted-indicator-camera[data-look-muted=true]::after{}'))
        .css,
    ).toBe('.lk-media-muted-indicator-camera[data-lk-look-muted=true]::after{}');
  });

  it('Respect existing prefix:', async ({ processor }) => {
    expect((await processor.process("[data-lk-selector='value'] { color: red }")).css).toBe(
      "[data-lk-selector='value'] { color: red }",
    );
  });

  it('Handle prefix at beginning of a wort.', async ({ processor }) => {
    expect((await processor.process("[data-lkos-selector='value'] {}")).css).toBe(
      "[data-lk-lkos-selector='value'] {}",
    );
  });

  it('Handle prefix later in selector.', async ({ processor }) => {
    expect((await processor.process("[data-word-lk-selector='value'] {}")).css).toBe(
      "[data-lk-word-lk-selector='value'] {}",
    );
  });
});
