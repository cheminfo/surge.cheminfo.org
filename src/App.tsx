import { Icon } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useEffect, useState } from 'react';
import { CiteButton, EcosystemButton, EcosystemLinks } from 'react-cheminfo/ui';

import { fetchVersion } from './api/surge.ts';
import { BrandMark, Wordmark } from './components/Brand.tsx';
import ShareDialog from './components/share/ShareDialog.tsx';
import { useCompactHeader } from './components/useCompactHeader.ts';
import { SURGE_PAPER } from './data/surgePaper.ts';
import ExercisesPage from './pages/exercises/ExercisesPage.tsx';
import FragmentsPage from './pages/fragments/FragmentsPage.tsx';
import GeneratorPage from './pages/generator/GeneratorPage.tsx';
import NewsPage from './pages/news/NewsPage.tsx';
import { data } from './state/generator.ts';
import { writeGeneratorAddress } from './state/generatorUrl.ts';
import type { Page } from './state/router.ts';
import { navigate, route } from './state/router.ts';
import { isEmbedded } from './state/shareConfig.ts';

const TABS: Array<{ page: Page; label: string }> = [
  { page: 'generator', label: 'Generator' },
  { page: 'exercises', label: 'Exercises' },
  { page: 'fragments', label: 'Fragments' },
  { page: 'news', label: 'News' },
];

/**
 * Application shell: the header, the two pages, and nothing else. Framed in a
 * course, the header is left out so the activity gets the whole surface.
 * @returns The application component.
 */
export default function App() {
  useSignals();
  const page = route.page.value;

  useEffect(() => {
    fetchVersion()
      .then((version) => {
        data.surgeVersion.value = version;
      })
      .catch(() => {
        // the version is decoration; a failure must not hide the page
      });
  }, []);

  return (
    <>
      {isEmbedded() ? null : <Header page={page} />}
      <div className="page">
        <CurrentPage page={page} />
      </div>
      {isEmbedded() ? null : (
        <footer className="app-footer no-print">
          <div className="app-footer__inner">
            <EcosystemLinks currentSiteId="surge" />
          </div>
        </footer>
      )}
    </>
  );
}

function CurrentPage(props: { page: Page }) {
  if (props.page === 'exercises') return <ExercisesPage />;
  if (props.page === 'fragments') return <FragmentsPage />;
  if (props.page === 'news') return <NewsPage />;
  return <GeneratorPage />;
}

function Header(props: { page: Page }) {
  useSignals();
  const version = data.surgeVersion.value;
  const [isSharing, setSharing] = useState(false);
  const compact = useCompactHeader();

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <a href="/" className="brand" title="surge.cheminfo.org">
            <BrandMark />
            <Wordmark />
          </a>
          <nav className="page-nav">
            {TABS.map((tab) => (
              <button
                key={tab.page}
                type="button"
                className={
                  tab.page === props.page
                    ? 'nav-link nav-link--active'
                    : 'nav-link'
                }
                onClick={() => navigate(tab.page)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="app-header-actions">
            <a
              className="nav-link"
              href="https://github.com/StructureGenerator/surge"
              target="_blank"
              rel="noreferrer"
            >
              Surge{version ? ` ${version}` : ''}
            </a>
            <CiteButton reference={SURGE_PAPER} compact={compact} />
            <EcosystemButton currentSiteId="surge" compact={compact} />
            <button
              type="button"
              className="nav-link"
              title="Share a link to this page, or frame it in your own site"
              aria-label="Share"
              onClick={() => {
                // The generator writes its search when it runs one; a form left
                // unsearched would otherwise be shared as the previous result.
                if (props.page === 'generator') writeGeneratorAddress();
                setSharing(true);
              }}
            >
              <Icon icon="share" size={14} />
              {compact ? null : 'Share'}
            </button>
          </div>
        </div>
      </header>
      <p className="app-tagline">
        constitutional isomers of a molecular formula
      </p>
      {isSharing ? (
        <ShareDialog isOpen onClose={() => setSharing(false)} />
      ) : null}
    </>
  );
}
