import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import App from './App.tsx';
import { startDocumentMeta } from './state/documentMeta.ts';
import { readGeneratorAddress } from './state/generatorUrl.ts';
import './index.css';

// Before the first paint, so a link opens on the search it names rather than
// on the last one this browser ran.
readGeneratorAddress();
startDocumentMeta();

const container = document.querySelector('#root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
