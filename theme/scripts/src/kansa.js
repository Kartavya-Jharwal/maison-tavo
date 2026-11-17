/**
 * Kansa — culinary companion island.
 * Bundled to theme/assets/microapp-kansa.js.
 * Remounts after Barba `maison:page-enter` when #kansa-root is present.
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

document.addEventListener('maison:page-enter', () => {
  const mount = document.getElementById('kansa-root');
  if (!mount) return;
  // Barba replaces MainContent; new node needs a fresh mount.
  if (mount.dataset.kansaInitialized === 'true' && mount.childElementCount > 0) return;
  delete mount.dataset.kansaInitialized;
  mountKansa(mount);
});
