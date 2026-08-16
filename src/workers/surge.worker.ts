import { enhanceSmiles } from '../chemistry/enhanceSmiles.ts';
import {
  checkStructure,
  getExercise,
  getExerciseAnswers,
  getFragmentUsage,
  getProgressHints,
} from '../exercises/exerciseService.ts';
import { describeSet } from '../exercises/setSummary.ts';
import { writeExport } from '../generate/exportStructures.ts';
import { generateIsomers } from '../generate/generateIsomers.ts';

import type { WorkerAnswer, WorkerRequest } from './protocol.ts';

globalThis.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  void answer(event.data);
});

async function answer(request: WorkerRequest): Promise<void> {
  try {
    post({ id: request.id, kind: 'result', value: await run(request) });
  } catch (error) {
    post({
      id: request.id,
      kind: 'failed',
      message: (error as Error | undefined)?.message ?? 'Something went wrong',
    });
  }
}

/**
 * Everything the page cannot afford to do on the thread it draws with: surge
 * itself, and the openchemlib work over its answers.
 * @param request - What the page asked for.
 * @returns What to send back.
 */
async function run(request: WorkerRequest): Promise<unknown> {
  switch (request.kind) {
    case 'generate': {
      return generateIsomers(request.parameters, (progress) => {
        post({ id: request.id, kind: 'progress', progress });
      });
    }
    case 'exercise-set': {
      return describeSet(request.mf);
    }
    case 'exercise': {
      return getExercise(request.mf);
    }
    case 'answers': {
      return getExerciseAnswers(request.mf);
    }
    case 'check': {
      return checkStructure(request.mf, request.idCode);
    }
    case 'hints': {
      return getProgressHints(request.mf, request.found);
    }
    case 'fragment-usage': {
      return getFragmentUsage(request.mf);
    }
    case 'export': {
      // Reading a million structures back into molecules is the same wait as
      // enumerating them, and the document is written in pieces because it
      // does not fit in one string.
      return writeExport(request.entries, request.format, (text, done) => {
        post({
          id: request.id,
          kind: 'chunk',
          text,
          progress: { phase: 'write', done, total: request.entries.length },
        });
      });
    }
    case 'enhance': {
      // The generator's substructure filter, applied to a result already in
      // hand rather than by enumerating it again.
      return enhanceSmiles(request.smiles, request.options, (done, total) => {
        post({
          id: request.id,
          kind: 'progress',
          progress: { phase: 'filter', done, total },
        });
      });
    }
    default: {
      throw new Error(`The worker was asked for something it does not do`);
    }
  }
}

function post(answer: WorkerAnswer): void {
  globalThis.postMessage(answer);
}
