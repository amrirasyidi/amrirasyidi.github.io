const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/blog/images/*.{png,jpg,jpeg,gif,webp,avif}',
  { eager: true },
);

export function resolveBlogImage(src: string): ImageMetadata | null {
  if (/^https?:\/\//.test(src)) return null;
  const key = src.replace(/^\/assets\//, '/src/assets/');
  return images[key]?.default ?? null;
}
