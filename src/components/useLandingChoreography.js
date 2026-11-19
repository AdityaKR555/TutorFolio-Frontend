import { useEffect } from "react";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** One frame loop coordinates pointer inertia and native-scroll depth. */
export default function useLandingChoreography(ref, paused) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let dirty = true;
    let cards = [];
    let panels = [];
    let activeCard = null;
    let activeButton = null;
    let target = { x: innerWidth / 2, y: innerHeight / 2 };
    const position = { ...target };
    const tail = { ...target };
    const wake = { ...target };

    const collect = () => {
      cards = [...root.querySelectorAll("[data-motion-card]")];
      panels = [...root.querySelectorAll("[data-motion-panel]")];
      dirty = true;
    };
    const resetCard = () => {
      activeCard?.style.setProperty("--card-pointer-pitch", "0deg");
      activeCard?.style.setProperty("--card-pointer-yaw", "0deg");
      activeCard = null;
    };
    const resetButton = () => {
      activeButton?.style.setProperty("--magnet-x", "0px");
      activeButton?.style.setProperty("--magnet-y", "0px");
      activeButton = null;
    };
    const update = () => {
      frame = 0;
      const still = paused || reduced.matches;
      const dx = target.x - position.x;
      const dy = target.y - position.y;
      position.x += dx * 0.095;
      position.y += dy * 0.095;
      tail.x += (position.x - tail.x) * 0.055;
      tail.y += (position.y - tail.y) * 0.055;
      wake.x += (tail.x - wake.x) * 0.045;
      wake.y += (tail.y - wake.y) * 0.045;
      root.style.setProperty("--scroll", `${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))}`);
      if (!still && fine.matches) {
        root.style.setProperty("--cursor-x", `${position.x}px`);
        root.style.setProperty("--cursor-y", `${position.y}px`);
        root.style.setProperty("--liquid-tail-x", `${tail.x}px`);
        root.style.setProperty("--liquid-tail-y", `${tail.y}px`);
        root.style.setProperty("--liquid-wake-x", `${wake.x}px`);
        root.style.setProperty("--liquid-wake-y", `${wake.y}px`);
        root.style.setProperty("--liquid-stretch", `${Math.min(240, 130 + Math.hypot(dx, dy) * 0.6)}px`);
        root.style.setProperty("--tilt-x", `${(position.y / innerHeight - 0.5) * -7}deg`);
        root.style.setProperty("--tilt-y", `${(position.x / innerWidth - 0.5) * 10}deg`);
      } else {
        root.style.setProperty("--tilt-x", "0deg");
        root.style.setProperty("--tilt-y", "0deg");
      }
      if (dirty) {
        cards.forEach((card) => {
          const bounds = card.getBoundingClientRect();
          const progress = still ? 1 : clamp((innerHeight * 0.97 - bounds.top) / Math.min(300, bounds.height * 0.8));
          card.style.setProperty("--card-rise", `${(1 - progress) * 105}px`);
          card.style.setProperty("--card-pitch", `${(1 - progress) * 22}deg`);
          card.style.setProperty("--card-scale", `${0.9 + progress * 0.1}`);
          card.style.setProperty("--card-clip", `${(1 - progress) * 23}%`);
          card.style.setProperty("--art-travel", `${(1 - progress) * 38}px`);
        });
        panels.forEach((panel) => {
          const bounds = panel.getBoundingClientRect();
          const progress = still ? 1 : clamp((innerHeight - bounds.top) / Math.min(innerHeight * 0.7, bounds.height));
          panel.style.setProperty("--panel-pitch", `${(1 - progress) * 15}deg`);
          panel.style.setProperty("--panel-yaw", `${(1 - progress) * -10}deg`);
          panel.style.setProperty("--panel-lift", `${(1 - progress) * 70}px`);
          panel.style.setProperty("--panel-scale", `${0.91 + progress * 0.09}`);
        });
        const hero = root.querySelector(".lp-hero");
        if (hero) {
          const bounds = hero.getBoundingClientRect();
          const progress = still ? 0 : clamp(-bounds.top / (bounds.height * 0.8));
          root.style.setProperty("--hero-drift", `${progress * -45}px`);
          root.style.setProperty("--hero-turn", `${progress * 6}deg`);
        }
        dirty = false;
      }
      if (!still && fine.matches && (Math.abs(dx) + Math.abs(dy) + Math.abs(position.x - wake.x) + Math.abs(position.y - wake.y) > 0.3)) frame = requestAnimationFrame(update);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const scroll = () => { dirty = true; schedule(); };
    const move = (event) => {
      if (event.pointerType !== "mouse" || paused || reduced.matches || !fine.matches) return;
      target = { x: event.clientX, y: event.clientY };
      root.classList.add("has-pointer");
      const card = event.target.closest("[data-motion-card]");
      if (card !== activeCard) resetCard();
      if (card) {
        activeCard = card;
        const bounds = card.getBoundingClientRect();
        const x = clamp((event.clientX - bounds.left) / bounds.width);
        const y = clamp((event.clientY - bounds.top) / bounds.height);
        card.style.setProperty("--card-pointer-pitch", `${(y - 0.5) * -10}deg`);
        card.style.setProperty("--card-pointer-yaw", `${(x - 0.5) * 12}deg`);
        card.style.setProperty("--card-light-x", `${x * 100}%`);
        card.style.setProperty("--card-light-y", `${y * 100}%`);
      }
      const button = event.target.closest(".lp-button-primary");
      if (button !== activeButton) resetButton();
      if (button) {
        activeButton = button;
        const bounds = button.getBoundingClientRect();
        button.style.setProperty("--magnet-x", `${clamp((event.clientX - bounds.left - bounds.width / 2) * 0.12, -7, 7)}px`);
        button.style.setProperty("--magnet-y", `${clamp((event.clientY - bounds.top - bounds.height / 2) * 0.15, -5, 5)}px`);
      }
      schedule();
    };
    const leave = () => { root.classList.remove("has-pointer"); resetCard(); resetButton(); };
    const mutation = new MutationObserver(() => { collect(); schedule(); });
    const resize = new ResizeObserver(() => { dirty = true; schedule(); });
    collect();
    mutation.observe(root, { childList: true, subtree: true });
    resize.observe(root);
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    reduced.addEventListener("change", scroll);
    fine.addEventListener("change", scroll);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutation.disconnect();
      resize.disconnect();
      resetCard(); resetButton();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      reduced.removeEventListener("change", scroll);
      fine.removeEventListener("change", scroll);
    };
  }, [ref, paused]);
}
