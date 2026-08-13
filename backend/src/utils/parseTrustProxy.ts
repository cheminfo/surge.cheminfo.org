/**
 * Read the `TRUST_PROXY` environment variable into the value Fastify expects.
 * Naming the proxy is what makes `request.ip` the client rather than the
 * proxy; `true` believes any peer and is only safe when the port is
 * unreachable except through the proxy.
 * @param value - Raw environment value: an address, a CIDR range, a comma
 * separated list of either, a hop count, `true`, or nothing.
 * @returns The Fastify `trustProxy` option, `false` when unset.
 */
export function parseTrustProxy(
  value: string | undefined,
): boolean | number | string {
  const text = value?.trim();
  if (!text || text === 'false') return false;
  if (text === 'true') return true;
  if (/^\d+$/.test(text)) return Number(text);
  return text;
}
