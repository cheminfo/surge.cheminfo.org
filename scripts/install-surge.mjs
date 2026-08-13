#!/usr/bin/env node
// Put the surge executable in bin/surge, for local development and CI.
// The Docker image does not use this script: it compiles surge from source
// (see the Dockerfile), which is the only option on the platforms upstream
// does not publish a binary for.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { arch, argv, exit, platform, stderr, stdout } from 'node:process';

const SURGE_VERSION = '2.0';

/** Release assets upstream publishes, keyed by `${platform}-${arch}`. */
const ASSETS = {
  'darwin-arm64': {
    name: 'surge-macos-arm64.tar.gz',
    sha256: 'c210efb077669946808fa77cd032bba6876341e4ca79515a64ea3202fc929fd8',
  },
  'linux-x64': {
    name: 'surge-linux-x86_64.tar.gz',
    sha256: '0c03ac871aefdb2d09198a370335ae3ba97d5f5743296bc32d0c624bd779c464',
  },
};

const binDirectory = join(import.meta.dirname, '..', 'bin');
const executable = join(binDirectory, 'surge');

function versionLine() {
  return execFileSync(executable, ['-help'], { encoding: 'utf8' })
    .split('\n')
    .find((line) => line.includes('Version'))
    ?.trim();
}

if (existsSync(executable) && !argv.includes('--force')) {
  stdout.write(`bin/surge is already installed (${versionLine()})\n`);
  stdout.write('Run `npm run install-surge -- --force` to reinstall.\n');
  exit(0);
}

const key = `${platform}-${arch}`;
const asset = ASSETS[key];
if (!asset) {
  stderr.write(
    `Surge ${SURGE_VERSION} publishes no binary for ${key}.\n` +
      'Compile it from source the way the Dockerfile does, then put the\n' +
      'executable in bin/surge or point SURGE_PATH at it.\n' +
      'https://github.com/StructureGenerator/surge\n',
  );
  exit(1);
}

const url = `https://github.com/StructureGenerator/surge/releases/download/v${SURGE_VERSION}/${asset.name}`;
stdout.write(`Downloading ${url}\n`);

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Download failed with status ${response.status}`);
}
const archive = Buffer.from(await response.arrayBuffer());

const digest = createHash('sha256').update(archive).digest('hex');
if (digest !== asset.sha256) {
  throw new Error(
    `Checksum mismatch for ${asset.name}: expected ${asset.sha256}, got ${digest}`,
  );
}

mkdirSync(binDirectory, { recursive: true });
const archivePath = join(binDirectory, asset.name);
writeFileSync(archivePath, archive);
// Each archive holds a single file named `surge`.
execFileSync('tar', ['xzf', archivePath, '-C', binDirectory]);
rmSync(archivePath);
chmodSync(executable, 0o755);

stdout.write(`Installed bin/surge (${versionLine()})\n`);
