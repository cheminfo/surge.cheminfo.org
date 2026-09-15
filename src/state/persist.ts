import { effect } from '@preact/signals-react';
import { persistBucket as storedBucket } from 'react-cheminfo/core';

/**
 * Rehydrate a bucket of signals from localStorage and re-serialize the whole
 * bucket whenever any leaf changes. The storage half — the versioned key, the
 * merge over the defaults and the errors a partitioned or full store throws —
 * is the library's; what is here is the signals adapter over it.
 * @param key - Namespaced localStorage key, without its version.
 * @param version - Schema version, appended to the key as `:v<version>`.
 * @param bucket - Plain object whose leaves are signals.
 * @returns The same bucket, rehydrated and kept in sync with localStorage.
 */
export function persistBucket<T extends object>(
  key: string,
  version: number,
  bucket: T,
): T {
  const stored = storedBucket({ key, version, defaults: serialize(bucket) });
  rehydrate(bucket, stored.read().value);
  effect(() => {
    stored.write(serialize(bucket));
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

function rehydrate(node: object, stored: Record<string, unknown>): void {
  for (const [property, leaf] of Object.entries(node)) {
    const storedValue = stored[property];
    if (storedValue === undefined) continue;
    if (isSignalLeaf(leaf)) {
      leaf.value = storedValue;
    } else if (
      typeof leaf === 'object' &&
      leaf !== null &&
      typeof storedValue === 'object' &&
      storedValue !== null
    ) {
      rehydrate(leaf, storedValue as Record<string, unknown>);
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
