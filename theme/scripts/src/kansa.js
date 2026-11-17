/**
 * Kansa — culinary companion island (fixture answers, jobs, thermal, AR, Look).
 * Bundled by Bun into theme/assets/microapp-kansa.js.
 */
import { mountKansa } from './kansa/app.js';

function boot() {
  const mount = document.getElementById('kansa-root');
  if (mount) mountKansa(mount);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
