

## Fix: Analysis Card Captures Only the Card, Not the Whole Screen

### Problem
In `StudyChart.tsx`, the `CardCaptureButton` sits **outside** the `data-capture-target` div (line 2033 is a sibling, not a child of the div ending at line 2031). The `closest('[data-capture-target]')` traversal walks up ancestors only — it never finds the target, so `captureScreenshot(null)` falls back to `document.body`, capturing the entire page.

The other panels (Watchlist, Market Overview, Pattern Study) work correctly because their `CardCaptureButton` is nested inside the `data-capture-target` element.

### Fix 1: Screenshot — Restructure the Dialog DOM

**`src/components/charts/StudyChart.tsx`** (lines 2021–2048)

Move the `CardCaptureButton` and action buttons **inside** the `data-capture-target` div, or wrap the entire `DialogContent` children in `data-capture-target` so `closest()` can find it. The cleanest approach: wrap the full dialog inner content (analysis + buttons) in the `data-capture-target` div, so the capture gets the complete card including actions.

### Fix 2: Video — Element-scoped recording via Canvas stream

Currently `startRecording` uses `getDisplayMedia()` which always captures the full screen/tab. To record just a card element:

**`src/hooks/useMediaCapture.ts`**
- Add a new method `startElementRecording(element: HTMLElement)` that:
  1. Uses `html2canvas` in a `requestAnimationFrame` loop to continuously render the element to a canvas
  2. Calls `canvas.captureStream(30)` to get a `MediaStream` from that canvas
  3. Records that stream with `MediaRecorder` (same existing logic)
- This gives element-scoped video recording without the screen share picker dialog

**`src/components/capture/CardCaptureButton.tsx`**
- Add a video recording option (small toggle or long-press) that calls `startElementRecording` with the resolved target element

### Files to modify
1. **`src/components/charts/StudyChart.tsx`** — Move button inside `data-capture-target` wrapper
2. **`src/hooks/useMediaCapture.ts`** — Add `startElementRecording` for element-scoped video
3. **`src/components/capture/CardCaptureButton.tsx`** — Optionally expose video capture for cards

