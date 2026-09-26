import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

const certDir = join(import.meta.dir, '../.certs');
mkdirSync(certDir, {recursive: true});

function run(args: string[]) {
  const result = Bun.spawnSync(['mkcert', ...args], {stdout: 'inherit', stderr: 'inherit'});
  if (result.exitCode !== 0) {
    console.error('mkcert failed. Install it first: https://github.com/FiloSottile/mkcert#installation');
    process.exit(result.exitCode ?? 1);
  }
}

run(['-install']);
run([
  '-cert-file',
  join(certDir, 'localhost.pem'),
  '-key-file',
  join(certDir, 'localhost-key.pem'),
  'localhost',
  '127.0.0.1',
  '::1',
]);

console.log(`Certificates written to ${certDir}`);
