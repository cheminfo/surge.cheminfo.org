import { useEffect } from 'react';

import { preferences } from '../../state/generator.ts';
import { runGeneration } from '../../state/generatorRun.ts';
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
  // A formula is a search, not a form to fill in again — whether a link named
  // it or the browser remembers it from the last visit.
  useEffect(() => {
    if (preferences.mf.peek()) void runGeneration();
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
