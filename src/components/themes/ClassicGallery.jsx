import { useEffect, useRef, useState } from "react";

const source = image => image.fileUrl || image.url || image.imageUrl || image.src;
const caption = (image, index) => image.title || image.originalFilename || `Gallery photo ${index + 1}`;

export default function ClassicGallery({ gallery }) {
  const [failed, setFailed] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const photos = gallery.filter(image => source(image) && !failed.has(source(image)));
  const index = photos.length ? Math.min(selected ?? 0, photos.length - 1) : 0;
  const active = selected !== null && photos.length > 0;
  useEffect(() => {
    if (!active) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    return () => { modal.close(); document.body.style.overflow = previousOverflow; };
  }, [active]);
  const move = direction => setSelected((index + direction + photos.length) % photos.length);
  const unavailable = url => setFailed(previous => new Set([...previous, url]));
  return <>
    {photos.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((image, i) => <button key={source(image)} type="button" onClick={() => setSelected(i)} aria-label={`View ${caption(image, i)}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 dark:border-slate-700 dark:bg-slate-900"><img src={source(image)} alt={caption(image, i)} onError={() => unavailable(source(image))} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 motion-safe:group-hover:scale-105"/></button>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Gallery photos will appear here when the tutor adds them.</p>}
    {active && <dialog ref={dialog} aria-label="Gallery image viewer" onCancel={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} onKeyDown={event => { if (event.key === "ArrowRight") { event.preventDefault(); move(1); } if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } }} className="fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-1rem)] max-w-6xl overflow-auto rounded-2xl border border-white/15 bg-slate-950 p-3 text-white shadow-2xl backdrop:bg-slate-950/85 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-4"><p aria-live="polite" className="min-w-0 truncate text-sm">{index + 1} / {photos.length} · {caption(photos[index], index)}</p><button autoFocus type="button" aria-label="Close image viewer" onClick={() => setSelected(null)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">×</button></div>
      <img src={source(photos[index])} alt={caption(photos[index], index)} onError={() => unavailable(source(photos[index]))} className="mx-auto max-h-[70dvh] w-full object-contain"/>
      <div className="mt-4 flex items-center justify-between gap-4"><button type="button" disabled={photos.length < 2} onClick={() => move(-1)} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-40">← Previous</button><span className="hidden text-xs text-slate-400 sm:block">Use ← → to navigate · Esc to close</span><button type="button" disabled={photos.length < 2} onClick={() => move(1)} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-40">Next →</button></div>
    </dialog>}
  </>;
}
