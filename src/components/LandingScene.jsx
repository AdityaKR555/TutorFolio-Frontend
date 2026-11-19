import { useEffect, useRef } from "react";

const PALETTES = {
  sage: [0x286bed, 0xe4bd71],
  midnight: [0x4b7bea, 0xb3c5e9],
  studio: [0xc57d59, 0xe5bf7b],
};

/** Pointer inertia, scroll choreography, and theme-aware materials share one scene. */
export default function LandingScene({ paused, theme = "sage" }) {
  const ref = useRef(null);
  const themeRef = useRef(theme);
  const refreshTheme = useRef(() => {});
  useEffect(() => { themeRef.current = theme; refreshTheme.current(); }, [theme]);

  useEffect(() => {
    const host = ref.current;
    const hero = host.closest(".lp-hero");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      } catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
      camera.position.z = 8;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x93a9cd, 3));
      const key = new THREE.DirectionalLight(0xffffff, 4.5);
      key.position.set(-3, 5, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x9dc7ff, 3);
      rim.position.set(4, 1, -2);
      scene.add(rim);

      const blue = new THREE.MeshPhysicalMaterial({ color: 0x286bed, metalness: 0.35, roughness: 0.2, clearcoat: 1 });
      const gold = new THREE.MeshPhysicalMaterial({ color: 0xe4bd71, metalness: 0.3, roughness: 0.27, clearcoat: 1 });
      const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xf0f4fc, metalness: 0.1, roughness: 0.22, clearcoat: 1 });
      const pages = new THREE.MeshStandardMaterial({ color: 0xf8f5ed, roughness: 0.7 });
      const rig = new THREE.Group();
      scene.add(rig);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.67, 0.17, 24, 80), blue);
      ring.visible = false;
      rig.add(ring);
      const books = new THREE.Group();
      const coverGeometry = new THREE.BoxGeometry(0.85, 0.055, 0.61);
      const pagesGeometry = new THREE.BoxGeometry(0.78, 0.13, 0.56);
      for (let index = 0; index < 3; index += 1) {
        const book = new THREE.Group();
        const material = [blue, porcelain, gold][index];
        const top = new THREE.Mesh(coverGeometry, material);
        const bottom = new THREE.Mesh(coverGeometry, material);
        const paper = new THREE.Mesh(pagesGeometry, pages);
        top.position.y = 0.09;
        bottom.position.y = -0.09;
        book.add(top, bottom, paper);
        book.position.y = index * 0.24;
        book.rotation.y = (index - 1) * 0.23;
        books.add(book);
      }
      rig.add(books);
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), porcelain);
      rig.add(pearl);
      const satellites = [];
      const dotGeometry = new THREE.SphereGeometry(0.035, 12, 8);
      for (let index = 0; index < 7; index += 1) {
        const dot = new THREE.Mesh(dotGeometry, index % 2 ? gold : porcelain);
        satellites.push(dot);
        rig.add(dot);
      }

      let frame = 0;
      let visible = true;
      let lost = false;
      let time = 0;
      let previousTime = 0;
      let scrollTarget = 0;
      let scrollPosition = 0;
      let halfWidth = 2;
      let smallScreen = false;
      const pointer = { x: 0, y: 0 };
      const targetPointer = { x: 0, y: 0 };
      const targetBlue = new THREE.Color();
      const targetGold = new THREE.Color();
      const still = () => paused || reduced.matches;
      const render = () => { if (!lost) renderer.render(scene, camera); };
      const applyTheme = (instant = false) => {
        const palette = PALETTES[themeRef.current] || PALETTES.sage;
        targetBlue.setHex(palette[0]);
        targetGold.setHex(palette[1]);
        blue.color.lerp(targetBlue, instant ? 1 : 0.045);
        gold.color.lerp(targetGold, instant ? 1 : 0.045);
      };
      const pose = () => {
        const motion = still() ? 0 : 1;
        const spread = scrollPosition * motion;
        rig.rotation.y = pointer.x * 0.15 * motion;
        rig.rotation.x = pointer.y * 0.1 * motion;
        ring.position.set(halfWidth * 0.52 + spread * 0.35, 1.65 + Math.sin(time * 0.65) * 0.1 * motion - spread * 0.55, 0.1 - spread * 0.6);
        ring.rotation.set(0.7 + pointer.y * 0.3 * motion + spread * 0.8, 0.4 + Math.sin(time * 0.23) * 0.55 * motion + pointer.x * 0.5 * motion, -0.3 + spread * 0.4);
        ring.scale.setScalar((smallScreen ? 0.58 : 0.82) * (1 + spread * 0.1));
        books.position.set(-halfWidth * 0.64 - spread * 0.2, -0.72 + Math.sin(time * 0.7 + 1) * 0.08 * motion + spread * 0.7, 0.25);
        books.rotation.set(0.4 + pointer.y * 0.18 * motion, -0.5 + Math.sin(time * 0.25) * 0.15 * motion + spread, -0.2 - pointer.x * 0.1 * motion);
        books.scale.setScalar(smallScreen ? 0.7 : 0.9);
        books.children.forEach((book, index) => {
          book.position.y = index * (0.24 + spread * 0.17);
          book.rotation.y = (index - 1) * (0.23 + spread * 0.45);
        });
        pearl.position.set(-halfWidth * 0.65 + pointer.x * 0.1, 2.1 + Math.sin(time * 0.8) * 0.08 * motion, -0.2);
        satellites.forEach((dot, index) => {
          const angle = index / satellites.length * Math.PI * 2 + time * 0.08 * motion + spread;
          dot.position.set(halfWidth * 0.52 + Math.cos(angle) * (0.94 + spread * 0.25), 1.65 + Math.sin(angle) * 0.48 - spread * 0.55, Math.sin(angle) * 0.5 - 0.25);
        });
      };
      const animate = (timestamp) => {
        frame = 0;
        if (disposed || lost) return;
        time += Math.min((timestamp - (previousTime || timestamp)) / 1000, 0.05);
        previousTime = timestamp;
        pointer.x += (targetPointer.x - pointer.x) * 0.055;
        pointer.y += (targetPointer.y - pointer.y) * 0.055;
        scrollPosition += (scrollTarget - scrollPosition) * 0.065;
        applyTheme(); pose(); render();
        if (visible && !document.hidden && !still()) frame = requestAnimationFrame(animate);
      };
      const sync = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        if (lost) return;
        if (visible && !document.hidden && !still()) frame = requestAnimationFrame(animate);
        else { applyTheme(true); pose(); render(); }
      };
      const scroll = () => {
        const bounds = hero.getBoundingClientRect();
        scrollTarget = Math.min(1, Math.max(0, -bounds.top / (bounds.height * 0.8)));
      };
      const resize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        halfWidth = Math.tan(36 * Math.PI / 360) * camera.position.z * camera.aspect;
        smallScreen = width < 480;
        camera.updateProjectionMatrix();
        scroll(); pose(); render();
      };
      const move = (event) => {
        if (event.pointerType !== "mouse" || still() || !fine.matches) return;
        targetPointer.x = (event.clientX / innerWidth - 0.5) * 2;
        targetPointer.y = (event.clientY / innerHeight - 0.5) * 2;
      };
      const leave = () => { targetPointer.x = 0; targetPointer.y = 0; };
      const contextLost = (event) => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); host.classList.remove("is-ready"); };
      const contextRestored = () => { lost = false; host.classList.add("is-ready"); resize(); sync(); };
      const sizeObserver = new ResizeObserver(resize);
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
      sizeObserver.observe(host);
      intersection.observe(host);
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("scroll", scroll, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      document.addEventListener("visibilitychange", sync);
      reduced.addEventListener("change", sync);
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
      refreshTheme.current = () => { if (still()) { applyTheme(true); render(); } };
      applyTheme(true); resize();
      host.classList.add("is-ready");
      sync();

      cleanup = () => {
        cancelAnimationFrame(frame);
        sizeObserver.disconnect(); intersection.disconnect();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("scroll", scroll);
        document.documentElement.removeEventListener("pointerleave", leave);
        document.removeEventListener("visibilitychange", sync);
        reduced.removeEventListener("change", sync);
        renderer.domElement.removeEventListener("webglcontextlost", contextLost);
        renderer.domElement.removeEventListener("webglcontextrestored", contextRestored);
        const geometries = new Set();
        scene.traverse((object) => { if (object.geometry) geometries.add(object.geometry); });
        geometries.forEach((geometry) => geometry.dispose());
        [blue, gold, porcelain, pages].forEach((material) => material.dispose());
        renderer.dispose(); renderer.domElement.remove();
        refreshTheme.current = () => {};
        host.classList.remove("is-ready");
      };
    }).catch(() => { /* The CSS fallback keeps the composition intact without WebGL. */ });
    return () => { disposed = true; cleanup(); };
  }, [paused]);

  return <div className="lp-3d-scene" ref={ref} aria-hidden="true"><span className="lp-fallback-gem" /></div>;
}
