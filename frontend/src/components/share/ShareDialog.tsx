import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogFooter,
  H6,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import { useState } from 'react';

import { FORMULAS_PARAM } from '../../state/exerciseSets.ts';
import { data } from '../../state/exercises.ts';
import { route } from '../../state/router.ts';
import type { HideKey, ShareConfig } from '../../state/shareConfig.ts';
import {
  SHARE_PARAM_KEYS,
  applyShareConfig,
  isShareConfigured,
  shareConfig,
  stringifyParams,
} from '../../state/shareConfig.ts';
import {
  defaultShareConfig,
  shareOptionsOf,
} from '../../state/shareOptions.ts';

import CodeBlock from './CodeBlock.tsx';
import CopyButton from './CopyButton.tsx';
import ShareExerciseSet from './ShareExerciseSet.tsx';

/**
 * Build a link to the page as it is set up now, and the iframe that frames it
 * in a course. What the page is working on comes from the address; what an
 * embedder may change comes from this dialog.
 * @param props - Whether the dialog is open, and how to dismiss it.
 * @returns The share dialog component.
 */
export default function ShareDialog(props: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useSignals();
  const options = shareOptionsOf(route.page.value);
  // The dialog opens on the link one actually hands out — a tile inside a
  // course, without the parts that course has no use for. A page already
  // running a configuration shows that one instead of resetting it.
  const [draft, setDraft] = useState<ShareConfig>(() =>
    isShareConfigured(shareConfig.value)
      ? shareConfig.value
      : defaultShareConfig(options),
  );
  // Until the teacher touches the list, the link hands out the whole set —
  // derived rather than copied at mount, so a set still loading when the
  // dialog opens does not leave it ticking nothing.
  const [chosen, setChosen] = useState<string[] | null>(null);
  const selected =
    chosen ?? data.set.value?.exercises.map((exercise) => exercise.mf) ?? [];

  function setHidden(key: HideKey, hidden: boolean): void {
    setDraft((previous) => {
      const rest = previous.hidden.filter((entry) => entry !== key);
      return { ...previous, hidden: hidden ? [...rest, key] : rest };
    });
  }

  const url = buildUrl(draft, options.hasExercises ? selected : null);

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Share or embed"
      icon="share"
      className="share-dialog"
    >
      {/* The link is what one came for, so it sits outside the scrolling body:
          always in view, and showing what every box below does to it. */}
      <div className="share-link">
        <p className="muted share-link-intro">
          A link to <b>{options.title}</b> as you have it set up now.
        </p>
        <CodeBlock code={url} />
        <div className="share-link-actions">
          <CopyButton code={url} text="Copy the link" />
          <Button
            icon="share"
            text="Open in a new tab"
            onClick={() => globalThis.open(url, '_blank', 'noopener')}
          />
          {/* The markup itself is never read: it is pasted. */}
          <CopyButton
            code={buildIframe(url, options.title)}
            text="Copy the iframe"
          />
        </div>
      </div>
      <DialogBody>
        <section className="share-section">
          <H6>Layout</H6>
          <Checkbox
            checked={draft.embed}
            label="Frame it: no header, no navigation"
            onChange={(event) => {
              const embed = event.currentTarget.checked;
              setDraft((previous) => ({ ...previous, embed }));
            }}
          />
          {draft.embed && !options.hasExercises ? (
            <span className="share-hint">
              A framed generator never shows the limit and the timeout: it runs
              on the ones this link carries.
            </span>
          ) : null}
        </section>

        {options.features.length > 0 ? (
          <section className="share-section">
            <H6>Show on the page</H6>
            {options.features.map((feature) => (
              <div key={feature.key} className="share-feature">
                <Checkbox
                  checked={!draft.hidden.includes(feature.key)}
                  label={feature.label}
                  onChange={(event) =>
                    setHidden(feature.key, !event.currentTarget.checked)
                  }
                />
                <span className="share-hint">{feature.description}</span>
              </div>
            ))}
          </section>
        ) : null}

        {options.hasExercises ? (
          <section className="share-section">
            <H6>Exercises</H6>
            <ShareExerciseSet selected={selected} onChange={setChosen} />
          </section>
        ) : null}
      </DialogBody>
      <DialogFooter
        actions={
          <Button intent="primary" text="Done" onClick={props.onClose} />
        }
      />
    </Dialog>
  );
}

/**
 * The address of the page, with the configuration of the dialog written over
 * whatever the current one carries.
 * @param config - What the dialog holds.
 * @param formulas - The chosen exercises, or null on a page without a set.
 * @returns The absolute address.
 */
function buildUrl(config: ShareConfig, formulas: readonly string[] | null) {
  const params = new URLSearchParams(globalThis.location.search);
  for (const key of SHARE_PARAM_KEYS) params.delete(key);
  applyShareConfig(params, config);
  if (formulas) applyExercises(params, formulas);

  const search = stringifyParams(params);
  const { origin, pathname } = globalThis.location;
  return `${origin}${pathname}${search ? `?${search}` : ''}`;
}

function applyExercises(
  params: URLSearchParams,
  formulas: readonly string[],
): void {
  const loaded = (data.set.peek()?.exercises ?? []).map(
    (exercise) => exercise.mf,
  );
  const isWholeSet =
    formulas.length === loaded.length &&
    formulas.every((mf, index) => mf === loaded[index]);

  if (formulas.length === 0) {
    // Nothing chosen: the set of the course, which is what a bare address gives.
    params.delete(FORMULAS_PARAM);
    params.delete('set');
  } else if (params.has('set') && isWholeSet) {
    // The document the teacher hosts still describes the set, wording included.
    params.delete(FORMULAS_PARAM);
  } else {
    params.delete('set');
    params.set(FORMULAS_PARAM, formulas.join(','));
  }

  const exercise = params.get('exercise');
  if (exercise && formulas.length > 0 && !formulas.includes(exercise)) {
    params.delete('exercise');
  }
}

function buildIframe(url: string, title: string): string {
  return `<iframe
  src="${url.replaceAll('&', '&amp;')}"
  width="100%"
  height="800"
  style="border: 1px solid #d3d8de; border-radius: 8px"
  title="Surge — ${title}"
></iframe>`;
}
