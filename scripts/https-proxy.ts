import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {parseArgs} from 'node:util';

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
const certDir = join(import.meta.dir, '../.certs');
const cert = join(certDir, 'localhost.pem');
const key = join(certDir, 'localhost-key.pem');

if (!existsSync(cert) || !existsSync(key)) {
  console.error('Local HTTPS certificate is missing. Run `bun run certs` first.');
  process.exit(1);
}

const server = Bun.serve({
  port: Number(values.port),
  tls: {cert: Bun.file(cert), key: Bun.file(key)},
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
