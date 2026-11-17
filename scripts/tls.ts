import {existsSync} from 'node:fs';
import {join} from 'node:path';

const repoRoot = join(import.meta.dir, '..');

function mkcertCaroot(): string | undefined {
  const fromEnv = Bun.env.CAROOT?.trim();
  if (fromEnv && existsSync(join(fromEnv, 'rootCA.pem'))) return fromEnv;

  const result = Bun.spawnSync(['mkcert', '-CAROOT'], {stdout: 'pipe', stderr: 'pipe'});
  const path = result.stdout.toString().trim();
  if (result.exitCode === 0 && path && existsSync(join(path, 'rootCA.pem'))) return path;

  const fallback = join(Bun.env.LOCALAPPDATA ?? '', 'mkcert');
  if (existsSync(join(fallback, 'rootCA.pem'))) return fallback;
  return undefined;
}

export type TlsPaths = {cert: string; key: string; source: string};

/** Leaf cert + key for Bun HTTPS. Prefers env, then repo `.certs`, then mkcert CAROOT. */
export function resolveTls(): TlsPaths {
  const envCert = Bun.env.MAISON_TLS_CERT ?? Bun.env.SSL_CERT_FILE;
  const envKey = Bun.env.MAISON_TLS_KEY ?? Bun.env.SSL_KEY_FILE;
  if (envCert && envKey && existsSync(envCert) && existsSync(envKey)) {
    return {cert: envCert, key: envKey, source: 'env'};
  }

  const project: TlsPaths = {
    cert: join(repoRoot, '.certs', 'localhost.pem'),
    key: join(repoRoot, '.certs', 'localhost-key.pem'),
    source: 'project',
  };
  if (existsSync(project.cert) && existsSync(project.key)) return project;

  const caroot = mkcertCaroot();
  if (caroot) {
    const globalLeaf: TlsPaths = {
      cert: join(caroot, 'localhost.pem'),
      key: join(caroot, 'localhost-key.pem'),
      source: `mkcert CAROOT (${caroot})`,
    };
    if (existsSync(globalLeaf.cert) && existsSync(globalLeaf.key)) return globalLeaf;
  }

  throw new Error(
    'Local HTTPS certificate is missing. Run `bun run certs` (uses the existing mkcert CA).',
  );
}

export function existingMkcertCa(): string | undefined {
  return mkcertCaroot();
}

export function projectCertDir(): string {
  return join(repoRoot, '.certs');
}
