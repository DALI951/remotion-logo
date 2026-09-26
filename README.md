# remotion-logo

Two code-made brand animations, rendered **on GitHub Actions** so the local PC
never installs Remotion's Chrome or encodes a video.

| Composition | What it is | Spec | Length |
|---|---|---|---|
| `OpenCodeIntro` | the opencode "o", pivot-zoom into its own empty upper third, then the block-pixel wordmark types itself in | 2560x1440 @ 60fps | 480f / 8s |
| `ChatGPTIntro` | the ChatGPT bloom grows, spins up, then the six petals detach and are thrown out of frame | 2560x1440 @ 60fps | 600f / 10s |

## Render (all of it happens on GitHub)

Push to `main` and the workflow renders both, pixel-asserts the key frames, and
attaches the mp4s to a release:

```bash
git push                     # triggers the render
```

Then grab the results:

- Release page: <https://github.com/DALI951/remotion-logo/releases>
- Actions artifacts (kept 30 days): the run's **Artifacts → renders**
- Re-run without pushing: **Actions → render → Run workflow**
- Or download the finished files straight onto the PC:

```bash
gh release download renders-<run number> -D out
```

## Local preview (optional, no render)

```bash
npm install
npm run studio        # http://localhost:3000, live preview + hot reload
```

`studio.bat` does the same thing on Windows.

## Brand sources (never redraw these by hand)

| Asset | Source |
|---|---|
| opencode "o" glyph | `anomalyco/opencode` → `packages/web/src/assets/logo-dark.svg` |
| opencode wordmark grid | `anomalyco/opencode` → `packages/tui/src/logo.ts` |
| ChatGPT harmony bloom | `openai/harmony` → `demo/harmony-demo/public/openai_logo.svg` |

`tools/fetch-brand.mjs` regenerates `src/assets/wordmarkData.ts` from the opencode
TUI source (it validates 4 rows x 19 cols per box):

```bash
node tools/fetch-brand.mjs
```

## Hard-won details that are easy to break

1. **Zoom is scale-only.** Adding a translate to "finish" the motion drifts the
   view back into the wrong content — the logo visibly re-appears after the zoom
   stops. The pivot (`transformOrigin: '50% 30%'`) was solved from window
   geometry, not eyeballed.
2. **The zoom must LAND on a uniform frame.** At 13x the visible window falls
   entirely inside the o's empty upper third, so the last frames are exactly one
   colour. `tools/verify_frames.py` asserts that.
3. **The wordmark has a one-cell gap** between the "open" and "code" halves
   (`gap={1}` in the TUI source). Concatenating the halves shifts the whole
   second half one column off the grid.
4. **Wordmark cells are 1.7x taller than wide.** The official wordmark is
   234x42 with 24x30 letter cells; square cells stretched to 92% width give
   ~9.5:1 pancakes.
5. **PNG frames, not JPEG.** These are flat-colour graphics; JPEG quantisation
   bands and rings on uniform areas (and broke the pixel asserts).
6. **Everything is sized from `useVideoConfig()`**, so changing resolution is a
   one-line change in `src/Root.tsx` with no re-tuning.
