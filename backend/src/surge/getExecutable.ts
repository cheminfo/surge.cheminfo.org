import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { config } from '../config.ts';

/**
 * Locate the surge executable: `SURGE_PATH` when set, then `bin/surge` at the
 * root of the repository (`npm run install-surge`), then whatever the Docker
 * image compiled onto the PATH.
 * @returns The command to spawn.
 */
export function getExecutable(): string {
  if (config.surgePath) return config.surgePath;

  const local = join(import.meta.dirname, '../../../bin/surge');
  if (existsSync(local)) return local;

  return 'surge';
}
