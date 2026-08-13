import { signal } from '@preact/signals-react';

/** Every part of a page a shared link can switch off. */
const HIDE_KEYS = [
  'options',
  'substructure',
  'lists',
  'about',
  'list',
  'hints',
  'answers',
  'clear',
] as const;

/**
 * A part of a page a shared link switches off. A key a page does not know
 * about is simply ignored, so a link written for an older version of the site
 * still opens.
 */
export type HideKey = (typeof HIDE_KEYS)[number];

const KNOWN: ReadonlySet<string> = new Set(HIDE_KEYS);

/** Parameters that configure the page rather than feed the tool. */
export const SHARE_PARAM_KEYS = ['embed', 'hide'] as const;

export interface ShareConfig {
  /** Drop the header, so only the activity shows through an iframe. */
  embed: boolean;
  /** Parts of the page the link switches off. */
  hidden: readonly HideKey[];
}

/** An unconfigured link: the whole site, with everything shown. */
export const DEFAULT_SHARE_CONFIG: ShareConfig = { embed: false, hidden: [] };

/**
 * Read the share configuration out of a query string.
 * @param search - The query string, with or without its leading `?`.
 * @returns The configuration, falling back to {@link DEFAULT_SHARE_CONFIG} for
 * anything absent or unknown.
 */
export function parseShareConfig(search: string): ShareConfig {
  const params = new URLSearchParams(search);
  return {
    // A bare `?embed` counts: these addresses are retyped by hand.
    embed: params.has('embed') && params.get('embed') !== '0',
    hidden: parseHidden(params.get('hide')),
  };
}

/**
 * Write a share configuration into a set of query parameters. What is left at
 * its default is deleted rather than written, so a plain link stays plain.
 * @param params - The parameters to update in place; the inputs of the page are left untouched.
 * @param config - The configuration to encode.
 */
export function applyShareConfig(
  params: URLSearchParams,
  config: ShareConfig,
): void {
  if (config.embed) params.set('embed', '1');
  else params.delete('embed');

  if (config.hidden.length > 0) params.set('hide', config.hidden.join(','));
  else params.delete('hide');
}

/**
 * Serialize query parameters, leaving the commas of `hide` and `formulas` alone:
 * they are legal in a query value and parse back identically, but
 * `URLSearchParams` escapes them to `%2C`, which makes a link a teacher has to
 * read or dictate needlessly cryptic.
 * @param params - The parameters to serialize.
 * @returns The query string, without its leading `?`.
 */
export function stringifyParams(params: URLSearchParams): string {
  return params.toString().replaceAll('%2C', ',');
}

/**
 * Whether a configuration differs from an unconfigured link.
 * @param config - The configuration to test.
 * @returns True when the link configures anything at all.
 */
export function isShareConfigured(config: ShareConfig): boolean {
  return config.embed || config.hidden.length > 0;
}

/**
 * The configuration of the page currently open, read once from the address it
 * was opened with. Every address the application writes afterwards goes
 * through `navigate`, which keeps the parameters it does not know about, so a
 * reload — or a link copied out of the frame — restores the same page.
 */
export const shareConfig = signal<ShareConfig>(
  parseShareConfig(globalThis.location?.search ?? ''),
);

/**
 * Whether the page is framed by another site, such as a course on
 * learn.cheminfo.org, in which case the header is left out and the activity
 * takes the whole frame.
 * @returns True when the address asks for embed mode.
 */
export function isEmbedded(): boolean {
  return shareConfig.value.embed;
}

/**
 * Whether the link switches a part of the page off. A hidden control still
 * applies the value the link carries: hiding is about what a visitor may
 * change, not about what is asked of surge.
 * @param key - The part to test.
 * @returns True when it must not be rendered.
 */
export function isHidden(key: HideKey): boolean {
  return shareConfig.value.hidden.includes(key);
}

function parseHidden(value: string | null): readonly HideKey[] {
  if (!value) return [];
  const hidden: HideKey[] = [];
  for (const entry of value.split(',')) {
    const key = entry.trim() as HideKey;
    if (KNOWN.has(key) && !hidden.includes(key)) hidden.push(key);
  }
  return hidden;
}
