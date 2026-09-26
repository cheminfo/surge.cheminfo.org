import { Card, Tag } from '@blueprintjs/core';
import { Molecule } from 'openchemlib';
import { useMemo } from 'react';
import { ClickToCopy } from 'react-cheminfo/ui';
import { IdcodeSvgRenderer, SvgRenderer } from 'react-ocl';

import type { Fragment, FragmentUsage } from '../../../api/surge.ts';
import {
  fragmentDescription,
  fragmentLabel,
  fragmentMissing,
  fragmentPartial,
} from '../../../chemistry/fragments/index.ts';
import { useLanguage, useT } from '../../../i18n/useT.ts';

interface FragmentCardProps {
  fragment: Fragment;
  /** Label of the motif this one waits for, when it waits for one. */
  parentLabel?: string;
  /** How often the motif appears in the formula being looked at. */
  usage?: FragmentUsage;
  /** How many isomers that formula has, for the ratio. */
  answers?: number;
}

/**
 * One motif of the library: what it draws, what it means, and the sentence a
 * student hears when they have not found it.
 * @param props - The motif and what an exercise makes of it.
 * @returns The fragment card component.
 */
export default function FragmentCard(props: FragmentCardProps) {
  const t = useT();
  const language = useLanguage();
  const { fragment, parentLabel, usage, answers } = props;

  return (
    <Card className="fragment-card" data-testid={`fragment-${fragment.id}`}>
      <div className="fragment-card-header">
        <div className="fragment-queries">
          {fragment.idCodes.map((idCode) => (
            <QueryDrawing key={idCode} idCode={idCode} />
          ))}
        </div>
        <div>
          <div className="fragment-label">
            {fragmentLabel(fragment, language)}
          </div>
          <ClickToCopy
            as="code"
            className="fragment-id"
            value={fragment.id}
            label={t('ui.fragments.id')}
          >
            {fragment.id}
          </ClickToCopy>
        </div>
        {usage && answers !== undefined ? (
          <Tag
            minimal
            intent={usage.answers > 0 ? 'success' : 'none'}
            className="fragment-usage"
          >
            {usage.answers} / {answers}
          </Tag>
        ) : null}
      </div>

      <p className="fragment-description">
        {fragmentDescription(fragment, language)}
      </p>
      {parentLabel ? (
        <p className="muted">Only said once {parentLabel} has been found.</p>
      ) : null}

      <dl className="fragment-messages">
        <dt>{t('ui.fragments.neverDrawn')}</dt>
        <dd>{fragmentMissing(fragment, language)}</dd>
        <dt>{t('ui.fragments.halfExplored')}</dt>
        <dd>{fragmentPartial(fragment, language)}</dd>
      </dl>

      <div className="fragment-codes">
        {fragment.idCodes.map((idCode) => (
          <ClickToCopy
            as="code"
            key={idCode}
            value={idCode}
            label={t('ui.fragments.queryIdCode')}
          >
            {idCode}
          </ClickToCopy>
        ))}
      </div>

      {usage?.example ? (
        <div className="fragment-example">
          <span className="muted">{t('ui.fragments.matchedIn')}</span>
          <IdcodeSvgRenderer idcode={usage.example} width={110} autoCrop />
        </div>
      ) : null}
    </Card>
  );
}

function QueryDrawing(props: { idCode: string }) {
  const { idCode } = props;
  // An idCode carries the query features but not the flag saying the
  // structure is a query, and only a fragment draws them.
  const molecule = useMemo(() => {
    const query = Molecule.fromIDCode(idCode);
    query.setFragment(true);
    query.inventCoordinates();
    return query;
  }, [idCode]);

  return <SvgRenderer molecule={molecule} width={110} height={80} autoCrop />;
}
