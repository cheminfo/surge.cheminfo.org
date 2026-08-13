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
| `/docs`      | The API, documented and callable from the page.                                         |

Surge is the only thing that decides what an isomer is: the number to find in
an exercise is enumerated at run time, never hard-coded, so an exercise and
its correction can never disagree.

## Exercises

An exercise is a molecular formula. The student draws a structure, the service
says whether it is one of the isomers, and the count goes up. Two structures
that differ only by stereochemistry, by explicit hydrogens, or by which Kekulé
form was drawn are the same answer. What was found is kept in the browser, per
formula, and survives a reload.

Hints are derived from the formula — the degree of unsaturation, the families
each heteroatom opens up, and the reminder that only connectivity counts — so
a formula added later is as well served as the ones shipped.

### Handing out a selection

Everything is in the address, so there is nothing to log in to and nothing to
save:

| Address                                           | What the student gets                      |
| ------------------------------------------------- | ------------------------------------------ |
| `/exercises`                                      | The 23 exercises of the cheminfo course.   |
| `/exercises?mf=C4H10O,C5H12,C3H8`                 | Exactly those formulas, in that order.     |
| `/exercises?mf=C4H10O&exercise=C4H10O`            | That set, opened on that exercise.         |
| `/exercises?set=https://example.org/isomers.json` | A set the teacher hosts themselves.        |
| `/exercises?mf=C4H10O&embed=1`                    | The same without the header, to be framed. |

A hosted set is a JSON document. Only `exercises` is required; the service
counts the isomers itself.

```json
{
  "title": "Series 3 — constitutional isomers",
  "description": "Draw every isomer. Stereochemistry is not taken into account.",
  "exercises": [
    { "mf": "C4H10O", "level": "beginner" },
    { "mf": "C5H10", "level": "intermediate" },
    { "mf": "C4H8O", "level": "advanced" }
  ]
}
```

It is fetched by the browser, so it has to be served with a permissive
`Access-Control-Allow-Origin`.

### In a course

[learn.cheminfo.org](https://learn.cheminfo.org) opens a tile either framed in
the page or in a new tab. For a framed tile, add `embed=1` so the header of
this application does not repeat the one of the course:

```
https://surge.cheminfo.org/exercises?mf=C5H12,C6H14,C4H10O&embed=1
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
