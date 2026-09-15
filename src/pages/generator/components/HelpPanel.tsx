import { Callout, Card, H5 } from '@blueprintjs/core';
import { CiteButton } from 'react-cheminfo/ui';

import { SURGE_WORKS } from '../../../data/papers.ts';

/**
 * What the generator does, and who to cite for it.
 * @returns The help panel component.
 */
export default function HelpPanel() {
  return (
    <Card>
      <H5>About</H5>
      <p>
        Every constitutional isomer of a molecular formula is generated, so the
        number grows very quickly: past a certain size the enumeration cannot
        finish, and the answer says so instead of pretending to be complete.
      </p>
      <Callout intent="warning" icon="info-sign">
        A crossed bond is a double bond that is either cis or trans:
        stereochemistry is not enumerated.
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
