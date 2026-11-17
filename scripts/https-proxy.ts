import {parseArgs} from 'node:util';
import {resolveTls} from './tls';

const {values} = parseArgs({
  options: {
    target: {type: 'string'},
    port: {type: 'string'},
  },
});

if (!values.target || !values.port) {
  console.error('Usage: bun scripts/https-proxy.ts --target http://127.0.0.1:9292 --port 9443');
  process.exit(1);
}

const target = new URL(values.target);
const tls = resolveTls();
console.log(`TLS ${tls.source}: ${tls.cert}`);

const server = Bun.serve({
  port: Number(values.port),
  tls: {cert: Bun.file(tls.cert), key: Bun.file(tls.key)},
  async fetch(req) {
    const url = new URL(req.url);
    url.protocol = target.protocol;
    url.host = target.host;

    const headers = new Headers(req.headers);
    headers.set('host', target.host);
    headers.set('x-forwarded-proto', 'https');

    try {
      const upstream = await fetch(url, {
        method: req.method,
        headers,
        body: req.body,
        redirect: 'manual',
        decompress: false,
      });
      const responseHeaders = new Headers(upstream.headers);
      const location = responseHeaders.get('location');
      if (location?.startsWith(target.origin)) {
        responseHeaders.set('location', location.replace(target.origin, server.url.origin));
      }
      return new Response(upstream.body, {status: upstream.status, headers: responseHeaders});
    } catch {
      return new Response(`Nothing is running at ${target.origin} yet.`, {status: 502});
    }
  },
});

console.log(`HTTPS ${server.url} -> ${target.origin}`);
