import { useSignals } from '@preact/signals-react/runtime';

import type { RunProgress as Progress } from '../../../api/surge.ts';
import RunProgressBar from '../../../components/RunProgressBar.tsx';
import { view } from '../../../state/generator.ts';
import { cancelGeneration } from '../../../state/generatorRun.ts';

/**
 * How far the search has got, and the way out of it. Reading a large
 * enumeration — the substructure filter searches every structure surge wrote —
 * is the longest part of a search, and the one nobody can guess the end of.
 * @returns The progress of the run, or nothing when none is running.
 */
export default function RunProgress() {
  useSignals();
  if (!view.isGenerating.value) return null;

  const progress = view.progress.value;
  const examined =
    progress?.phase === 'filter' && progress.total ? progress.total : 0;
  return (
    <RunProgressBar
      label={describe(progress)}
      value={examined > 0 && progress ? progress.done / examined : undefined}
      onCancel={cancelGeneration}
    />
  );
}

function describe(progress: Progress | null): string {
  if (progress === null) return 'Starting the search…';
  if (progress.phase === 'generate') {
    return `${progress.done} structures enumerated`;
  }
  return progress.total === undefined
    ? `${progress.done} structures examined`
    : `Examining ${progress.done} of ${progress.total} structures`;
}
