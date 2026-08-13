import FormulaPanel from './components/FormulaPanel.tsx';
import FragmentPanel from './components/FragmentPanel.tsx';
import HelpPanel from './components/HelpPanel.tsx';
import ListsPanel from './components/ListsPanel.tsx';
import OptionsPanel from './components/OptionsPanel.tsx';
import ResultsPanel from './components/ResultsPanel.tsx';

/**
 * Enumerate the isomers of a molecular formula and look at them.
 * @returns The generator page component.
 */
export default function GeneratorPage() {
  return (
    <div className="panel-stack">
      <div className="panel-grid">
        <div className="panel-stack">
          <FormulaPanel />
          <HelpPanel />
        </div>
        <OptionsPanel />
        <FragmentPanel />
      </div>
      <ResultsPanel />
      <ListsPanel />
    </div>
  );
}
