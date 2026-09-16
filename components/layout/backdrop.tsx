/**
 * Page-wide atmosphere layers, fixed to the viewport so content scrolls over
 * them.
 *
 * The grid sits at `-z-10`: behind every section, but still above the canvas,
 * because `<body>`'s background propagates to the canvas (`<html>` has no
 * background of its own). The noise sits at `z-100`, above everything including
 * the header, and ignores the pointer so it never intercepts clicks.
 */
export function Backdrop() {
  return (
    <>
      <div aria-hidden className="bg-grid pointer-events-none fixed inset-0 -z-10" />
      <div
        aria-hidden
        className="bg-noise pointer-events-none fixed inset-0 z-100 opacity-[0.05]"
      />
    </>
  );
}
