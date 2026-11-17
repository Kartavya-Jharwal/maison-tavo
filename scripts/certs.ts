import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {existingMkcertCa, projectCertDir} from './tls';

const certDir = projectCertDir();
mkdirSync(certDir, {recursive: true});

function run(args: string[]) {
  const result = Bun.spawnSync(['mkcert', ...args], {stdout: 'inherit', stderr: 'inherit'});
  if (result.exitCode !== 0) {
    console.error('mkcert failed. Install it first: https://github.com/FiloSottile/mkcert#installation');
    process.exit(result.exitCode ?? 1);
  }
}

const caroot = existingMkcertCa();
if (caroot) {
  console.log(`Using existing mkcert CA at ${caroot}`);
} else {
  run(['-install']);
}

run([
  '-cert-file',
  join(certDir, 'localhost.pem'),
  '-key-file',
  join(certDir, 'localhost-key.pem'),
  'localhost',
  '127.0.0.1',
  '::1',
]);

console.log(`Leaf certificates written to ${certDir} (signed by the machine CA)`);
