// OpenCode logo intro — the FINAL approved spec (v14, 2026-09-16).
//
// 2560x1440 @ 60fps, 480 frames (8s), pure black background.
//
//   frames   0- 59  hold: the official "o" glyph, completely static
//   frames  60-290  pivot-zoom: scale 1 -> 13 about origin '50% 30%'
//                   (the centre of the o's EMPTY upper third), inOut cubic.
//                   SCALE ONLY — a post-zoom translate drifts the view back
//                   into the wrong content, which is what made earlier
//                   versions "re-appear" after the zoom stopped.
//   frames 290-299  the window sits entirely inside the empty band = pure black
//   frames 300-479  the opencode block-pixel wordmark types itself in,
//                   one letter every 12 frames, with a block caret.
//
// Everything is sized in %/ratios of useVideoConfig() so the composition
// survives a resolution change without re-tuning.

import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { OpenCodeOGlyph, OC_BLOCK } from './assets/logos';
import { CELL_H_RATIO, GRID_ROWS, GRID_W, LETTER_SPANS, cellsUpTo } from './wordmark';

const BG = '#000000';

export const OpenCodeIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  /* ---------- phase 1: the o ---------- */
  const boxH = height * 0.54; // 54% of frame height (approved framing)
  const boxW = (boxH * 24) / 30; // glyph viewBox is 24 x 30
  const zoom = interpolate(frame, [60, 290], [1, 13], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* ---------- phase 2: the wordmark ---------- */
  const WORDMARK_W = width * 0.92; // 8% margins
  const cellW = WORDMARK_W / GRID_W;
  const cellH = cellW * CELL_H_RATIO; // 1.7x taller than wide (brand-correct)
  const gridW = GRID_W * cellW;
  const gridH = GRID_ROWS * cellH;
  const gridLeft = (width - gridW) / 2;
  const gridTop = (height - gridH) / 2;

  const FIRST_TYPE = 310;
  const PER_LETTER = 12;
  const typed = Math.max(0, Math.min(LETTER_SPANS.length, Math.floor((frame - FIRST_TYPE) / PER_LETTER) + 1));
  const doneFrame = FIRST_TYPE + LETTER_SPANS.length * PER_LETTER;

  // caret sits in the next empty cell column; solid while typing, blinking after
  const lastEnd = typed > 0 ? LETTER_SPANS[typed - 1][1] : -1;
  const caretCol = lastEnd + 1;
  const caretVisible = frame >= 300 && (frame < doneFrame || Math.floor((frame - doneFrame) / 15) % 2 === 0);

  const rects = cellsUpTo(lastEnd);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* phase 1 — the o, zooming into its own empty upper third */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: boxW,
            height: boxH,
            transformOrigin: '50% 30%',
            transform: `scale(${zoom})`,
          }}
        >
          <OpenCodeOGlyph width={boxW} height={boxH} />
        </div>
      </AbsoluteFill>

      {/* phase 2 — wordmark + caret */}
      {frame >= 300 && (
        <svg
          width={gridW}
          height={gridH}
          viewBox={`0 0 ${gridW} ${gridH}`}
          style={{ position: 'absolute', left: gridLeft, top: gridTop }}
        >
          {rects.map((r, i) => (
            <rect
              key={i}
              x={r.x * cellW}
              y={r.y * cellH}
              width={r.w * cellW}
              height={r.h * cellH}
              fill={r.fill}
            />
          ))}
          {caretVisible && (
            <rect
              x={caretCol * cellW}
              y={0}
              width={cellW}
              height={cellH}
              fill={OC_BLOCK}
            />
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};
