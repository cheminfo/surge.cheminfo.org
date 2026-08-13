# surge

Generate every constitutional isomer of a molecular formula, and practise
finding them yourself.

The service is a front end for
[Surge](https://github.com/StructureGenerator/surge), which it drives from a
REST API, and a React application built on top of it. It replaces the
cheminfo visualizer views for structural isomers, both the generator and the
"Isomères de structure" exercise.

## What it holds

| Address      | What it is                                                                              |
| ------------ | --------------------------------------------------------------------------------------- |
| `/`          | The generator: a formula in, every isomer out, with the restrictions surge understands. |
| `/exercises` | The exercises: draw every isomer of a formula yourself, with hints and a correction.    |
| `/fragments` | The motifs a hint is built from, and how often each appears in a formula.               |
| `/docs`      | The API, documented and callable from the page.                                         |

Surge is the only thing that decides what an isomer is: the number to find in
an exercise is enumerated at run time, never hard-coded, so an exercise and
its correction can never disagree.

## Taking a result away

Under the formula, **Export the structures** opens a dialog that writes what
was generated as SMILES, as openchemlib idCodes, or as an SDF — a molfile per
structure with invented coordinates, carrying `SMILES`, `ID_CODE`, `MF` and
`MW` as fields, assembled by
[sdf-creator](https://github.com/cheminfo/sdf-creator). Each one can be copied
or downloaded, under a name of one's choosing.

## Exercises

An exercise is a molecular formula. The student draws a structure and there is
nothing to press: as soon as the drawing holds the atoms of the formula it is
checked, and it is kept when it is one of the isomers. Two structures that
differ only by stereochemistry, by explicit hydrogens, or by which Kekulé form
was drawn are the same answer. What was found is kept in the browser, per
formula, and survives a reload.

### Hints that look at what you drew

The first hints read the formula — the degree of unsaturation, the families
each heteroatom opens up, the reminder that only connectivity counts.

The ones after them compare the answers with the structures already found. Both
sides are searched for a library of motifs — a three-membered ring, an ether, a
terminal double bond, a quaternary carbon, a spiro atom — and what the answers
hold but the student never drew becomes the hint:

> 8 answers hold an ether, and none of yours does. The oxygen can sit inside
> the skeleton rather than at its edge, joining two carbons.

A motif whose answers are only half found is counted out instead ("you have 3
of the 8 answers that hold an ether"), and the detail of a motif waits until
the motif itself has been drawn: the three-membered ring is named before the
nitrogen sitting in it.

Every motif is an openchemlib query fragment stored as an idCode and matched by
substructure search, so nothing about an answer is written down: `/fragments`
draws the whole library, the sentence each motif produces, and — given a
formula — how many of its isomers hold it.

### Handing out a selection

Everything is in the address, so there is nothing to log in to and nothing to
save:

| Address                                           | What the student gets                      |
| ------------------------------------------------- | ------------------------------------------ |
| `/exercises`                                      | The 23 exercises of the cheminfo course.   |
| `/exercises?formulas=C4H10O,C5H12,C3H8`           | Exactly those formulas, in that order.     |
| `/exercises?formulas=C4H10O&exercise=C4H10O`      | That set, opened on that exercise.         |
| `/exercises?set=https://example.org/isomers.json` | A set the teacher hosts themselves.        |
| `/exercises?formulas=C4H10O&embed=1`              | The same without the header, to be framed. |

A hosted set is a JSON document. Only `exercises` is required; the service
counts the isomers itself.

```json
{
  "title": "Series 3 — constitutional isomers",
  "description": "Draw every isomer. Stereochemistry is not taken into account.",
  "exercises": [{ "mf": "C4H10O" }, { "mf": "C5H10" }, { "mf": "C4H8O" }]
}
```

It is fetched by the browser, so it has to be served with a permissive
`Access-Control-Allow-Origin`.

The colour of an exercise is its difficulty, and it is never written down
either: the service reads it off the number of isomers — up to 5 green, up to
15 orange, more than that red — so a set named in a link is coloured like the
one shipped with the service.

### Sharing and framing

Every page carries a **Share** button, top right. It builds the address of the
page as it currently stands — the formula, the restrictions, the exercises
chosen out of the set — and the iframe that frames it in another site. Two
parameters configure the page rather than feed it:

| Parameter | What it does                                                                     |
| --------- | -------------------------------------------------------------------------------- |
| `embed`   | Drops the header and the navigation, so only the activity shows through a frame. |
| `hide`    | Switches parts of the page off, comma separated. An unknown name is ignored.     |

What `hide` understands, per page:

| Page         | Names                                       |
| ------------ | ------------------------------------------- |
| `/`          | `options`, `substructure`, `lists`, `about` |
| `/exercises` | `list`, `hints`, `answers`, `clear`         |

`lists` is the export of the results, kept under its old name so a link written
before the dialog existed still switches it off.

Hidden is not disabled: what a link carries still applies. `hide=options` runs
the search under the restrictions of the link without letting the visitor
change them, and a framed generator never shows the limit and the timeout at
all — it runs on the ones the link names.

The generator writes its search in the address, so a link reproduces it and
runs it on arrival:

```
https://surge.cheminfo.org/?mf=C4H6&disallowTripleBonds=1&limit=200
```

### In a course

[learn.cheminfo.org](https://learn.cheminfo.org) opens a tile either framed in
the page or in a new tab. For a framed tile, add `embed=1` so the header of
this application does not repeat the one of the course:

```
https://surge.cheminfo.org/exercises?formulas=C5H12,C6H14,C4H10O&embed=1
```

```html
<iframe
  src="https://surge.cheminfo.org/exercises?formulas=C4H10O&embed=1&hide=list,answers"
  width="100%"
  height="800"
  style="border: 1px solid #d3d8de; border-radius: 8px"
  title="Surge — Exercises"
></iframe>
```

## API

Every route lives under `/v1` and is documented at `/docs`.

```
GET  /v1/health                        the service and its surge version
GET  /v1/generate?mf=C6H10O&limit=100  enumerate isomers
POST /v1/generate                      the same, parameters in a JSON body
GET  /v1/exercises                     an exercise set and its counts
GET  /v1/exercises/:mf                 one exercise: how many to find, hints
GET  /v1/exercises/:mf/answers         the correction
POST /v1/exercises/:mf/check           is this drawn structure one of them?
POST /v1/exercises/:mf/hints           what is missing from what has been found
GET  /v1/fragments                     the motif library a hint is built from
GET  /v1/fragments/usage?mf=C4H8O      how many isomers hold each motif
```

`GET /v1/generate` takes the restrictions surge understands — triple bonds,
planarity, ring counts, the nine substructure filters — as query parameters;
`POST` takes the same in a body, which is how a drawn fragment is passed
without stuffing an idCode into a URL. Aromaticity filtering (surge's `-R`) is
on by default, so the Kekulé structures of one aromatic ring count once.

## Local development

```sh
git clone https://github.com/cheminfo/surge
cd surge
npm install
npm run install-surge   # downloads bin/surge for this machine
npm run dev             # backend on :31228, frontend on :31229
```

`npm run install-surge` downloads the release binary upstream publishes for
macOS on Apple silicon and for Linux on x86-64, checksum verified. On any other
platform, compile surge the way the [Dockerfile](Dockerfile) does and point
`SURGE_PATH` at the result.

```sh
npm test           # unit tests, type-check, eslint, prettier
npm run test-e2e   # Playwright, against both dev servers
```

## Deployment

```sh
cp .env.example .env
# uncomment one COMPOSE_FILE line, set TUNNEL_TOKEN for the Cloudflare mode
docker compose up -d
```

Three modes, selected by `COMPOSE_FILE` in `.env`:

| File                       | Exposure                                      |
| -------------------------- | --------------------------------------------- |
| `compose.yaml`             | publishes `PORT` on the host (the default)    |
| `compose.traefik.yaml`     | behind Traefik on `surge.cheminfo.org`        |
| `compose.cloudflared.yaml` | behind a Cloudflare Tunnel, no published port |

One image serves the API and the built frontend, and compiles surge from
source so it runs on any architecture. Nothing is written to disk, so the
container runs read-only with every capability dropped.

Behind a proxy, name it in `TRUST_PROXY` or every request is logged as coming
from the proxy. Never set `TRUST_PROXY=true` on a port that is reachable
directly.

### Environment

Every variable is documented in [.env.example](.env.example); only `PORT` has
to be set.

| Variable                   | Default    | What it does                                                                                                               |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                     | `31228`    | Port the service listens on; the Vite dev server takes `PORT + 1`.                                                         |
| `HOST`                     | `0.0.0.0`  | Address it binds to.                                                                                                       |
| `TRUST_PROXY`              | unset      | Which proxies may set `X-Forwarded-For`. Unset means: believe nobody.                                                      |
| `SURGE_PATH`               | unset      | Path to the executable; otherwise `bin/surge`, then the PATH.                                                              |
| `MAX_PARALLEL_GENERATIONS` | `4`        | Surge processes running at the same time.                                                                                  |
| `MAX_QUEUED_GENERATIONS`   | `32`       | Requests that may wait for a slot before the API answers 503.                                                              |
| `MAX_TIMEOUT_SECONDS`      | `30`       | Largest timeout a caller may ask for.                                                                                      |
| `MAX_LIMIT`                | `100000`   | Largest number of structures a caller may ask for.                                                                         |
| `MAX_OUTPUT_BYTES`         | `33554432` | Surge is killed once it has written this much. Raising it needs more container memory: the output is copied several times. |
| `COMPOSE_FILE`             | unset      | Which deployment mode `docker compose` uses.                                                                               |
| `TUNNEL_TOKEN`             | unset      | Cloudflare Tunnel token, for that mode only.                                                                               |

Released versions and what changed are in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](./LICENSE)

Surge is under its own license: <https://github.com/StructureGenerator/surge>.
Please cite McKay, B.D., Yirik, M.A., Steinbeck, C. _Surge: a fast open-source
chemical graph generator._ J Cheminform 14, 24 (2022).
<https://doi.org/10.1186/s13321-022-00604-9>
