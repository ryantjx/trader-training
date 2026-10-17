/**
 * Joining the site base with a path.
 *
 * `import.meta.env.BASE_URL` is whatever is configured in `base`, with **no**
 * trailing slash: `/trader-training`, not `/trader-training/`. So naively writing
 * `${base}quiz/fx` produces `/trader-trainingquiz/fx`, which 404s — and because
 * the page itself still renders, it looks like a styling problem rather than a
 * broken link.
 *
 * Always build internal links with this helper rather than string-concatenating
 * the base.
 */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return `${withSlash}${path.replace(/^\/+/, '')}`;
}
