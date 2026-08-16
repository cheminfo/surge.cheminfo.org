import { Button, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';

import StructureEditor from '../../../components/StructureEditor.tsx';
import { countAtoms } from '../../../components/editorValue.ts';
import { data, view } from '../../../state/generator.ts';
import { runSearch } from '../../../state/generatorUrl.ts';

/**
 * Draw a fragment to keep only the isomers that contain it. Query features
 * are available, because the editor is in fragment mode.
 * @returns The fragment dialog component.
 */
export default function FragmentDialog() {
  useSignals();
  const isOpen = view.isFragmentDialogOpen.value;
  return (
    <Dialog
      isOpen={isOpen}
      icon="draw"
      title="Substructure filter"
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
  const [editor, setEditor] = useState(() => ({
    key: 0,
    code: data.fragmentCode.peek(),
  }));
  const [draft, setDraft] = useState(() => data.fragmentCode.peek());

  return (
    <>
      <DialogBody>
        <p className="muted">
          Draw a fragment to keep only the isomers containing it. Leave it empty
          to keep them all.
        </p>
        <StructureEditor
          // Remounting is how the editor is emptied: it owns its canvas.
          key={editor.key}
          fragment
          initialIdCode={editor.code}
          onChange={(idCode) => {
            // An erased drawing still has an idCode, and taking it for a filter
            // would quietly reject every structure.
            setDraft(countAtoms(idCode) > 0 ? idCode : '');
          }}
        />
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button
              icon="eraser"
              text="Clear"
              disabled={!draft}
              onClick={() => {
                setDraft('');
                setEditor((value) => ({ key: value.key + 1, code: '' }));
              }}
            />
            <Button text="Cancel" onClick={close} />
            <Button
              intent="primary"
              icon="filter"
              text="Apply filter"
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
