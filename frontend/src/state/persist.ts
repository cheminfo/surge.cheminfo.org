import { effect } from '@preact/signals-react';

/**
 * Rehydrate a bucket of signals from localStorage and re-serialize the whole
 * bucket whenever any leaf changes. Best-effort: storage errors are ignored,
 * because losing a preference must never break the page.
 * @param key - Namespaced and versioned localStorage key.
 * @param bucket - Plain object whose leaves are signals.
 * @returns The same bucket, rehydrated and kept in sync with localStorage.
 */
export function persistBucket<T extends object>(key: string, bucket: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) rehydrate(bucket, JSON.parse(stored));
  } catch {
    // malformed or inaccessible storage: start from the defaults
  }
  effect(() => {
    const serialized = JSON.stringify(serialize(bucket));
    try {
      localStorage.setItem(key, serialized);
    } catch {
      // quota exceeded: the preference simply does not survive the reload
    }
  });
  return bucket;
}

interface SignalLeaf {
  value: unknown;
  peek: () => unknown;
}

function isSignalLeaf(value: unknown): value is SignalLeaf {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'peek' in value
  );
}

function rehydrate(node: object, stored: unknown): void {
  if (typeof stored !== 'object' || stored === null) return;
  for (const [property, leaf] of Object.entries(node)) {
    const storedValue = (stored as Record<string, unknown>)[property];
    if (storedValue === undefined) continue;
    if (isSignalLeaf(leaf)) {
      leaf.value = storedValue;
    } else if (typeof leaf === 'object' && leaf !== null) {
      rehydrate(leaf, storedValue);
    }
  }
}

function serialize(node: object): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [property, leaf] of Object.entries(node)) {
    if (isSignalLeaf(leaf)) {
      result[property] = leaf.value;
    } else if (typeof leaf === 'object' && leaf !== null) {
      result[property] = serialize(leaf);
    }
  }
  return result;
}
