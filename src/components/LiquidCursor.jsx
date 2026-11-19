import { useEffect, useRef } from "react";

/** A spring-linked, tapered ribbon rather than a blurred spotlight. */
export default function LiquidCursor({ paused }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const points = Array.from({ length: 48 }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    let frame = 0;
    let lastMove = 0;
    let previous = 0;
    let started = false;
    let width = innerWidth;
    let height = innerHeight;
    const target = { x: 0, y: 0 };
    const enabled = () => !paused && !media.matches && pointer.matches && !document.hidden;
    const clear = () => ctx.clearRect(0, 0, width, height);
    const resize = () => {
      width = innerWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio, 1.5);
      canvas.width = width * ratio; canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const curve = (vertices) => {
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length - 1; i++) {
        ctx.quadraticCurveTo(vertices[i].x, vertices[i].y, (vertices[i].x + vertices[i + 1].x) / 2, (vertices[i].y + vertices[i + 1].y) / 2);
      }
      const end = vertices[vertices.length - 1];
      ctx.lineTo(end.x, end.y);
    };
    const draw = (now) => {
      frame = 0;
      clear();
      if (!enabled()) return;
      const dt = Math.min(1.6, (now - (previous || now)) / 16.667 || 1);
      previous = now;
      points.forEach((point, i) => {
        const anchor = i ? points[i - 1] : target;
        point.vx = (point.vx + (anchor.x - point.x) * .12 * dt) * Math.pow(.64, dt);
        point.vy = (point.vy + (anchor.y - point.y) * .12 * dt) * Math.pow(.64, dt);
        point.x += point.vx * dt; point.y += point.vy * dt;
      });
      const age = now - lastMove;
      const opacity = Math.max(0, 1 - Math.max(0, age - 240) / 1350);
      const left = [], right = [];
      points.forEach((point, i) => {
        const next = points[Math.min(i + 1, points.length - 1)];
        const prev = points[Math.max(0, i - 1)];
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        const speed = Math.hypot(point.vx, point.vy);
        const taper = Math.sin(Math.PI * i / (points.length - 1));
        const radius = taper * Math.min(19, 3 + speed * .38) * opacity;
        left.push({ x: point.x - Math.sin(angle) * radius, y: point.y + Math.cos(angle) * radius });
        right.push({ x: point.x + Math.sin(angle) * radius, y: point.y - Math.cos(angle) * radius });
      });
      if (opacity > 0) {
        const head = points[0], tail = points[points.length - 1];
        const gradient = ctx.createLinearGradient(head.x, head.y, tail.x + .1, tail.y + .1);
        gradient.addColorStop(0, 'rgba(183,241,255,.05)');
        gradient.addColorStop(.22, 'rgba(92,176,238,.42)');
        gradient.addColorStop(.46, 'rgba(231,249,255,.65)');
        gradient.addColorStop(.64, 'rgba(163,154,238,.3)');
        gradient.addColorStop(.83, 'rgba(110,224,229,.28)');
        gradient.addColorStop(1, 'rgba(210,239,255,0)');
        ctx.globalAlpha = opacity;
        ctx.beginPath(); curve(left); curve(right.reverse()); ctx.closePath();
        ctx.fillStyle = gradient; ctx.fill();
        ctx.beginPath(); curve(left);
        ctx.strokeStyle = 'rgba(162,210,246,.32)'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); curve(right);
        ctx.strokeStyle = 'rgba(255,255,255,.48)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (age < 1800) frame = requestAnimationFrame(draw);
    };
    const move = (event) => {
      if (event.pointerType !== 'mouse' || !enabled()) return;
      target.x = event.clientX; target.y = event.clientY;
      if (!started) { points.forEach(point => { point.x = target.x; point.y = target.y; }); started = true; }
      lastMove = performance.now();
      if (!frame) { previous = 0; frame = requestAnimationFrame(draw); }
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; started = false; clear(); };
    resize();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', stop);
    document.documentElement.addEventListener('pointerleave', stop);
    media.addEventListener('change', stop); pointer.addEventListener('change', stop);
    return () => {
      stop(); window.removeEventListener('pointermove', move); window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', stop); document.documentElement.removeEventListener('pointerleave', stop);
      media.removeEventListener('change', stop); pointer.removeEventListener('change', stop);
    };
  }, [paused]);
  return <canvas ref={ref} className="lp-liquid-cursor" aria-hidden="true" />;
}
