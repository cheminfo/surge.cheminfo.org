import { Callout, Card, H5 } from '@blueprintjs/core';
import { CiteButton, Prose } from 'react-cheminfo/ui';

import { SURGE_WORKS } from '../../../data/papers.ts';
import { useT } from '../../../i18n/useT.ts';

const SURGE_LINK = (
  <a
    href="https://github.com/StructureGenerator/surge"
    target="_blank"
    rel="noreferrer"
  >
    Surge
  </a>
);

/**
 * What the generator does, and who to cite for it.
 * @returns The help panel component.
 */
export default function HelpPanel() {
  const t = useT();
  return (
    <Card>
      <H5>{t('ui.generator.about')}</H5>
      <p>{t('ui.generator.helpGrowth')}</p>
      <Callout intent="warning" icon="info-sign">
        {t('ui.generator.helpCrossed')}
      </Callout>
      <p style={{ marginTop: 12 }}>
        <Prose
          text={t('ui.generator.helpFrontEnd')}
          nodes={{ surge: SURGE_LINK }}
        />
      </p>
      <CiteButton works={SURGE_WORKS} placement="bottom-start" />
    </Card>
  );
}
