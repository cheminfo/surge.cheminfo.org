import { useEffect } from 'react';

import { runGeneration } from '../../state/generatorRun.ts';
import { searchParameter } from '../../state/router.ts';
import { isHidden } from '../../state/shareConfig.ts';

import ExportDialog from './components/ExportDialog.tsx';
import FormulaPanel from './components/FormulaPanel.tsx';
import FragmentDialog from './components/FragmentDialog.tsx';
import HelpPanel from './components/HelpPanel.tsx';
import ResultsPanel from './components/ResultsPanel.tsx';

/**
 * Enumerate the isomers of a molecular formula and look at them. The search
 * stays on the left and the drawings on the right, so a new result is on
 * screen without scrolling.
 * @returns The generator page component.
 */
export default function GeneratorPage() {
  // A link that names a formula is a search, not a form to fill in again.
  useEffect(() => {
    if (searchParameter('mf')) void runGeneration();
  }, []);

  return (
    <div className="generator">
      <div className="panel-stack">
        <FormulaPanel />
        {isHidden('about') ? null : (
          <div className="generator-about">
            <HelpPanel />
          </div>
        )}
      </div>
      <div className="panel-stack">
        <ResultsPanel />
      </div>
      <FragmentDialog />
      {isHidden('lists') ? null : <ExportDialog />}
    </div>
  );
}
