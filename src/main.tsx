// bippy must be imported BEFORE react to install the React DevTools global hook
import "bippy";
import { getDisplayName, instrument, secure, traverseRenderedFibers } from "bippy";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

import "./index.css";

interface Highlight {
  label: string | null;
  element: HTMLElement;
}

const HIGHLIGHT_DURATION = 400;
const FADE_DURATION = 250;

const overlayRoot = document.createElement("div");
overlayRoot.style.cssText = `
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
`;
document.documentElement.appendChild(overlayRoot);

const activeHighlights = new Map<HTMLElement, HTMLElement>();

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const highlightElement = activeHighlights.get(entry.target as HTMLElement);
    if (highlightElement) {
      const rect = entry.target.getBoundingClientRect();
      highlightElement.style.insetInlineStart = `${rect.x}px`;
      highlightElement.style.insetBlockStart = `${rect.y}px`;
      highlightElement.style.width = `${rect.width}px`;
      highlightElement.style.height = `${rect.height}px`;
    }
  }
});

function renderHighlight(highlight: Highlight) {
  const rect = highlight.element.getBoundingClientRect();

  const highlightElement = document.createElement("div");
  highlightElement.style.cssText = `
    box-sizing: border-box;
    position: absolute;
    inset-inline-start: ${rect.x}px;
    inset-block-start: ${rect.y}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 1px solid var(--highlight-color);
    border-radius: 2px;
    background-color: var(--highlight-fill);
    transition: opacity ${FADE_DURATION}ms ease-out;
    opacity: 1;
  `;

  if (highlight.label) {
    highlightElement.setAttribute("label", highlight.label);
  }

  overlayRoot.appendChild(highlightElement);

  activeHighlights.set(highlight.element, highlightElement);
  resizeObserver.observe(highlight.element);

  window.setTimeout(() => {
    highlightElement.style.opacity = "0";
    window.setTimeout(() => {
      resizeObserver.unobserve(highlight.element);
      activeHighlights.delete(highlight.element);
      highlightElement.remove();
    }, FADE_DURATION);
  }, HIGHLIGHT_DURATION);
}

/**
 * `instrument` patches `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` with our handlers.
 * It must be called before React renders.
 *
 * `secure` wraps handlers in try/catch so errors don't crash the app,
 * and skips execution in production or on unsupported React versions.
 */
instrument(
  secure({
    /**
     * `onCommitFiberRoot` fires when React has finished rendering
     * and is about to apply DOM mutations.
     */
    onCommitFiberRoot(_rendererID, root) {
      const highlights: Highlight[] = [];
      /**
       * `traverseRenderedFibers` walks the fiber tree and calls the
       * callback only for fibers that actually rendered this commit.
       * Fibers that bailed out (e.g. via useMemo) are skipped.
       */
      traverseRenderedFibers(root, (fiber) => {
        if (!(fiber.stateNode instanceof HTMLElement)) {
          return;
        }
        highlights.push({
          label: getDisplayName(fiber),
          element: fiber.stateNode,
        });
      });

      highlights.forEach((highlight) => {
        renderHighlight(highlight);
      });
    },
  }),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
