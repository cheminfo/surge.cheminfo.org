export interface SurgeOptions {
  /** @default false */
  disallowTripleBonds?: boolean;
  /** @default false */
  requirePlanarity?: boolean;
  /** @default true */
  aromaticity?: boolean;
  /** @default false */
  evenRingsOnly?: boolean;
  /** @default '' */
  limitBonds?: string;
  /** @default '' */
  limit3Rings?: string;
  /** @default '' */
  limit4Rings?: string;
  /** @default '' */
  limit5Rings?: string;
  /** @default '' */
  limit6Rings?: string;
  /** @default '' */
  limitCarbon6Rings?: string;
  /** @default 4 */
  maxDegree?: number;
  /** @default 4 */
  maxCoordination?: number;
  /** @default false */
  noSmallRingsTripleBonds?: boolean;
  /** @default false */
  bredsRuleOne?: boolean;
  /** @default false */
  bredsRuleTwo?: boolean;
  /** @default false */
  bredsRuleThree?: boolean;
  /** @default false */
  noAllene?: boolean;
  /** @default false */
  noAlleneInSmallRings?: boolean;
  /** @default false */
  noK33K24?: boolean;
  /** @default false */
  noCone?: boolean;
  /** @default false */
  noSmallRingsCommonAtoms?: boolean;
}

export interface GenerateParameters extends SurgeOptions {
  mf: string;
  /** @default 1000 */
  limit?: number;
  /** @default 2 */
  timeout?: number;
  /** @default false */
  idCode?: boolean;
  /** @default undefined */
  fragmentCode?: string;
}

export interface StructureEntry {
  smiles: string;
  idCode?: string;
}

export interface GenerateResult {
  mf: string;
  status: 'complete' | 'timeout' | 'output-limit';
  found: number;
  matched?: number;
  returned: number;
  time: number;
  log: string;
  flags: string[];
  result: StructureEntry[];
}

export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseSummary {
  mf: string;
  level: ExerciseLevel;
  count: number;
}

export interface ExerciseSet {
  id: string;
  title: string;
  description: string;
  exercises: ExerciseSummary[];
}

export interface Exercise {
  mf: string;
  count: number;
  hints: string[];
}

export interface ExerciseAnswer {
  idCode: string;
  smiles: string;
}

export interface CheckResult {
  correct: boolean;
  reason: 'correct' | 'wrong-formula' | 'not-an-isomer';
  idCode: string;
  mf: string;
}

/**
 * Generate the constitutional isomers of a molecular formula.
 * @param parameters - Formula, restrictions and output options.
 * @returns What surge produced.
 */
export async function generate(
  parameters: GenerateParameters,
): Promise<GenerateResult> {
  return request<GenerateResult>('/v1/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parameters),
  });
}

/**
 * Read an exercise set and how many isomers each of its formulas holds.
 * @param formulas - Formulas of a set a teacher put together, or nothing for
 * the set shipped with the service.
 * @returns The set.
 */
export async function fetchExerciseSet(
  formulas?: string[],
): Promise<ExerciseSet> {
  const query =
    formulas && formulas.length > 0
      ? `?${new URLSearchParams({ mf: formulas.join(',') }).toString()}`
      : '';
  return request<ExerciseSet>(`/v1/exercises${query}`);
}

/**
 * Read one exercise: how many isomers to find, and the hints.
 * @param mf - Molecular formula of the exercise.
 * @returns The exercise.
 */
export async function fetchExercise(mf: string): Promise<Exercise> {
  return request<Exercise>(`/v1/exercises/${encodeURIComponent(mf)}`);
}

/**
 * Read every isomer of an exercise — the correction.
 * @param mf - Molecular formula of the exercise.
 * @returns The answers.
 */
export async function fetchAnswers(mf: string): Promise<ExerciseAnswer[]> {
  const data = await request<{ answers: ExerciseAnswer[] }>(
    `/v1/exercises/${encodeURIComponent(mf)}/answers`,
  );
  return data.answers;
}

/**
 * Ask whether a drawn structure is one of the isomers to find.
 * @param mf - Molecular formula of the exercise.
 * @param idCode - What the student drew.
 * @returns Whether it counts, and what it was recognized as.
 */
export async function checkStructure(
  mf: string,
  idCode: string,
): Promise<CheckResult> {
  return request<CheckResult>(`/v1/exercises/${encodeURIComponent(mf)}/check`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idCode }),
  });
}

/**
 * Which surge the service runs.
 * @returns The version string.
 */
export async function fetchVersion(): Promise<string> {
  const health = await request<{ surge: string }>('/v1/health');
  return health.surge;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await readError(response);
    throw new Error(message);
  }
  return (await response.json()) as T;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) return body.message;
  } catch {
    // not JSON: fall back to the status line
  }
  return `Request failed with status ${response.status}`;
}
