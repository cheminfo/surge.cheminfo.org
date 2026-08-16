import { computed } from '@preact/signals-react';

import type { GenerateParameters, SurgeOptions } from '../api/surge.ts';
import { CancelledError, cancelEverything, generate } from '../api/surge.ts';
import { errorMessage } from '../utils/errorMessage.ts';

import { data, preferences, view } from './generator.ts';
import { COUNTS, RANGES, SWITCHES } from './generatorOptions.ts';

/**
 * Take a formula to enumerate. The substructure filter was drawn against the
 * formula it was applied to, so a new one starts without it: a filter left on
 * from the previous search silently rejects everything the new query finds.
 * @param mf - The formula the form now holds.
 */
export function setFormula(mf: string): void {
  if (mf === preferences.mf.peek()) return;
  preferences.mf.value = mf;
  data.fragmentCode.value = '';
}

/** Run the generation with what the form currently holds. */
export async function runGeneration(): Promise<void> {
  const parameters = buildParameters();
  view.isGenerating.value = true;
  view.progress.value = null;
  view.error.value = '';
  try {
    data.result.value = await generate(parameters, {
      onProgress: (progress) => {
        view.progress.value = progress;
      },
    });
    data.lastRequest.value = JSON.stringify(parameters);
  } catch (error) {
    // Giving up is not a failure: what was on screen stays, and nothing is
    // said about a search the visitor themselves ended.
    if (!(error instanceof CancelledError)) {
      data.result.value = null;
      data.lastRequest.value = '';
      view.error.value = errorMessage(error);
    }
  } finally {
    view.isGenerating.value = false;
    view.progress.value = null;
  }
}

/**
 * Give up on the run. Nothing can be asked to stop from outside, so the worker
 * is ended and every call waiting on it fails as cancelled.
 */
export function cancelGeneration(): void {
  if (!view.isGenerating.peek()) return;
  cancelEverything();
}

/**
 * Whether the result on screen is the one this form asks for. Enumerating the
 * same formula under the same restrictions again can only give the same list,
 * so the search is offered once and comes back the moment anything changes.
 */
export const isResultCurrent = computed(
  () =>
    data.result.value !== null &&
    data.lastRequest.value === JSON.stringify(buildParameters()),
);

/**
 * The request the form describes, read off the option descriptors rather than
 * listed again here: one place names a restriction, and the request, the
 * address and the form all follow it.
 * @returns What to ask the service for.
 */
function buildParameters(): GenerateParameters {
  const fragmentCode = data.fragmentCode.value;
  return {
    mf: preferences.mf.value,
    limit: preferences.limit.value,
    timeout: preferences.timeout.value,
    idCode: preferences.idCode.value,
    ...(fragmentCode ? { fragmentCode } : {}),
    ...restrictions(),
  };
}

/**
 * What the form asks surge to leave out. An empty field is not a restriction,
 * so it never reaches the request and surge keeps its own default.
 * @returns The restrictions in force.
 */
function restrictions(): SurgeOptions {
  const options: SurgeOptions = {};
  for (const option of SWITCHES) {
    Object.assign(options, { [option.name]: option.signal.value });
  }
  for (const option of RANGES) {
    const value = option.signal.value.trim();
    if (value !== '') Object.assign(options, { [option.name]: value });
  }
  for (const option of COUNTS) {
    const value = option.signal.value.trim();
    if (value !== '') Object.assign(options, { [option.name]: Number(value) });
  }
  return options;
}
