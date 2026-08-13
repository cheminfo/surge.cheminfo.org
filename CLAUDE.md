# surge — architecture contract

A formula goes in and every constitutional isomer comes out; an exercise asks
the student to produce that list themselves. Read this before touching a
source file: what follows is shared by the whole codebase.

**Surge decides what an isomer is, always.** No count, no answer list and no
"expected number" is ever written down in this repository. Everything is
enumerated at run time by the executable, so an exercise and its correction
cannot drift apart. A test may assert a number; the application may not hold
one.

## Stack

- **Backend**: Fastify 5 + TypeBox, run directly with
  `node --experimental-strip-types`. No build step, no database.
- **Frontend**: React 19 + Vite, `@preact/signals-react` for global state,
  BlueprintJS for the widgets, `react-ocl` for the editor and the drawings,
  `react-mf` for every molecular formula on screen.
- **Ports**: backend `31228`, Vite dev server `31229` (derived from the
  project creation date, 2023-12-28).
- One Docker image compiles surge from source, builds the frontend, and serves
  both.

## The executable

- `surge/getExecutable.ts` looks at `SURGE_PATH`, then `bin/surge`, then the
  PATH. `bin/` is gitignored: `npm run install-surge` downloads the release
  binary, and the Docker image compiles one.
- `surge/runSurge.ts` is the only place a child process is spawned. It is
  asynchronous, capped by `MAX_PARALLEL_GENERATIONS` with a waiting queue, and
  kills a run on timeout or once it has written `MAX_OUTPUT_BYTES`.
- Surge 2.0 **counts by default**: `-S` is what makes it write structures, and
  is always passed. `-R` (one Kekulé structure per aromatic ring) is on unless
  a caller turns it off.
- Options reach the command line only through `surge/buildFlags.ts`, which
  validates every range against `^\d+([:-]\d+)?$` — nothing else may build a
  flag string.

## Identity of a structure

Two structures are the same answer when
`chemistry/molecule.ts#constitutionIDCode` gives them the same string: an
openchemlib idCode with the stereochemistry dropped and the explicit hydrogens
removed, computed on a copy so the caller's molecule is never modified. Both
sides of an exercise go through that one function — never compare SMILES.

A formula goes through `normalizeFormula`, which condenses a developed formula,
fixes the case, and refuses any element surge does not know. `Nx`, `Sx`, `Sy`
and `Px` are surge's names for a higher valence and no formula parser knows
them, so they are let through untouched.

## API

Every route is under `/v1`, carries a TypeBox `schema` with `tags`, `summary`
and `response`, and shows up at `/docs`.

```
GET  /v1/health
GET  /v1/generate           ?mf&limit&timeout&idCode&<restrictions>
POST /v1/generate           the same in a body, for a drawn fragmentCode
GET  /v1/exercises          ?mf=C4H10O,C5H12   -> the set and its counts
GET  /v1/exercises/:mf      -> { mf, count, hints }, never the answers
GET  /v1/exercises/:mf/answers
POST /v1/exercises/:mf/check  { idCode }
```

`buildApp()` deliberately does not call `ready()`, so a test can still add a
route to the instance it gets back.

The service holds no state about a student. An exercise set is described by the
address (`mf`, or `set` pointing at a JSON document a teacher hosts), and what
was found lives in the browser under `surge:exercises:v1`, keyed by formula
rather than by set so one formula is one piece of work.

`exerciseService.ts` caches the enumeration per command line, forever, and
drops the entry when it failed. It refuses a formula with more than 500 isomers:
an exercise nobody can finish is not an exercise.

## Frontend conventions

- Routing is **path based** through the History API — a teacher hands out
  `surge.cheminfo.org/exercises?mf=…`, and a `#` in there does not survive
  being pasted around. The backend answers `index.html` for any unknown path.
- `embed=1` drops the header, for a page framed in a course.
- Global state is signal buckets in `src/state/`: `data` (what was loaded),
  `view` (ephemeral), `preferences` (persisted). Components call `useSignals()`
  as their first line whenever they read `.value`.
- The canvas editor is uncontrolled and owns its drawing: it is **remounted
  with a `key`** to empty it, never driven by a prop.
- Every molecular formula on screen goes through `react-mf`, never a raw
  string.
- Organise by page under `src/pages/<page>/`; keep every file under 250 lines.

## Commands

```sh
npm install
npm run install-surge    # bin/surge, for development and CI
npm run dev              # backend :31228 + frontend :31229
npm test                 # vitest + check-types + eslint + prettier
npm run test-e2e         # Playwright, both dev servers started for it
```
