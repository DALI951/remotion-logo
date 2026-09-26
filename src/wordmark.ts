// OpenCode wordmark geometry: turns the TUI block-pixel grid into positioned
// SVG rects, and knows which GRID COLUMNS belong to which letter so the typing
// reveal can go letter-by-letter.
//
// Two traps that were both hit on the original build, so they are encoded here:
//
// 1. logo.ts renders the two halves side by side with a ONE-CELL flex gap. If you
//    concatenate the halves directly, the "code" half shifts one column left and
//    every letter after the gap lands off the grid. => explicit GAP column.
// 2. Cells must NOT be square. The official wordmark is 234x42 (5.57:1) with
//    letter cells 24x30 (0.8). A square-cell grid stretched to 92% width gives
//    ~9.5:1 pancakes. => cells are 1.7x taller than wide.

import { WORDMARK_LEFT, WORDMARK_RIGHT, OC_BLOCK, OC_SLOT } from './assets/logos';

export const GRID_ROWS = 4;
/** left(19) + gap(1) + right(19) */
export const GAP_COL = 19;
export const GRID_W = 19 + 1 + 19; // 39
/** brand-correct letter aspect (24x30) */
export const CELL_H_RATIO = 1.7;

/** Full 4 x 39 grid, gap column included. */
export const GRID: string[][] = (() => {
  const rows: string[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    rows.push([
      ...WORDMARK_LEFT[r].padEnd(19, ' ').split(''),
      ' ',
      ...WORDMARK_RIGHT[r].padEnd(19, ' ').split(''),
    ]);
  }
  return rows;
})();

/**
 * Column runs of non-space cells, per box, read off row 1 (every letter has
 * ink on that row in both halves). Returns the 8 letters in typing order:
 * o p e n | c o d e, each as [startCol, endCol] inclusive.
 */
export const LETTER_SPANS: Array<[number, number]> = (() => {
  const spans: Array<[number, number]> = [];
  const scan = (row: string, offset: number) => {
    let start = -1;
    for (let c = 0; c <= row.length; c++) {
      const solid = c < row.length && row[c] !== ' ';
      if (solid && start < 0) start = c;
      if (!solid && start >= 0) {
        spans.push([start + offset, c - 1 + offset]);
        start = -1;
      }
    }
  };
  scan(WORDMARK_LEFT[1], 0);
  scan(WORDMARK_RIGHT[1], GAP_COL + 1);
  return spans;
})();

export type Rect = { x: number; y: number; w: number; h: number; fill: string };

/**
 * Build SVG rects (in cell units) for every column in [0, endCol] of the grid.
 * Cell-space units: x = column index, y = 0..GRID_ROWS.
 */
export function cellsUpTo(endCol: number): Rect[] {
  const rects: Rect[] = [];
  const last = Math.min(endCol, GRID_W - 1);
  for (let c = 0; c <= last; c++) {
    for (let r = 0; r < GRID_ROWS; r++) {
      const ch = GRID[r][c];
      if (ch === ' ') continue;
      const top = r;
      switch (ch) {
        case '█': // full block
          rects.push({ x: c, y: top, w: 1, h: 1, fill: OC_BLOCK });
          break;
        case '▀': // upper half
          rects.push({ x: c, y: top, w: 1, h: 0.5, fill: OC_BLOCK });
          break;
        case '▄': // lower half
          rects.push({ x: c, y: top + 0.5, w: 1, h: 0.5, fill: OC_BLOCK });
          break;
        case '_': // shadow cell, lower
          rects.push({ x: c, y: top + 0.5, w: 1, h: 0.5, fill: OC_SLOT });
          break;
        case '^': // upper block + lower shadow
          rects.push({ x: c, y: top, w: 1, h: 0.5, fill: OC_BLOCK });
          rects.push({ x: c, y: top + 0.5, w: 1, h: 0.5, fill: OC_SLOT });
          break;
        case '~': // shadow, upper
          rects.push({ x: c, y: top, w: 1, h: 0.5, fill: OC_SLOT });
          break;
        case ',': // shadow, lower (charset mark, unused in this wordmark)
          rects.push({ x: c, y: top + 0.5, w: 1, h: 0.5, fill: OC_SLOT });
          break;
        default:
          break;
      }
    }
  }
  return rects;
}
