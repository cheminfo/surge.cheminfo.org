import { stdout } from 'node:process';

import { buildApp } from './app.ts';
import { config } from './config.ts';

const fastify = await buildApp({ logger: true });

const address = await fastify.listen({ port: config.port, host: config.host });
stdout.write(`Surge service listening at ${address}\n`);
