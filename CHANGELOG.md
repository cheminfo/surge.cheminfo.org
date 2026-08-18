# Changelog

## [2.0.0](https://github.com/cheminfo/surge.cheminfo.org/compare/v1.2.1...v2.0.0) (2026-08-18)


### ⚠ BREAKING CHANGES

* run surge in the browser, and drop the service behind it
* remove the v1 service and the vendored nauty sources

### Features

* add the Fastify backend that enumerates the isomers ([3c6d55f](https://github.com/cheminfo/surge.cheminfo.org/commit/3c6d55f40f3f14b1e53bc9190b4312a7062a4213))
* add the React frontend ([2dcf912](https://github.com/cheminfo/surge.cheminfo.org/commit/2dcf9121173e5f58031ec10aae5c648b2a14690b))
* advise from the motifs of the answers, and hand a page out as a link ([a0ef83e](https://github.com/cheminfo/surge.cheminfo.org/commit/a0ef83e7ccc9eab906a78b3dbceda47932b08f68))
* count who visits, from the snippet the deployment carries ([8204e34](https://github.com/cheminfo/surge.cheminfo.org/commit/8204e3473d661460843b9330bdb2d8882bf64fe7))
* make every page indexable by search engines ([bc20336](https://github.com/cheminfo/surge.cheminfo.org/commit/bc20336cc370f0675fa1119db27b2cfbfec92685))
* run surge in the browser, and drop the service behind it ([fd5a0e0](https://github.com/cheminfo/surge.cheminfo.org/commit/fd5a0e008b5a5462003665a179871837bf6ba3c3))
* serve the same build at any mount path ([8bc701b](https://github.com/cheminfo/surge.cheminfo.org/commit/8bc701b78d2e661c2cac1c172952fd7fdefa4689))
* tell what the service has learnt, newest first ([1618cfe](https://github.com/cheminfo/surge.cheminfo.org/commit/1618cfe2a81ca45c4a76acd3bb47e173cdeaa378))
* wear the family look, with a mark of one formula opening into many ([fcc4bfd](https://github.com/cheminfo/surge.cheminfo.org/commit/fcc4bfd1bc8b27343203b7172ae51fee5438a023))


### Bug Fixes

* drop a dragged formula in the gap the bar was drawn on ([895d790](https://github.com/cheminfo/surge.cheminfo.org/commit/895d7904de18c0ccf3ea2a7337885e9689cec999))
* keep the family links below the fold ([fb99ed3](https://github.com/cheminfo/surge.cheminfo.org/commit/fb99ed3aa2f960028872c0e0225f3ee2afcc0758))
* make the analytics id in .env.example a zeroed placeholder ([36625d0](https://github.com/cheminfo/surge.cheminfo.org/commit/36625d0a91314ec9df6a477b6abe7d6f770b916b))
* point compose at this repo's image with a selectable tag ([9b78278](https://github.com/cheminfo/surge.cheminfo.org/commit/9b78278fc6982d7af8122f7fada2f485d73f9a5d))
* run the generator on the formula the browser remembers ([e6a1a37](https://github.com/cheminfo/surge.cheminfo.org/commit/e6a1a3744aa11f7de6b2caca688078808dbf809f))


### Miscellaneous Chores

* remove the v1 service and the vendored nauty sources ([dc03f2b](https://github.com/cheminfo/surge.cheminfo.org/commit/dc03f2b54054179df0768c3fb8fd72cb94a6764c))

## [1.2.1](https://github.com/cheminfo/surge/compare/v1.2.0...v1.2.1) (2026-04-20)


### Bug Fixes

* pin @fastify/static to 9.1.0 to work around swagger-ui regression ([5a6cedc](https://github.com/cheminfo/surge/commit/5a6cedc5c7dd6693fba42f0a79b03606be72ca94))

## [1.2.0](https://github.com/cheminfo/surge/compare/v1.1.0...v1.2.0) (2026-04-20)


### Features

* support env-driven PORT and Cloudflare Tunnel deployment ([408cfa5](https://github.com/cheminfo/surge/commit/408cfa567f9998cf5b489bc44ac86a3a10d8e161))

## [1.1.0](https://github.com/cheminfo/surge/compare/v1.0.0...v1.1.0) (2025-11-28)


### Features

* secure the Dockerfile and compose ([#3](https://github.com/cheminfo/surge/issues/3)) ([14d0c92](https://github.com/cheminfo/surge/commit/14d0c92b24bd5db7874894c1c47327c1b774e6d1))


### Bug Fixes

* improve documentation ([3e7a4d4](https://github.com/cheminfo/surge/commit/3e7a4d44a9aa7d6672ff5e19bd60e11a01f2954e))

## 1.0.0 (2025-11-24)


### Features

* add homepage for surge.cheminfo.org ([979cf85](https://github.com/cheminfo/surge/commit/979cf85aaf5baa93533f0858fe0d5bbde6a31ad4))
* full project ([af4c982](https://github.com/cheminfo/surge/commit/af4c9826c1f635bc2f851bb2d9cc3565bdd7ecdc))
* migrate docker-compose to use traefik ([ba52cf7](https://github.com/cheminfo/surge/commit/ba52cf7d77bc5a55cb78ca662c80958415edbab2))


### Bug Fixes

* deal correctly with small rings limit ([8f4e14f](https://github.com/cheminfo/surge/commit/8f4e14f78aed011509dc0e59644832e79dd91e71))
* deal with empty strings in limit rings ([635c884](https://github.com/cheminfo/surge/commit/635c88483d8382ed360dd16fc89bb64a28a43c13))
* DockerFile ([ca77862](https://github.com/cheminfo/surge/commit/ca77862b3b7ebd4a02db4328d2ac232bdfeb3c3f))
* inversion of 4 and 5 ring filters ([dfa1f88](https://github.com/cheminfo/surge/commit/dfa1f886151be49c8653b3793062146bff7e9878))
