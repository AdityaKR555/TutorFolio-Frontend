import PlatformLoader from "../../components/PlatformLoader";
import KpiState from "../../components/KpiState";
import { useEffect, useRef, useState } from "react";
import { Images, Search, Trash2, ExternalLink, RefreshCw, ImageOff } from "lucide-react";
import GalleryArt from "./GalleryArt";
import api from "../../api/axios";
import { UPLOAD_LIMITS } from "../../api/uploadLimits";

const limits = UPLOAD_LIMITS["tuition-gallery-image"];
const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-tf-line bg-tf-surface px-4 py-2.5 text-sm font-medium text-tf-copy transition hover:bg-tf-surface-soft disabled:opacity-50";
function check(result) {
  if (result?.status !== 200) throw new Error(result?.message || "The request could not be completed.");
  return result;
}
function message(error) {
  return error.response?.data?.detail || error.response?.data?.message || error.message || "Something went wrong. Please try again.";
}
const formatSize = bytes => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(2)} MB`;
const imageType = image => {
  const extension = (image.originalFilename || image.fileUrl?.split("?")[0] || "").split(".").pop()?.toLowerCase();
  return extension === "jpeg" ? "jpg" : extension;
};
function GalleryPreview({ image }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div role="img" aria-label="Image unavailable" className="flex aspect-[12/5] flex-col items-center justify-center gap-2 bg-tf-surface-soft text-tf-muted"><ImageOff size={32}/><span className="text-sm">Image unavailable</span></div> : <img src={image.fileUrl} alt={image.originalFilename || "Tuition gallery image"} loading="lazy" onError={() => setFailed(true)} className="aspect-[12/5] w-full object-cover"/>;
}
export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const input = useRef(null);
  const dialog = useRef(null);
  async function load() {
    setLoading(true);
    try {
      const result = check((await api.get("/gallery", { timeout: 15000 })).data);
      const refreshed = result.data?.galleryImages || [];
      setImages(refreshed);
      setSelected(previous => new Set([...previous].filter(id => refreshed.some(image => image.fileId === id))));
      return true;
    } catch (err) { setError(message(err)); return false; }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    api.get("/gallery", { timeout: 15000 }).then(({ data }) => {
      check(data);
      if (active) setImages(data.data?.galleryImages || []);
    }).catch(err => { if (active) setError(message(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (deleting) dialog.current?.showModal(); }, [deleting]);
  async function upload(files) {
    if (uploading || !files.length) return;
    setError(""); setNotice("");
    const invalid = files.find(file => !limits.allowedMimeTypes.includes(file.type) || file.size > limits.maxSizeBytes || !file.size);
    if (invalid) { setError(`${invalid.name}: choose a JPG, PNG or WebP image up to ${limits.label}.`); return; }
    setUploading(true);
    let count = 0;
    const failures = [];
    for (const [index, file] of files.entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}…`);
      const form = new FormData(); form.append("file", file);
      try { check((await api.post("/gallery/upload", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })).data); count++; }
      catch (err) { failures.push(`${file.name}: ${message(err)}`); }
    }
    if (count) { setNotice(`${count} ${count === 1 ? "image" : "images"} uploaded.`); await load(); }
    if (failures.length) setError(failures.join(" "));
    setUploading(false); setProgress("");
  }
  async function remove() {
    setBusy(true); setError(""); setNotice("");
    const targets = deleting.items || [deleting];
    const removed = [];
    const errors = [];
    for (const image of targets) {
      try { check((await api.delete(`/gallery/${image.fileId}`, { timeout: 20000 })).data); removed.push(image.fileId); }
      catch (err) { errors.push(`${image.originalFilename}: ${message(err)}`); }
    }
    setImages(items => items.filter(item => !removed.includes(item.fileId)));
    setSelected(previous => new Set([...previous].filter(id => !removed.includes(id))));
    if (removed.length) setNotice(`${removed.length} ${removed.length === 1 ? "image" : "images"} deleted.`);
    if (errors.length) setError(errors.join(" "));
    setDeleting(null); setBusy(false);
  }
  const totalBytes = images.reduce((sum, image) => sum + (Number(image.fileSizeBytes) || 0), 0);
  const hasFilters = Boolean(query || typeFilter !== "all" || sizeFilter !== "all");
  const filtered = images.filter(image => {
    const bytes = Number(image.fileSizeBytes) || 0;
    return (image.originalFilename || "").toLowerCase().includes(query.trim().toLowerCase())
      && (typeFilter === "all" || imageType(image) === typeFilter)
      && (sizeFilter === "all" || (sizeFilter === "small" ? bytes < 102400 : bytes >= 102400));
  }).sort((a, b) => {
    const dateDiff = (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    if (sort === "name") return (a.originalFilename || "").localeCompare(b.originalFilename || "");
    if (sort === "largest") return (Number(b.fileSizeBytes) || 0) - (Number(a.fileSizeBytes) || 0);
    if (sort === "smallest") return (Number(a.fileSizeBytes) || 0) - (Number(b.fileSizeBytes) || 0);
    return sort === "oldest" ? -dateDiff : dateDiff;
  });
  return <div className="mobile-page mobile-gallery mx-auto max-w-7xl p-5 text-tf-ink sm:p-8">
    <header className="mobile-heading mb-7"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Gallery</h1><p className="mt-2 text-sm text-tf-copy sm:text-base">Share your classroom, learning moments, and tuition space.</p></header>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    <div role="status" aria-live="polite">{notice && <p className="mb-5 rounded-xl border border-tf-line bg-tf-sky p-4 text-sm text-tf-ink">{notice}</p>}</div>
    <div className="mb-8 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section aria-label="Gallery statistics" className="mobile-summary mobile-summary-two grid grid-cols-2 gap-4">
        {[["Total images", images.length, "images"], ["Storage used", formatSize(totalBytes), "storage"]].map(([label, value, type]) => <div key={type} className="relative min-h-36 overflow-hidden rounded-2xl border border-tf-line bg-tf-surface p-4 sm:p-5"><KpiState unavailable={Boolean(error) && images.length === 0} loading={loading} empty={images.length === 0} label={label} message="Make room for your teaching moments" kind="gallery"><p className="relative z-10 text-sm text-tf-copy">{label}</p><p className="relative z-10 mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p><GalleryArt type={type}/></KpiState></div>)}
      </section>
      <section aria-label="Upload gallery images" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!loading && !busy) upload(Array.from(event.dataTransfer.files)); }} className="mobile-gallery-upload flex flex-wrap items-center justify-center gap-5 rounded-2xl border border-dashed border-tf-blue bg-gradient-to-br from-tf-sky to-tf-surface px-5 py-5 sm:flex-nowrap sm:justify-start sm:gap-6">
        <GalleryArt type="upload" className="h-24 w-32 shrink-0"/><div className="min-w-0 text-center sm:border-l sm:border-tf-line sm:pl-6 sm:text-left"><h2 className="text-xl font-bold tracking-tight">Drop your images here</h2><p className="mt-1 text-base text-tf-copy">or <button disabled={uploading || loading || busy} onClick={() => input.current?.click()} className="font-semibold text-tf-blue underline underline-offset-4 disabled:opacity-50">browse files</button></p><p className="mt-2 text-xs text-tf-copy">JPG, PNG or WebP · Up to {limits.label} each</p>{uploading && <p role="status" className="mt-2 text-sm font-medium text-tf-blue">{progress}</p>}</div>
        <input ref={input} type="file" multiple accept={limits.allowedMimeTypes.join(",")} aria-label="Upload gallery images" className="sr-only" disabled={uploading || loading || busy} onChange={event => { upload(Array.from(event.target.files || [])); event.target.value = ""; }}/>
      </section>
    </div>
    <h2 className="mb-5 flex items-center gap-3 text-2xl font-bold"><Images size={25}/>Your images <span className="rounded-full bg-tf-sky px-3 py-1 text-base font-medium text-tf-blue">{images.length}</span></h2>
    <div className="mobile-gallery-filters mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(160px,2fr)_1fr_1fr_1fr_auto]"><label className="flex min-w-0 items-center gap-3 rounded-xl border border-tf-line bg-tf-surface px-3"><Search size={20} className="shrink-0 text-tf-muted"/><input aria-label="Search images" placeholder="Search images" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"/></label><select aria-label="Filter by image format" value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className={button}><option value="all">All formats</option><option value="jpg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select><select aria-label="Filter by image size" value={sizeFilter} onChange={event => setSizeFilter(event.target.value)} className={button}><option value="all">All sizes</option><option value="small">Under 100 KB</option><option value="large">100 KB and above</option></select><select aria-label="Sort images" value={sort} onChange={event => setSort(event.target.value)} className={button}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option><option value="largest">Largest first</option><option value="smallest">Smallest first</option></select><button aria-label="Refresh gallery" className={button} disabled={loading || uploading || busy} onClick={() => { setError(""); load(); }}><RefreshCw size={20}/></button></div>
    {selected.size > 0 && <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-tf-line bg-tf-sky px-4 py-3 text-sm"><span>{selected.size} selected</span><button onClick={() => setSelected(new Set())} className="text-tf-blue underline">Clear selection</button><button disabled={uploading || busy} onClick={() => setDeleting({items: images.filter(image => selected.has(image.fileId))})} className="ml-auto inline-flex items-center gap-2 font-semibold text-red-600 disabled:opacity-50"><Trash2 size={16}/>Delete selected</button></div>}
    {hasFilters && <div className="mb-4 flex items-center gap-3 text-sm text-tf-copy"><span>Showing {filtered.length} of {images.length} images</span><button className="font-semibold text-tf-blue underline underline-offset-4" onClick={() => { setQuery(""); setTypeFilter("all"); setSizeFilter("all"); }}>Clear filters</button></div>}
    {loading ? <div className="py-12 text-center"><PlatformLoader label="Loading gallery…" /></div> : filtered.length ? <div className="mobile-gallery-grid grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(image => <article key={image.fileId} className={`relative overflow-hidden rounded-2xl border bg-tf-surface shadow-sm transition hover:shadow-md ${selected.has(image.fileId) ? "border-tf-blue ring-1 ring-[var(--tf-blue)]" : "border-tf-line"}`}><input type="checkbox" aria-label={`Select ${image.originalFilename || "image"}`} checked={selected.has(image.fileId)} disabled={busy || uploading} onChange={event => setSelected(previous => {const next = new Set(previous); if(event.target.checked) next.add(image.fileId); else next.delete(image.fileId); return next;})} className="absolute left-3 top-3 z-10 h-5 w-5 cursor-pointer rounded border-slate-400 bg-white accent-[var(--tf-blue)]"/><a href={image.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${image.originalFilename || "gallery image"} in a new tab`} className="block bg-tf-surface-soft"><GalleryPreview image={image}/></a><div className="flex items-center gap-2 px-3 py-3"><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold" title={image.originalFilename}>{image.originalFilename || "Gallery image"}</h3><p className="mt-1 text-xs text-tf-copy">{formatSize(Number(image.fileSizeBytes) || 0)} · {imageType(image)?.toUpperCase() || "Image"}</p></div><a href={image.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${image.originalFilename || "image"} in a new tab`} title="View image" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-tf-line text-tf-ink hover:bg-tf-sky"><ExternalLink size={18}/></a><button disabled={uploading || busy} onClick={() => setDeleting(image)} aria-label={`Delete ${image.originalFilename || "image"}`} title="Delete image" className="mobile-icon-action grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"><Trash2 size={18}/></button></div></article>)}</div> : <div className="rounded-2xl border border-tf-line bg-tf-surface px-6 py-14 text-center"><Images size={36} className="mx-auto mb-4 text-tf-muted"/><h3 className="font-semibold">{hasFilters ? "No matching images" : "Your gallery starts here"}</h3><p className="mt-2 text-sm text-tf-copy">{hasFilters ? "Try another search or clear your filters." : "Upload your first image to display it on your public website."}</p></div>}
    {deleting && <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else setDeleting(null); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-tf-line bg-tf-surface p-6 text-tf-ink shadow-xl backdrop:bg-black/40"><h2 className="text-xl font-semibold">{deleting.items ? `Delete ${deleting.items.length} images?` : "Delete this image?"}</h2><p className="mt-3 break-words text-sm text-tf-copy">{deleting.items ? `${deleting.items.length} selected images` : `“${deleting.originalFilename || "Gallery image"}”`} will be removed from your gallery and public website. This cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><button disabled={busy} className={button} onClick={() => setDeleting(null)}>Cancel</button><button disabled={busy} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" onClick={remove}>{busy ? "Deleting…" : deleting.items ? "Delete images" : "Delete image"}</button></div></dialog>}
  </div>;
}
