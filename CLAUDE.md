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
POST /v1/exercises/:mf/hints  { found: idCode[] } -> what is still missing
GET  /v1/fragments          the motif library a hint is built from
GET  /v1/fragments/usage    ?mf   how many isomers hold each motif
```

`buildApp()` deliberately does not call `ready()`, so a test can still add a
route to the instance it gets back.

The service holds no state about a student. An exercise set is described by the
address (`mf`, or `set` pointing at a JSON document a teacher hosts), and what
was found lives in the browser under `surge:exercises:v1`, keyed by formula
rather than by set so one formula is one piece of work.

**The difficulty of an exercise is read off its count, never written down.**
`exercises/level.ts` is the only place the three levels are decided — up to 5
isomers beginner, up to 15 intermediate, more advanced — so a set a teacher
named in a link is coloured exactly like the one shipped with the service. A
hand-written level in a set could only disagree with what surge enumerates,
which is why neither `defaultSet.ts` nor a hosted document carries one.

**The results of an exercise are always kept, and always through a binding.**
`state/progressStore.ts` declares what a place to keep them is — a name, a
`load` and a `save`, either of which may answer over the network — and
`localStorageProgressStore` is the only one there is today. `exerciseProgress.ts`
holds the signal, sends every change to the bound store, and `setProgressStore`
swaps in another one; nothing else in the page knows where the work went. Both
sides are best effort: a page framed in a course may have no storage at all, and
losing what was found must never break the exercise.

An entry holds what was found **and the drawing each answer was made with**
(the editor value, coordinates included), so a reload gives the student their own
structures back rather than a layout computed from the answer, and the canvas
reopens on the last one they had accepted — which is what the next isomer is
drawn from. It is restored without being submitted again. A field an older entry
does not carry reads as its default, so a link followed months later still opens.

`exerciseService.ts` caches the enumeration per command line, forever, and
drops the entry when it failed. It refuses a formula with more than 500 isomers:
an exercise nobody can finish is not an exercise.

## Hints

A hint is never written down for a formula. Two things produce one:

- `exercises/hints.ts` reads the formula — the degree of unsaturation, what
  each heteroatom opens up. These are the first rungs of the ladder.
- `exercises/fragmentHints.ts` compares the motifs of the answers with the
  motifs of the structures the student found. A motif they never drew is
  reported before one they only half explored, and the detail of a motif waits
  until the motif itself has been found: a three-membered ring is named before
  the nitrogen sitting in it.

**Nothing is suggested twice.** `exercises/hintCoverage.ts` reads the same
comparison the other way round — which motifs, and which whole categories, the
student has drawn _every_ answer of — and the formula's rungs are written
against it: a student who has every cyclic answer is sent to the multiple bonds
instead of being told about rings, an element whose families are all exhausted
is not mentioned at all, and once every motif is complete the formula has
nothing left to add. So the whole ladder is rebuilt on `POST /hints` from what
was found; the `hints` of `GET /v1/exercises/:mf` are the ladder an exercise
opens on, and what the page falls back to when the service cannot be reached.

The motifs live in `chemistry/fragments/`, **as openchemlib idCodes of query
fragments** — never as SMARTS, never as SMILES. One motif may hold several
idCodes and is present when any of them is found. The queries carry query
features (ring size, aromatic state, ring bond count, "no more neighbours"),
which is what lets a single atom stand for "in a three-membered ring". Every
answer is searched once, when the exercise is enumerated, so a hint costs
nothing at request time.

Adding a motif means adding its idCode, its label, and the two sentences it
produces, then a row in `chemistry/__tests__/substructure.test.ts`: an idCode
reads as nothing, and the panel of molecules there is what says what it means.
`/fragments` draws the whole library and, given a formula, how many of its
isomers hold each motif.

## Frontend conventions

- Routing is **path based** through the History API — a teacher hands out
  `surge.cheminfo.org/exercises?formulas=…`, and a `#` in there does not survive
  being pasted around. The backend answers `index.html` for any unknown path.
- **Everything a page is set up with lives in the address**, the generator's
  search included (`state/generatorUrl.ts` reads it before the first paint and
  writes it on every run), so a Share button can hand out what is on screen.
- **A parameter that feeds a page belongs to that page alone.** `mf` is the one
  formula the generator enumerates and the one the fragment usage is counted
  for; the exercises name their set in `formulas` (`FORMULAS_PARAM`), never in
  `mf`. `navigate` carries `embed` and `hide` across a page change and drops
  everything else, so walking to another tab cannot ask it for something
  nobody wrote.
