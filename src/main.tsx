// bippy must be imported BEFORE react to install the React DevTools global hook
import "bippy";
import { getNearestHostFiber, instrument, secure, traverseRenderedFibers } from "bippy";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

import "./index.css";

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
      /**
       * `traverseRenderedFibers` walks the fiber tree and calls the
       * callback only for fibers that actually rendered this commit.
       * Fibers that bailed out (e.g. via useMemo) are skipped.
       */
      traverseRenderedFibers(root, (fiber) => {
        /**
         * `getNearestHostFiber` finds the closest host fiber
         * (a fiber whose stateNode is a DOM element).
         */
        const hostFiber = getNearestHostFiber(fiber);
        if (!hostFiber || !(hostFiber.stateNode instanceof HTMLElement)) return;

        // Draw an accent-colored outline around the re-rendered element for 300ms
        const el = hostFiber.stateNode;
        el.style.outline = `2px solid var(--accent)`;
        el.style.outlineOffset = "2px";
        el.style.transition = "outline-color 0.25s ease";
        requestAnimationFrame(() => {
          el.style.outlineColor = "transparent";
        });
        setTimeout(() => {
          el.style.outline = "";
          el.style.outlineOffset = "";
          el.style.transition = "";
        }, 300);
      });
    },
  }),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
