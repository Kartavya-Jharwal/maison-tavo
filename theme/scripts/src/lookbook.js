import { animate } from 'motion';
import { createStore } from 'zustand/vanilla';

const root = document.getElementById('maison-microapp-root');
if (root) {
  // --- Brand palette — 5 Maison Tavo colors as material surfaces ---
  const palettes = [
    {
      id: 'raw-copper',
      name: 'Raw Copper',
      cloth: '#C4784A',
      ink: '#1A1714',
      role: 'Accent · CTA · Evidence',
      note: 'The working metal — raw, warm, and present at every heat source.',
    },
    {
      id: 'aged-bronze',
      name: 'Aged Bronze',
      cloth: '#6E5A3D',
      ink: '#E8DFD4',
      role: 'Depth · Anchor · History',
      note: 'Oxidised heritage. The colour of a pan that has earned its seasoning.',
    },
    {
      id: 'obsidian',
      name: 'Obsidian Charcoal',
      cloth: '#1A1714',
      ink: '#E8DFD4',
      role: 'Ink · Body · Precision',
      note: 'The forge at rest. All specification lives on this ground.',
    },
    {
      id: 'cast-clay',
      name: 'Cast Clay',
      cloth: '#E8DFD4',
      ink: '#1A1714',
      role: 'Canvas · Background · Light',
      note: 'Fired earth. The surface everything is laid against.',
    },
    {
      id: 'silver',
      name: 'Damascus Silver',
      cloth: '#9A9B9E',
      ink: '#1A1714',
      role: 'Muted · UI · Secondary',
      note: 'The steel in shadow. Evidence tier: OBSERVED.',
    },
  ];

  // --- Four lineup rooms ---
  const lineups = [
    {
      id: 'forge-hybrid',
      name: 'Forge Hybrid',
      line: 'Carbon-steel cookline concepts. Modular mass for the pass.',
      href: '/collections/forge-hybrid',
    },
    {
      id: 'terre-clay',
      name: 'Terre Clay',
      line: 'Cast clay vessels and table forms. Grain and heat memory as design story.',
      href: '/collections/terre-clay',
    },
    {
      id: 'kuro-strip',
      name: 'Kuro Strip',
      line: 'Strip and hybrid-edge blade concepts. Edge geometry as craft language.',
      href: '/collections/kuro-strip',
    },
    {
      id: 'forge-terre',
      name: 'Forge \u00d7 Terre',
      line: 'Service sets and nested pieces for the shared kitchen spine.',
      href: '/collections/forge-terre',
    },
  ];

  const store = createStore((set) => ({
    palette: palettes[0].id,
    lineup: lineups[0].id,
    setPalette: (id) => set({ palette: id }),
    setLineup: (id) => set({ lineup: id }),
  }));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.textContent =
    '.mt-demo{font-family:Georgia,Times,serif;color:#1A1714;padding:1.25rem 1.5rem 1.75rem;box-sizing:border-box}'
    + '.mt-demo *{box-sizing:border-box}'
    + '.mt-demo__banner{margin:0 0 1.25rem;padding:.65rem .85rem;border:1px dashed #9A9B9E;font-family:system-ui,sans-serif;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:#6E5A3D}'
    + '.mt-demo__stage{display:grid;gap:1.25rem}'
    + '@media(min-width:720px){.mt-demo__stage{grid-template-columns:minmax(0,1fr) 14rem}}'
    + '.mt-demo__figure{min-height:18rem;padding:1.5rem;display:flex;flex-direction:column;justify-content:flex-end;border:1px solid currentColor;transition:background .3s,color .3s}'
    + '.mt-demo__kicker{margin:0;font-family:system-ui,sans-serif;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;opacity:.8}'
    + '.mt-demo__title{margin:.35rem 0 .25rem;font-size:1.55rem;letter-spacing:.04em}'
    + '.mt-demo__role{margin:0 0 .5rem;font-size:.8rem;letter-spacing:.08em;opacity:.75}'
    + '.mt-demo__line{margin:0;max-width:28rem;line-height:1.5;font-size:.95rem}'
    + '.mt-demo__sets{display:grid;gap:1.25rem}'
    + '.mt-demo__legend{margin:0 0 .5rem;font-family:system-ui,sans-serif;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:#6E5A3D}'
    + '.mt-demo__chips{display:flex;flex-wrap:wrap;gap:.5rem}'
    + '.mt-demo__chip{appearance:none;margin:0;padding:.45rem .7rem;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:.85rem;cursor:pointer;transition:background .15s}'
    + '.mt-demo__chip[aria-pressed="true"]{font-weight:700}'
    + '.mt-demo__swatch{display:inline-block;width:.7rem;height:.7rem;margin-right:.4rem;border:1px solid rgba(0,0,0,.15);vertical-align:middle}'
    + '.mt-demo__lineup-link{display:block;margin-top:.5rem;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#C4784A;text-decoration:none}'
    + '.mt-demo__lineup-link:hover{text-decoration:underline}'
    + '.mt-demo__note{margin:1rem 0 0;font-size:.9rem;line-height:1.5;font-style:italic;color:#6E5A3D}';
  document.head.appendChild(style);

  function currentPalette(id) {
    return palettes.find((p) => p.id === id) || palettes[0];
  }

  function currentLineup(id) {
    return lineups.find((l) => l.id === id) || lineups[0];
  }

  function chip(kind, item, selected) {
    const swatch =
      kind === 'palette'
        ? '<span class="mt-demo__swatch" style="background:' + item.cloth + '"></span>'
        : '';
    return (
      '<button type="button" class="mt-demo__chip" data-kind="'
      + kind
      + '" data-id="'
      + item.id
      + '" aria-pressed="'
      + (selected ? 'true' : 'false')
      + '">'
      + swatch
      + item.name
      + '</button>'
    );
  }

  function render(state) {
    const palette = currentPalette(state.palette);
    const lineup = currentLineup(state.lineup);
    const paletteChips = palettes.map((p) => chip('palette', p, p.id === palette.id)).join('');
    const lineupChips = lineups.map((l) => chip('lineup', l, l.id === lineup.id)).join('');

    root.innerHTML =
      '<div class="mt-demo">'
      + '<p class="mt-demo__banner">Colour story \u00b7 Maison Tavo brand explorer</p>'
      + '<div class="mt-demo__stage">'
      + '<figure class="mt-demo__figure" style="background:'
      + palette.cloth
      + ';color:'
      + palette.ink
      + '">'
      + '<p class="mt-demo__kicker">Colour story</p>'
      + '<h2 class="mt-demo__title">'
      + palette.name
      + '</h2>'
      + '<p class="mt-demo__role">'
      + palette.role
      + '</p>'
      + '<p class="mt-demo__line">'
      + lineup.name
      + ' \u2014 '
      + lineup.line
      + '</p>'
      + '<a class="mt-demo__lineup-link" href="'
      + lineup.href
      + '">Explore '
      + lineup.name
      + ' \u2192</a>'
      + '</figure>'
      + '<div class="mt-demo__sets">'
      + '<div><p class="mt-demo__legend">Palette</p><div class="mt-demo__chips">'
      + paletteChips
      + '</div></div>'
      + '<div><p class="mt-demo__legend">Lineup</p><div class="mt-demo__chips">'
      + lineupChips
      + '</div></div>'
      + '</div></div>'
      + '<p class="mt-demo__note">'
      + palette.note
      + '</p>'
      + '</div>';
  }

  function pulseFigure() {
    if (reduceMotion) return;
    const figure = root.querySelector('.mt-demo__figure');
    if (!figure) return;
    animate(figure, {opacity: [0.72, 1]}, {duration: 0.3});
  }

  store.subscribe((state) => {
    render(state);
    pulseFigure();
  });

  root.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-kind]') : null;
    if (!btn) return;
    const kind = btn.getAttribute('data-kind');
    const id = btn.getAttribute('data-id');
    const {setPalette, setLineup} = store.getState();
    if (kind === 'palette') setPalette(id);
    if (kind === 'lineup') setLineup(id);
  });

  render(store.getState());
}
