import { Callout, Card, H5 } from '@blueprintjs/core';
import { CiteButton } from 'react-cheminfo/ui';

import { SURGE_WORKS } from '../../../data/papers.ts';
import { useT } from '../../../i18n/useT.ts';

/**
 * What the generator does, and who to cite for it.
 * @returns The help panel component.
 */
export default function HelpPanel() {
  const t = useT();
  return (
    <Card>
      <H5>{t('ui.generator.about')}</H5>
      <p>
        Every constitutional isomer of a molecular formula is generated, so the
        number grows very quickly: past a certain size the enumeration cannot
        finish, and the answer says so instead of pretending to be complete.
      </p>
      <Callout intent="warning" icon="info-sign">
        {t('ui.generator.helpCrossed')}
      </Callout>
      <p style={{ marginTop: 12 }}>
        This service is a front end for{' '}
        <a
          href="https://github.com/StructureGenerator/surge"
          target="_blank"
          rel="noreferrer"
        >
          Surge
        </a>
        , run in the browser. Please cite both works: data processing in the
        browser and the isomer generator.
      </p>
      <CiteButton works={SURGE_WORKS} placement="bottom-start" />
    </Card>
  );
}
