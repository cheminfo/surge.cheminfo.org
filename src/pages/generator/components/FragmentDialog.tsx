import { Button, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';
import { StructureEditor, fragmentQuery } from 'react-cheminfo/structure';

import { useT } from '../../../i18n/useT.ts';
import { data, view } from '../../../state/generator.ts';
import { runSearch } from '../../../state/generatorUrl.ts';

/**
 * Draw a fragment to keep only the isomers that contain it. Query features
 * are available, because the editor is in fragment mode.
 * @returns The fragment dialog component.
 */
export default function FragmentDialog() {
  useSignals();
  const t = useT();
  const isOpen = view.isFragmentDialogOpen.value;
  return (
    <Dialog
      isOpen={isOpen}
      icon="draw"
      title={t('ui.generator.substructure')}
      className="fragment-dialog"
      onClose={close}
    >
      {/* The body only exists while the dialog is open, so it starts from
          the fragment currently in use every time it is reopened. */}
      {isOpen ? <FragmentDialogBody /> : null}
    </Dialog>
  );
}

function FragmentDialogBody() {
  const t = useT();
  const [editor, setEditor] = useState(() => ({
    key: 0,
    code: data.fragmentCode.peek(),
  }));
  const [draft, setDraft] = useState(() => data.fragmentCode.peek());

  return (
    <>
      <DialogBody>
        <p className="muted">{t('ui.generator.fragmentHint')}</p>
        <StructureEditor
          className="structure-editor"
          fragment
          value={editor.code}
          // Reloading the canvas is how the editor is emptied: it owns what is
          // drawn on it.
          revision={editor.key}
          // Every stroke: Apply filter is one click away from the last one, and
          // a fragment still waiting out a delay would be applied as nothing.
          debounce={0}
          onChange={(change) => {
            // An erased drawing still has an idCode, and taking it for a filter
            // would quietly reject every structure.
            setDraft(fragmentQuery(change.idCode).isEmpty ? '' : change.idCode);
          }}
        />
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button
              icon="eraser"
              text={t('ui.generator.clear')}
              disabled={!draft}
              onClick={() => {
                setDraft('');
                setEditor((value) => ({ key: value.key + 1, code: '' }));
              }}
            />
            <Button text={t('ui.generator.cancel')} onClick={close} />
            <Button
              intent="primary"
              icon="filter"
              text={t('ui.generator.applyFilter')}
              onClick={() => {
                data.fragmentCode.value = draft;
                view.isFragmentDialogOpen.value = false;
                void runSearch();
              }}
            />
          </>
        }
      />
    </>
  );
}

function close(): void {
  view.isFragmentDialogOpen.value = false;
}
