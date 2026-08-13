import {
  Button,
  Callout,
  Card,
  H5,
  InputGroup,
  NonIdealState,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import { useCallback, useEffect, useState } from 'react';
import { MF } from 'react-mf';

import type { Fragment, FragmentUsage } from '../../api/surge.ts';
import { fetchFragmentUsage, fetchFragments } from '../../api/surge.ts';
import { navigate, searchParameter } from '../../state/router.ts';
import { errorMessage } from '../../utils/errorMessage.ts';

import FragmentCard from './components/FragmentCard.tsx';

const CATEGORY_TITLES: Record<string, string> = {
  ring: 'Rings',
  unsaturation: 'Multiple bonds',
  oxygen: 'Oxygen',
  nitrogen: 'Nitrogen',
  sulfur: 'Sulfur',
  halogen: 'Halogens',
  skeleton: 'Carbon skeleton',
};

/**
 * What the service looks for when it advises a student: every motif, the
 * query that finds it, and the sentence it produces. Give it a formula and it
 * also says how many of that formula's isomers hold each motif.
 * @returns The fragments page component.
 */
export default function FragmentsPage() {
  const [fragments, setFragments] = useState<Fragment[] | null>(null);
  const [error, setError] = useState('');
  // Read once, when the page opens: after that the form owns which formula is
  // being looked at, and it writes the address rather than reading it.
  const [asked] = useState(() => searchParameter('mf') ?? '');
  const [formula, setFormula] = useState(asked);
  const usage = useFragmentUsage();

  useEffect(() => {
    fetchFragments()
      .then(setFragments)
      .catch((error_: unknown) => setError(errorMessage(error_)));
  }, []);

  if (error) {
    return (
      <Card>
        <NonIdealState
          icon="error"
          title="No fragment could be read"
          description={error}
        />
      </Card>
    );
  }
  if (!fragments) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  const byId = new Map(fragments.map((fragment) => [fragment.id, fragment]));
  const categories = [
    ...new Set(fragments.map((fragment) => fragment.category)),
  ];

  return (
    <div className="fragments">
      <Card>
        <div className="card-header">
          <H5>Fragments</H5>
          <Tag minimal>{fragments.length} motifs</Tag>
        </div>
        <p className="muted">
          Every structure the service sees — an answer of an exercise, or one a
          student drew — is searched for these motifs. What the answers hold and
          what the student holds are then compared, and the difference is the
          hint. Each motif is one or more openchemlib query fragments, given
          below as the idCodes that are actually searched with.
        </p>
        <form
          className="field-row"
          onSubmit={(event) => {
            event.preventDefault();
            void usage.load(formula);
          }}
        >
          <InputGroup
            placeholder="C4H8O"
            value={formula}
            autoComplete="off"
            spellCheck={false}
            onValueChange={setFormula}
          />
          <Button
            type="submit"
            icon="search"
            text="Count in the isomers"
            loading={usage.isLoading}
            disabled={!formula.trim()}
          />
          {usage.mf ? (
            <span className="muted">
              <MF mf={usage.mf} /> has {usage.count} isomers
            </span>
          ) : null}
        </form>
        {usage.error ? (
          <Callout intent="danger" style={{ marginTop: 8 }}>
            {usage.error}
          </Callout>
        ) : null}
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <H5>{CATEGORY_TITLES[category] ?? category}</H5>
          <div className="fragment-grid">
            {fragments
              .filter((fragment) => fragment.category === category)
              .map((fragment) => (
                <FragmentCard
                  key={fragment.id}
                  fragment={fragment}
                  parentLabel={
                    fragment.parent
                      ? byId.get(fragment.parent)?.label
                      : undefined
                  }
                  usage={usage.byId.get(fragment.id)}
                  answers={usage.mf ? usage.count : undefined}
                />
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * How often each motif appears in the isomers of one formula, kept out of the
 * page so the page stays about the library. The formula the address names is
 * counted as soon as the page opens.
 * @returns The counts, and the way to ask for another formula.
 */
function useFragmentUsage() {
  const [counted, setCounted] = useState<{
    mf: string;
    count: number;
    byId: Map<string, FragmentUsage>;
  }>({ mf: '', count: 0, byId: new Map() });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apply = useCallback((result: FragmentUsageResult): void => {
    setCounted({
      mf: result.mf,
      count: result.count,
      byId: new Map(result.usage.map((entry) => [entry.id, entry])),
    });
    // The address carries the formula, so the page can be handed around.
    navigate('fragments', { mf: result.mf }, { replace: true });
  }, []);

  const load = useCallback(
    async (formula: string): Promise<void> => {
      setLoading(true);
      setError('');
      try {
        apply(await fetchFragmentUsage(formula.trim()));
      } catch (error_) {
        setCounted({ mf: '', count: 0, byId: new Map() });
        setError(errorMessage(error_));
      } finally {
        setLoading(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    const asked = searchParameter('mf');
    if (!asked) return;
    fetchFragmentUsage(asked)
      .then(apply)
      .catch((error_: unknown) => setError(errorMessage(error_)));
  }, [apply]);

  return { ...counted, isLoading, error, load };
}

type FragmentUsageResult = Awaited<ReturnType<typeof fetchFragmentUsage>>;
