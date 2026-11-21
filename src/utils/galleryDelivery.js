// Retry only known public gallery records, never arbitrary URLs or private files.
export function recoverGalleryImage(event, gallery, apiBase) {
  const image = event.target;
  if (image?.tagName !== 'IMG') return;
  const failedUrl = image.currentSrc || image.src;
  const photo = gallery.find((item) => [item.fileUrl, item.url, item.imageUrl, item.src].filter(Boolean).includes(failedUrl));
  const id = Number(photo?.fileId);
  if (!Number.isInteger(id) || id <= 0) return;
  const fallback = `${String(apiBase || '').replace(/\/+$/, '')}/gallery/public/${id}`;
  // Capture the first failure before a theme's handler hides the failed photo.
  // A failed fallback is left to the theme's existing unavailable-image UI.
  if (image.dataset.galleryFallback === fallback) return;
  image.dataset.galleryFallback = fallback;
  event.stopPropagation();
  image.src = fallback;
}
