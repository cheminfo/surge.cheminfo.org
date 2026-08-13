import { Button } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useEffect, useState } from 'react';

import { fetchVersion } from './api/surge.ts';
import ShareDialog from './components/share/ShareDialog.tsx';
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
    <div className="page">
      {isEmbedded() ? null : <Header page={page} />}
      <CurrentPage page={page} />
    </div>
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

  return (
    <header className="page-header">
      <h1>
        Surge
        <span className="page-header-subtitle">
          structural isomers of a molecular formula
        </span>
      </h1>
      <nav className="page-nav">
        {TABS.map((tab) => (
          <button
            key={tab.page}
            type="button"
            className={
              tab.page === props.page ? 'page-tab page-tab--active' : 'page-tab'
            }
            onClick={() => navigate(tab.page)}
          >
            {tab.label}
          </button>
        ))}
        <a href="/docs">API</a>
        <a
          href="https://github.com/StructureGenerator/surge"
          target="_blank"
          rel="noreferrer"
        >
          Surge{version ? ` ${version}` : ''}
        </a>
        <Button
          size="small"
          icon="share"
          text="Share"
          title="Share a link to this page, or frame it in your own site"
          onClick={() => {
            // The generator writes its search when it runs one; a form left
            // unsearched would otherwise be shared as the previous result.
            if (props.page === 'generator') writeGeneratorAddress();
            setSharing(true);
          }}
        />
      </nav>
      {isSharing ? (
        <ShareDialog isOpen onClose={() => setSharing(false)} />
      ) : null}
    </header>
  );
}
