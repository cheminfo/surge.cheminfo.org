import { Callout, Card, H5 } from '@blueprintjs/core';

/**
 * What the generator does, and who to cite for it.
 * @returns The help panel component.
 */
export default function HelpPanel() {
  return (
    <Card>
      <H5>About</H5>
      <p>
        Every structural isomer of a molecular formula is generated, so the
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
        . Please cite McKay, B.D., Yirik, M.A., Steinbeck, C.{' '}
        <em>Surge: a fast open-source chemical graph generator.</em> J
        Cheminform 14, 24 (2022).{' '}
        <a
          href="https://doi.org/10.1186/s13321-022-00604-9"
          target="_blank"
          rel="noreferrer"
        >
          doi.org/10.1186/s13321-022-00604-9
        </a>
      </p>
    </Card>
  );
}
