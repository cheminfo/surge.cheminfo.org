import react from '@vitejs/plugin-react';
import { trimTrailingSlash } from 'react-cheminfo/core';
import { cheminfoPrerender } from 'react-cheminfo/vite';
import { defineConfig } from 'vite';

import { PAGE_ROUTES } from './src/seo/routes.ts';
import { configuredSiteUrl } from './src/state/sitePath.ts';

// The project's own port, derived from its creation date, never Vite's stock
// 5173: two checkouts must not fight over one. There is nothing to proxy to any
// more — the page answers itself.
const port = Number(process.env.PORT ?? 31228);

// The address this build names as its own, for the canonical link, the social
// card and the sitemap. Passed to the prerenderer as its origin, mount path
// included, so a build published under `/surge` writes its addresses under it.
// It says nothing about where the build is *mounted* — see `base` below.
const siteUrl = configuredSiteUrl();

export default defineConfig({
  // The build carries no mount path. Every asset is written relative, so the
  // one `dist` serves `https://surge.cheminfo.org/` and
  // `https://www.cheminfo.org/surge/` without being rebuilt: the `<base>` the
  // container stamps in at startup is what resolves them, and the page reads
  // its mount back off that. Baking a path in here would pin the build to one
  // of the two addresses.
  base: './',
  plugins: [
    react(),
    cheminfoPrerender({
      site: 'surge',
      routes: PAGE_ROUTES,
      // Origin *and* mount: `pageDocumentMeta` writes `${origin}${route.path}`,
      // so a SITE_URL of `https://example.org/surge/` puts every canonical,
      // og:url, og:image and sitemap entry under the mount, as the deleted
      // `scripts/prerender.js` did with `joinBasePath`.
      origin: trimTrailingSlash(siteUrl),
      // What the tool is, in the structured-data block a crawler reads. It says
      // more than the tile the family menu carries, so it is written here
      // rather than left to the tagline.
      operatingSystem: 'Any',
      description:
        'Enumerate every constitutional isomer of a molecular formula with Surge in the browser, keep only the isomers containing a fragment you draw, and practise finding the isomers yourself.',
      noscript: {
        heading: 'surge.cheminfo.org — constitutional isomers',
        intro:
          'Type a molecular formula and get every constitutional isomer of it, enumerated by Surge running as WebAssembly in your browser — so nothing is uploaded and nothing is queued. The tool therefore needs JavaScript.',
        // Relative, resolved against the `<base>` the container stamps in: the
        // build bakes in no mount, so one image answers both
        // `surge.cheminfo.org` and `www.cheminfo.org/surge`.
        hrefs: 'relative',
        ecosystem: { taglines: false },
      },
    }),
  ],
  build: {
    target: 'esnext',
  },
  // Surge is reached from a worker, so the startup scan never walks to it and
  // it is discovered on the first enumeration instead — which reloads the page
  // under whoever asked for it.
  optimizeDeps: {
    include: ['surge-wasm'],
  },
  server: {
    port,
    // Fail loudly rather than drifting to the next free port, which would
    // leave the dev script and the README disagreeing.
    strictPort: true,
  },
});
