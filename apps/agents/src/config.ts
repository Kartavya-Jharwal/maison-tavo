import {existsSync} from 'node:fs';
import {resolveTls} from '../../../scripts/tls';

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
  get tls() {
    const paths = resolveTls();
    return {cert: paths.cert, key: paths.key, source: paths.source};
  },
};

export function loadTls() {
  const {cert, key, source} = config.tls;
  if (!existsSync(cert) || !existsSync(key)) {
    throw new Error('Local HTTPS certificate is missing. Run `bun run certs` from the repo root.');
  }
  console.log(`TLS ${source}: ${cert}`);
  return {cert: Bun.file(cert), key: Bun.file(key)};
}
