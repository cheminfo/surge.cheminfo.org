import { useSignals } from '@preact/signals-react/runtime';
import { useEffect } from 'react';

import { fetchVersion } from './api/surge.ts';
import ExercisesPage from './pages/exercises/ExercisesPage.tsx';
import GeneratorPage from './pages/generator/GeneratorPage.tsx';
import { data } from './state/generator.ts';
import type { Page } from './state/router.ts';
import { isEmbedded, navigate, route } from './state/router.ts';

const TABS: Array<{ page: Page; label: string }> = [
  { page: 'generator', label: 'Generator' },
  { page: 'exercises', label: 'Exercises' },
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
      {isEmbedded ? null : <Header page={page} />}
      {page === 'exercises' ? <ExercisesPage /> : <GeneratorPage />}
    </div>
  );
}

function Header(props: { page: Page }) {
  useSignals();
  const version = data.surgeVersion.value;
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
      </nav>
    </header>
  );
}
