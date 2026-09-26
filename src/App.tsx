import { useSignals } from '@preact/signals-react/runtime';
import { useEffect, useState } from 'react';
import {
  CiteButton,
  EcosystemButton,
  NavLink,
  ShareButton,
  SiteFooter,
  SiteHeader,
  SiteLanguage,
  SiteTheme,
  useCompactHeader,
} from 'react-cheminfo/ui';

import { fetchVersion } from './api/surge.ts';
import LanguageSelect from './components/LanguageSelect.tsx';
import ShareDialog from './components/share/ShareDialog.tsx';
import { SURGE_WORKS } from './data/papers.ts';
import type { MessageKey } from './i18n/messages.ts';
import { DEFAULT_LANGUAGE } from './i18n/messages.ts';
import { useLanguage, useT } from './i18n/useT.ts';
import About from './pages/about/AboutPage.tsx';
import ExercisesPage from './pages/exercises/ExercisesPage.tsx';
import FragmentsPage from './pages/fragments/FragmentsPage.tsx';
import GeneratorPage from './pages/generator/GeneratorPage.tsx';
import { data } from './state/generator.ts';
import { writeGeneratorAddress } from './state/generatorUrl.ts';
import { PAGE_PATHS } from './state/pages.ts';
import type { Page } from './state/router.ts';
import { navigate, route } from './state/router.ts';
import { isEmbedded } from './state/shareConfig.ts';
import { withBase } from './state/site.ts';

const TABS: Array<{ page: Page; key: MessageKey }> = [
  { page: 'generator', key: 'ui.tab.generator' },
  { page: 'exercises', key: 'ui.tab.exercises' },
  { page: 'fragments', key: 'ui.tab.fragments' },
];

/**
 * Application shell: the header, the two pages, and nothing else. Framed in a
 * course, the header is left out so the activity gets the whole surface.
 * @returns The application component.
 */
export default function App() {
  useSignals();
  const language = useLanguage();
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
    <SiteLanguage value={language === DEFAULT_LANGUAGE ? undefined : language}>
      <SiteTheme siteId="surge" />
      <div className="app-screen">
        {isEmbedded() ? null : <Header page={page} />}
        <main className="page">
          <CurrentPage page={page} />
        </main>
      </div>
      {isEmbedded() ? null : <SiteFooter siteId="surge" />}
    </SiteLanguage>
  );
}

function CurrentPage(props: { page: Page }) {
  if (props.page === 'exercises') return <ExercisesPage />;
  if (props.page === 'fragments') return <FragmentsPage />;
  if (props.page === 'about') return <About />;
  return <GeneratorPage />;
}

function Header(props: { page: Page }) {
  useSignals();
  const t = useT();
  const version = data.surgeVersion.value;
  const [isSharing, setSharing] = useState(false);
  const compact = useCompactHeader();

  return (
    <>
      <SiteHeader
        siteId="surge"
        homeHref={withBase('/')}
        activeId={props.page}
        nav={TABS.map((tab) => ({
          id: tab.page,
          label: t(tab.key),
          onSelect: () => navigate(tab.page),
        }))}
        actions={
          <>
            <NavLink
              item={{
                id: 'about',
                label: t('ui.generator.about'),
                icon: 'info-sign',
                href: withBase(PAGE_PATHS.about),
                onSelect: () => navigate('about'),
              }}
              active={props.page === 'about'}
            />
            <NavLink
              item={{
                id: 'surge',
                label: `Surge${version ? ` ${version}` : ''}`,
                icon: 'git-repo',
                href: 'https://github.com/StructureGenerator/surge',
                external: true,
                title: 'The surge program, on GitHub',
              }}
            />
            <CiteButton works={SURGE_WORKS} compact={compact} />
            <LanguageSelect compact={compact} />
            <EcosystemButton currentSiteId="surge" compact={compact} />
            <ShareButton
              compact={compact}
              title={t('ui.share.title')}
              onClick={() => {
                // The generator writes its search when it runs one; a form left
                // unsearched would otherwise be shared as the previous result.
                if (props.page === 'generator') writeGeneratorAddress();
                setSharing(true);
              }}
            />
          </>
        }
      />
      <p className="app-tagline">{t('ui.tagline')}</p>
      {isSharing ? (
        <ShareDialog isOpen onClose={() => setSharing(false)} />
      ) : null}
    </>
  );
}