- `state/shareConfig.ts` owns the two parameters that configure a page rather
  than feed it: `embed=1` drops the header for a page framed in a course, and
  `hide=` switches parts of it off. Components ask `isHidden(key)`; the keys of
  each page are declared in `state/shareOptions.ts`, which is also what the
  share dialog offers. An unknown key is ignored, so an old link still opens.
  The dialog **opens on the link one actually hands out**: framed, and with the
  parts a course has no use for already off — on the generator, the fold, the
  substructure filter and the export (`hiddenByDefault` in the descriptor).
  A page already running a configuration shows that one instead. **Choosing an
  exercise is choosing what it holds**: running the mouse over a formula of the
  picker draws every one of its isomers, so a teacher sees what they hand out
  rather than a count. The enumeration is kept for as long as the page lives —
  the same rows are hovered again and again while a set is put together.
  **The order of the picker is the order of the link**, which is the order the
  student walks through: a formula is dragged into place, or moved with the
  arrow keys from its grip, and what is ticked is handed out again in the new
  arrangement (`exerciseOrder.ts` owns both, and is what the tests exercise).
  **What is drawn while dragging is the gap, not a row** — the half of a row
  the pointer is on says which of its two sides the formula lands on. A mark on
  the row it is dropped on says the wrong thing: a formula dragged rightwards
  lands after that row, not before it. So the two blocks around the gap step
  aside and the line is drawn in the middle of the slot they open, which is the
  only way it reads as a place between two blocks rather than as a mark in
  front of one. A row is a block whole — the grip is inside it — so the space
  between two blocks is the gutter, and the line has somewhere to be.
  Blueprint's `Popover` does not position itself under React 19: a popover in
  this page is a `PopoverNext`, and nothing else may import the old one — the
  frontend block of `eslint.config.js` refuses the import.
- **Hidden is not disabled.** A hidden control still applies the value the link
  carries — that is how a teacher presets a search nobody can widen. A framed
  page never shows the limit and the timeout at all: what a run costs the
  service is not handed to an anonymous visitor in someone else's page.
- Global state is signal buckets in `src/state/`: `data` (what was loaded),
  `view` (ephemeral), `preferences` (persisted). Components call `useSignals()`
  as their first line whenever they read `.value`.
- The canvas editor is uncontrolled and owns its drawing: it is **remounted
  with a `key`** to empty it, never driven by a prop. `initialIdCode` is read
  once, at mount, so a dialog can reopen on the fragment already in use.
- **The editor is always shown whole.** Its toolbar is a canvas of a fixed
  height that a shorter container silently cuts buttons off, so
  `StructureEditor` measures the toolbar and gives itself at least that much
  height; a caller's `minHeight` can only raise it. Wherever the editor is put,
  every button must be reachable.
- The generator keeps the search on the left and the drawings on the right, and
  a result is meant to be read without scrolling: everything but the formula
  and its button — limit, timeout, restrictions, the substructure filter —
  lives in a fold, and the filter itself opens a dialog. Taking the result away
  is one button under the form, opening a dialog that writes it as SMILES, as
  idCodes or as an SDF, under a name one chooses. `pages/generator/
exportResult.ts` owns the three formats: openchemlib draws the molfile and
  reads the formula and the weight off it, **`sdf-creator` assembles the
  records** — the `$$$$` and the `>  <field>` blocks are never written by hand.
- **Nothing is submitted by hand.** The exercise editor watches what is being
  drawn and sends it once it holds the atoms of the formula, so a correct
  structure is added on its own. **An accepted answer stays on the canvas** —
  the isomers of a formula differ by one branch, and editing the last one is
  how the next is found; a structure is sent again only once the drawing
  actually changed. The canvas is emptied when the work is thrown away, not
  when it succeeds. A drawing of another formula is named back to the student
  rather than sent.
- **The instructions give the canvas their room.** They fold themselves once
  something has been drawn — once ever, kept in `surge:exercises-view:v1`, so a
  student who reopened them keeps them open. Folding waits for the drawing to
  settle: moving the canvas under a hand that is still drawing is worse than
  the space it wins.
- **A phone gets one column and one scrollbar.** Under 1100px the columns
  stack, and nothing keeps a scrolling box of its own inside the scrolling
  page: the exercise list shows every exercise, the results grow as far as they
  need. Tapping an exercise then brings the canvas into view, since what was
  tapped is a screen or more above the place to answer it. Under 900px the
  generator's columns dissolve altogether (`display: contents`), so a result
  follows the button that ran it and the prose comes last.
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
