import { effect } from '@preact/signals-react';
import { StrictMode } from 'react';
import { startDocumentMeta } from 'react-cheminfo/core';
import { createRoot } from 'react-dom/client';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import App from './App.tsx';
import { startTranslateMode } from './i18n/translateMode.ts';
import { PAGE_ROUTES } from './seo/routes.ts';
import { readGeneratorAddress } from './state/generatorUrl.ts';
import { applyLanguageFromSearch } from './state/language.ts';
import { PAGE_PATHS, route } from './state/router.ts';
import { absoluteUrl } from './state/site.ts';
import './index.css';

// Before the first paint, so a link opens on the search it names rather than
// on the last one this browser ran, and in the language it names rather than
// in the one this browser last chose.
readGeneratorAddress();
applyLanguageFromSearch(globalThis.location.search);
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

// `?translate=<locale>` turns the page over to a translator: every message is
// marked, the session is exposed, and the overlay is fetched. The page renders
// first and is rewritten when the session arrives, so translate mode costs an
// ordinary visit nothing.
void startTranslateMode(globalThis.location.search);
