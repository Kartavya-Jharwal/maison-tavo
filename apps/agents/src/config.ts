import {existsSync} from 'node:fs';
import {join} from 'node:path';

const certDir = join(import.meta.dir, '../../../.certs');

function required(name: string): string {
  const value = Bun.env[name];
  if (!value) throw new Error(`${name} is not set. Copy apps/agents/.env.example to apps/agents/.env.`);
  return value;
}

export const config = {
  port: Number(Bun.env.PORT ?? 4443),
  businessUrl: Bun.env.UCP_BUSINESS_URL ?? 'https://maison-tavo.myshopify.com',
  get agentProfileUrl() {
    return required('UCP_AGENT_PROFILE_URL');
  },
  tls: {
    cert: join(certDir, 'localhost.pem'),
    key: join(certDir, 'localhost-key.pem'),
  },
};

export function loadTls() {
  if (!existsSync(config.tls.cert) || !existsSync(config.tls.key)) {
    throw new Error('Local HTTPS certificate is missing. Run `bun run certs` from the repo root.');
  }
  return {cert: Bun.file(config.tls.cert), key: Bun.file(config.tls.key)};
}
