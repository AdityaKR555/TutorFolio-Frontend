import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function BackToTop() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame;
    const update = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        setVisible(window.scrollY > 400);
        frame = undefined;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  if (!visible) return null;
  return (
    <button
      type="button"
      className="tf-back-to-top"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" aria-hidden="true">
        <path d="m6 12 6-6 6 6M12 6v13" />
      </svg>
    </button>
  );
}
