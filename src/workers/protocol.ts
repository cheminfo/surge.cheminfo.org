import type {
  EnhanceOptions,
  StructureEntry,
} from '../chemistry/enhanceSmiles.ts';
import type { ExportFormat } from '../generate/exportStructures.ts';
import type {
  GenerateParameters,
  RunProgress,
} from '../generate/generateIsomers.ts';

/** What the page asks the worker to do, one message per call. */
export type WorkerRequest =
  | { id: number; kind: 'generate'; parameters: GenerateParameters }
  | { id: number; kind: 'exercise-set'; mf: string | undefined }
  | { id: number; kind: 'exercise'; mf: string }
  | { id: number; kind: 'answers'; mf: string }
  | { id: number; kind: 'check'; mf: string; idCode: string }
  | { id: number; kind: 'hints'; mf: string; found: string[] }
  | { id: number; kind: 'fragment-usage'; mf: string }
  | {
      id: number;
      kind: 'enhance';
      smiles: string[];
      options: EnhanceOptions;
    }
  | {
      id: number;
      kind: 'export';
      entries: readonly StructureEntry[];
      format: ExportFormat;
    };

/**
 * What the worker sends back: how far it is, the pieces of a document it is
 * writing, then the answer or the reason.
 */
export type WorkerAnswer =
  | { id: number; kind: 'progress'; progress: RunProgress }
  | { id: number; kind: 'chunk'; text: string; progress: RunProgress }
  | { id: number; kind: 'result'; value: unknown }
  | { id: number; kind: 'failed'; message: string };
