import { data, preferences } from './generator.ts';
import { COUNTS, RANGES, SWITCHES, TEXTS } from './generatorOptions.ts';
import { isResultCurrent, runGeneration } from './generatorRun.ts';
import { navigate, route } from './router.ts';

/** What the form holds on a first visit, and therefore stays out of a link. */
const DEFAULT_LIMIT = 1_000_000;
const DEFAULT_TIMEOUT = 2;

/** What the service accepts, so a link cannot ask for a run that never ends. */
const MAX_LIMIT = 1_000_000;
const MAX_TIMEOUT = 30;

/** A range is `max` or `min:max`; anything else is not surge's language. */
const RANGE = /^\d+(?:[:-]\d+)?$/;
const COUNT = /^\d+$/;

/**
 * Run the search and record it in the address, so what is on screen is what a
 * link to it reproduces. A search whose answer is already on screen is not run
 * again, whatever asked for it.
 */
export async function runSearch(): Promise<void> {
  if (isResultCurrent.peek()) return;
  writeGeneratorAddress();
  await runGeneration();
}

/**
 * Take the search the address asks for. It is read on top of what the browser
 * remembers, so a teacher's link wins over the last search of the visitor, and
 * a plain address changes nothing.
 */
export function readGeneratorAddress(): void {
  const params = new URLSearchParams(route.search.peek());

  const mf = params.get('mf');
  if (mf) preferences.mf.value = mf;

  const limit = boundedNumber(params.get('limit'), 1, MAX_LIMIT);
  if (limit !== null) preferences.limit.value = Math.round(limit);

  const timeout = boundedNumber(params.get('timeout'), 0.1, MAX_TIMEOUT);
  if (timeout !== null) preferences.timeout.value = timeout;

  for (const option of SWITCHES) {
    const value = params.get(option.name);
    if (value !== null) {
      option.signal.value = value !== '0' && value !== 'false';
    }
  }

  for (const option of RANGES) {
    const value = params.get(option.name);
    if (value !== null && RANGE.test(value)) option.signal.value = value;
  }

  for (const option of COUNTS) {
    const value = params.get(option.name);
    if (value !== null && COUNT.test(value)) option.signal.value = value;
  }

  const fragment = params.get('fragment');
  if (fragment !== null) data.fragmentCode.value = fragment;
}

/**
 * Write what the form holds into the address, so the page can be shared,
 * reloaded and bookmarked as it is. Only what was asked for is written: an
 * untouched form leaves a clean address. The history entry is replaced, since
 * the back button should leave the tool rather than walk through every search.
 */
export function writeGeneratorAddress(): void {
  const parameters: Record<string, string | undefined> = {
    mf: preferences.mf.peek() || undefined,
    limit: skipDefault(preferences.limit.peek(), DEFAULT_LIMIT),
    timeout: skipDefault(preferences.timeout.peek(), DEFAULT_TIMEOUT),
    fragment: data.fragmentCode.peek() || undefined,
  };

  for (const option of SWITCHES) {
    const value = option.signal.peek();
    parameters[option.name] =
      value === option.fallback ? undefined : value ? '1' : '0';
  }

  for (const option of TEXTS) {
    parameters[option.name] = option.signal.peek().trim() || undefined;
  }

  navigate('generator', parameters, { replace: true });
}

function skipDefault(value: number, fallback: number): string | undefined {
  return value === fallback ? undefined : String(value);
}

function boundedNumber(
  value: string | null,
  min: number,
  max: number,
): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, min), max);
}
