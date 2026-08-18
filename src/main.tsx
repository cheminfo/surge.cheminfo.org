import { effect } from '@preact/signals-react';
import { StrictMode } from 'react';
import { startDocumentMeta } from 'react-cheminfo/core';
import { createRoot } from 'react-dom/client';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import App from './App.tsx';
import { PAGE_ROUTES } from './seo/routes.ts';
import { readGeneratorAddress } from './state/generatorUrl.ts';
import { PAGE_PATHS, route } from './state/router.ts';
import { absoluteUrl } from './state/site.ts';
import './index.css';

// Before the first paint, so a link opens on the search it names rather than
// on the last one this browser ran.
readGeneratorAddress();
startDocumentMeta({
  site: 'surge',
  routes: PAGE_ROUTES,
  url: () => PAGE_PATHS[route.page.value],
  // Read off the page rather than off the build, so a deployment under
  // `/surge` describes itself instead of an address it does not serve.
  origin: absoluteUrl('/'),
  follow: effect,
});

const container = document.querySelector('#root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
