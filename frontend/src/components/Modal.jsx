import { useEffect, useRef } from "react";
import "./Modal.css";

// Shared accessibility shell for the Log In/Sign Up and Profile Settings
// modals (Section 6/7): full-screen dimmed overlay, focus trap, Escape to
// close, background scroll locked. Scroll-lock uses a module-level counter
// rather than a single flag so a nested modal (the photo editor opening on
// top of Profile Settings, 7b) only unlocks once *all* open modals close.
let openModalCount = 0;

function lockScroll() {
  openModalCount += 1;
  if (openModalCount === 1) {
    document.body.style.overflow = "hidden";
  }
}

function unlockScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = "";
  }
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// dismissible=false disables Escape-to-close entirely (Section 5c: the ToS
// re-consent pop-up has no close/X button and no click-outside-to-escape --
// "Agree to Continue" or "Log Out Instead" are the only two ways out).
export default function Modal({ onClose, children, labelledBy, dismissible = true }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    lockScroll();
    previouslyFocused.current = document.activeElement;

    const container = panelRef.current;
    const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
    (focusables[0] || container).focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (!dismissible) return;
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      unlockScroll();
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [onClose, dismissible]);

  return (
    <div className="modal-overlay">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={panelRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
