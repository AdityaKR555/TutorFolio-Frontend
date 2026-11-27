import { useEffect, useRef, useState } from "react";
import { Pause, Play, Sparkles } from "lucide-react";

const MESSAGES = [
  "I focus on what I love: teaching my students. TutorFolio takes care of my website.",
  "My classes, my experience, my story. TutorFolio brings it all together for me.",
  "A fresh look for my whole portfolio? I just choose a theme. One click, and it’s done!",
  "Students can explore my classes and reach out, all from one link. Let’s make yours next!",
];

export default function HeroTutor({ paused = false }) {
  const [active, setActive] = useState(0);
  const [localPaused, setLocalPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const guideRef = useRef(null);
  const running = !paused && !localPaused && !hovered && !reduced && visible && pageVisible;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReduced(media.matches);
    const onVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(guideRef.current);
    media.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % MESSAGES.length), 7500);
    return () => window.clearTimeout(timer);
  }, [active, running]);

  return (
    <div ref={guideRef} className="lp-tutor-guide" data-running={running}>
      <div className="lp-teacher-character" aria-hidden="true">
        <img src="/illustrations/teacher-full-body.png" alt="" width="1024" height="1536" />
      </div>
      <div className="lp-tutor-speech" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}>
        <div className="lp-tutor-speech-label"><Sparkles size={12} aria-hidden="true" /> Your tutor guide <span aria-hidden="true"><i /><i /><i /></span></div>
        <p className="lp-tutor-speech-message">
          <span className="sr-only">{MESSAGES[active]}</span>
          <span key={active} className="lp-tutor-spoken" aria-hidden="true">{MESSAGES[active].split(" ").map((word, index) => <span key={index} style={{ "--word": index }}>{word} </span>)}</span>
        </p>
        <div className="lp-tutor-speech-controls">
          <div role="group" aria-label="Tutor guide messages">{MESSAGES.map((message, index) => <button key={message} type="button" aria-label={`Read message ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}><span /></button>)}</div>
          <button type="button" className="lp-tutor-pause" disabled={paused || reduced} onClick={() => setLocalPaused((value) => !value)} aria-label={localPaused ? "Play tutor messages" : "Pause tutor messages"}>{localPaused || paused || reduced ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}</button>
        </div>
      </div>
    </div>
  );
}
