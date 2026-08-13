import type { GenerateParameters, SurgeOptions } from '../api/surge.ts';
import { generate } from '../api/surge.ts';
import { errorMessage } from '../utils/errorMessage.ts';

import { data, preferences, view } from './generator.ts';
import { COUNTS, RANGES, SWITCHES } from './generatorOptions.ts';

/** Run the generation with what the form currently holds. */
export async function runGeneration(): Promise<void> {
  view.isGenerating.value = true;
  view.error.value = '';
  try {
    data.result.value = await generate(buildParameters());
  } catch (error) {
    data.result.value = null;
    view.error.value = errorMessage(error);
  } finally {
    view.isGenerating.value = false;
  }
}

/**
 * The request the form describes, read off the option descriptors rather than
 * listed again here: one place names a restriction, and the request, the
 * address and the form all follow it.
 * @returns What to ask the service for.
 */
function buildParameters(): GenerateParameters {
  const fragmentCode = data.fragmentCode.peek();
  return {
    mf: preferences.mf.peek(),
    limit: preferences.limit.peek(),
    timeout: preferences.timeout.peek(),
    idCode: preferences.idCode.peek(),
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
    Object.assign(options, { [option.name]: option.signal.peek() });
  }
  for (const option of RANGES) {
    const value = option.signal.peek().trim();
    if (value !== '') Object.assign(options, { [option.name]: value });
  }
  for (const option of COUNTS) {
    const value = option.signal.peek().trim();
    if (value !== '') Object.assign(options, { [option.name]: Number(value) });
  }
  return options;
}
