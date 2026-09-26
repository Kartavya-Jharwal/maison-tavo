import { animate } from 'motion';
import { createStore } from 'zustand/vanilla';

const root = document.getElementById('maison-microapp-root');
if (root) {
  const palettes = [
    {
      id: 'ivory',
      name: 'Ivory Calm',
      cloth: '#f4efe6',
      ink: '#2c2a26',
      note: 'Daylight lining. Unlined evenings only if the cloth can stand alone.',
    },
    {
      id: 'nocturne',
      name: 'Nocturne Ink',
      cloth: '#1a1c1e',
      ink: '#e8e2d6',
      note: 'Black that is not a void — a tailored dark with a warm paper ticket.',
    },
    {
      id: 'brass',
      name: 'Atelier Brass',
      cloth: '#c4a574',
      ink: '#1f1a14',
      note: 'Hardware colour as cloth. Use sparingly, like a single clasp.',
    },
    {
      id: 'garden',
      name: 'Garden Smoke',
      cloth: '#6b7368',
      ink: '#f3f1ec',
      note: 'A garden wall after rain. Works with ivory more than with brass.',
    },
  ];

  const silhouettes = [
    {
      id: 'column',
      name: 'Column',
      line: 'A long fall from a quiet shoulder. No peplum, no apology.',
    },
    {
      id: 'wrap',
      name: 'Wrap',
      line: 'One closure, bias in the skirt. For rooms that ask you to sit and stand.',
    },
    {
      id: 'cape',
      name: 'Cape',
      line: 'Volume held at the neck. Hands remain free; the cloth does the speaking.',
    },
    {
      id: 'tailoring',
      name: 'Tailoring',
      line: 'Jacket as architecture. Trouser as the second sentence.',
    },
  ];

  const store = createStore((set) => ({
    palette: palettes[0].id,
    silhouette: silhouettes[0].id,
    setPalette: (id) => set({ palette: id }),
    setSilhouette: (id) => set({ silhouette: id }),
  }));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.textContent =
    '.mt-demo{font-family:Georgia,Times,serif;color:#2c2a26;padding:1.25rem 1.5rem 1.75rem;box-sizing:border-box}' +
    '.mt-demo *{box-sizing:border-box}' +
    '.mt-demo__banner{margin:0 0 1.25rem;padding:.65rem .85rem;border:1px dashed #c8c2b6;font-family:system-ui,sans-serif;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase}' +
    '.mt-demo__stage{display:grid;gap:1.25rem}' +
    '@media(min-width:720px){.mt-demo__stage{grid-template-columns:minmax(0,1fr) 14rem}}' +
    '.mt-demo__figure{min-height:16rem;padding:1.5rem;display:flex;flex-direction:column;justify-content:flex-end;border:1px solid currentColor}' +
    '.mt-demo__kicker{margin:0;font-family:system-ui,sans-serif;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;opacity:.8}' +
    '.mt-demo__title{margin:.35rem 0 .5rem;font-size:1.65rem;letter-spacing:.04em}' +
    '.mt-demo__line{margin:0;max-width:28rem;line-height:1.5}' +
    '.mt-demo__sets{display:grid;gap:1.25rem}' +
    '.mt-demo__legend{margin:0 0 .5rem;font-family:system-ui,sans-serif;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase}' +
    '.mt-demo__chips{display:flex;flex-wrap:wrap;gap:.5rem}' +
    '.mt-demo__chip{appearance:none;margin:0;padding:.45rem .7rem;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:.9rem;cursor:pointer}' +
    '.mt-demo__chip[aria-pressed="true"]{font-weight:700}' +
    '.mt-demo__swatch{display:inline-block;width:.7rem;height:.7rem;margin-right:.4rem;border:1px solid currentColor;vertical-align:middle}' +
    '.mt-demo__note{margin:1rem 0 0;font-size:.95rem;line-height:1.45}';
  document.head.appendChild(style);

  function currentPalette(paletteId) {
    return palettes.find((item) => item.id === paletteId) ?? palettes[0];
  }

  function currentSilhouette(silhouetteId) {
    return silhouettes.find((item) => item.id === silhouetteId) ?? silhouettes[0];
  }

  function chip(kind, item, selected) {
    const extra =
      kind === 'palette'
        ? `<span class="mt-demo__swatch" style="background:${item.cloth}"></span>`
        : '';
    return (
      `<button type="button" class="mt-demo__chip" data-kind="${kind}" data-id="${item.id}" aria-pressed="${
        selected ? 'true' : 'false'
      }">${extra}${item.name}</button>`
    );
  }

  function render(state) {
    const palette = currentPalette(state.palette);
    const silhouette = currentSilhouette(state.silhouette);
    const paletteChips = palettes.map((item) => chip('palette', item, item.id === palette.id)).join('');
    const silhouetteChips = silhouettes
      .map((item) => chip('silhouette', item, item.id === silhouette.id))
      .join('');

    root.innerHTML =
      '<div class="mt-demo">' +
      '<p class="mt-demo__banner">Demo microapp — mock lookbook. No data is stored.</p>' +
      '<div class="mt-demo__stage">' +
      `<figure class="mt-demo__figure" style="background:${palette.cloth};color:${palette.ink}">` +
      '<p class="mt-demo__kicker">Colour story</p>' +
      `<h2 class="mt-demo__title">${palette.name} · ${silhouette.name}</h2>` +
      `<p class="mt-demo__line">${silhouette.line}</p>` +
      '</figure>' +
      '<div class="mt-demo__sets">' +
      `<div><p class="mt-demo__legend">Palette</p><div class="mt-demo__chips">${paletteChips}</div></div>` +
      `<div><p class="mt-demo__legend">Silhouette</p><div class="mt-demo__chips">${silhouetteChips}</div></div>` +
      '</div></div>' +
      `<p class="mt-demo__note">${palette.note}</p></div>`;
  }

  function pulseFigure() {
    if (reduceMotion) return;
    const figure = root.querySelector('.mt-demo__figure');
    if (!figure) return;
    animate(figure, { opacity: [0.72, 1] }, { duration: 0.28 });
  }

  store.subscribe((state) => {
    render(state);
    pulseFigure();
  });

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('[data-kind]');
    if (!button) return;
    const kind = button.getAttribute('data-kind');
    const id = button.getAttribute('data-id');
    const { setPalette, setSilhouette } = store.getState();
    if (kind === 'palette') setPalette(id);
    if (kind === 'silhouette') setSilhouette(id);
  });

  render(store.getState());
}
