import { createElement as h, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { DragGesture, PinchGesture } from '@use-gesture/vanilla';
import { DoubleSide, LatheGeometry, MeshStandardMaterial, Vector2 } from 'three';

/**
 * Material study for a product page.
 * React Three Fiber draws one lathed vessel with Three's stock standard material.
 * Size, colour, and add-to-bag stay on the Liquid product form above this room.
 */

const FINISHES = {
  bronze: { color: '#C58B43', metalness: 0.42, roughness: 0.38 },
  clay: { color: '#A45A3D', metalness: 0.02, roughness: 0.92 },
  soot: { color: '#4a433c', metalness: 0.28, roughness: 0.58 },
};

const materials = Object.fromEntries(
  Object.entries(FINISHES).map(
    ([name, preset]) => [name, new MeshStandardMaterial({ ...preset, side: DoubleSide })],
  ),
);

// Profiles adapted from the local Round Room demo's vessel studies. The
// dimensions are illustrative; product specifications remain in Liquid.
const PROFILES = {
  pan: [[0.02, 0], [0.55, 0.02], [0.74, 0.06], [0.8, 0.16], [0.74, 0.21], [0.66, 0.12], [0.16, 0.09], [0.02, 0.12]],
  kadai: [[0.02, 0], [0.48, 0.03], [0.7, 0.16], [0.84, 0.4], [0.9, 0.64], [0.84, 0.66], [0.77, 0.44], [0.62, 0.23], [0.02, 0.12]],
  pot: [[0.02, 0], [0.55, 0], [0.66, 0.05], [0.7, 0.18], [0.7, 0.83], [0.64, 0.83], [0.63, 0.17], [0.53, 0.11], [0.02, 0.11]],
  handi: [[0.02, 0], [0.45, 0.02], [0.7, 0.16], [0.83, 0.42], [0.78, 0.72], [0.62, 0.88], [0.57, 0.82], [0.71, 0.68], [0.75, 0.42], [0.62, 0.24], [0.02, 0.12]],
};
const geometries = Object.fromEntries(Object.entries(PROFILES).map(([kind, profile]) => [
  kind,
  new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 64),
]));
const kindsWithLongHandle = new Set(['pan']);

const TILT_MIN = -0.2;
const TILT_MAX = 0.82;
const DOLLY = 4.8;
const TILT_REST = 0.38;

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function reducedMotion() {
  const flag = document.documentElement.dataset.reducedMotion;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Environment() {
  return h(
    'group',
    null,
    h('hemisphereLight', { args: ['#f7f5f0', '#2a2118', 1.15] }),
    h('directionalLight', { position: [2.4, 3.6, 1.8], intensity: 3.1, color: '#ffe2b0' }),
    h('directionalLight', { position: [-2.6, 1.1, -1.6], intensity: 0.85, color: '#d7e2ee' }),
  );
}

function Piece({ motion, finish, kind }) {
  const group = useRef(null);
  const body = useRef(null);
  const lid = useRef(null);
  const camera = useThree((state) => state.camera);
  useFrame((_, delta) => {
    if (!group.current || !motion.live) return;
    if (motion.auto && !motion.held) motion.yaw += delta * 0.22;
    motion.tilt += (motion.tiltTarget - motion.tilt) * 0.14;
    motion.dolly += (motion.dollyTarget - motion.dolly) * 0.14;
    group.current.rotation.y = motion.yaw;
    group.current.rotation.x = motion.tilt;
    if (body.current) body.current.position.y = motion.explode * 0.13;
    if (lid.current) {
      lid.current.visible = motion.lid;
      lid.current.position.y = (kind === 'pot' || kind === 'handi' ? 0.89 : 0.69) + motion.explode * 0.38;
    }
    camera.position.set(0.15, 1.25, Math.max(4.2, motion.dolly));
    camera.lookAt(-0.15, 0.02, 0);
    document.documentElement.dataset.mtDolly = `${camera.position.z.toFixed(2)}|${group.current.position.x.toFixed(2)}|${motion.yaw.toFixed(2)}`;
  });
  return h(
    'group',
    { ref: group, position: [-0.32, 0, 0] },
    h('mesh', { ref: body, geometry: geometries[kind] || geometries.pan, material: materials[finish] || materials.bronze }),
    kindsWithLongHandle.has(kind) ? h(
      'mesh',
      { material: materials[finish] || materials.bronze, position: [1.02, 0.15, 0], rotation: [0, 0, -0.55] },
      h('boxGeometry', { args: [0.56, 0.055, 0.13] }),
    ) : h('group', null,
      h('mesh', { position: [-0.86, 0.55, 0], rotation: [0, Math.PI / 2, 0], material: materials[finish] || materials.bronze }, h('torusGeometry', { args: [0.14, 0.035, 10, 28] })),
      h('mesh', { position: [0.86, 0.55, 0], rotation: [0, Math.PI / 2, 0], material: materials[finish] || materials.bronze }, h('torusGeometry', { args: [0.14, 0.035, 10, 28] }))),
    h('mesh', { ref: lid, visible: false, material: materials[finish] || materials.bronze }, h('cylinderGeometry', { args: [kind === 'pan' ? 0.77 : 0.67, kind === 'pan' ? 0.77 : 0.67, 0.055, 64] })),
    h(
      'mesh',
      { rotation: [-Math.PI / 2, 0, 0], position: [0.1, -0.08, 0] },
      h('circleGeometry', { args: [1.15, 40] }),
      h('meshBasicMaterial', { color: '#1a140f', transparent: true, opacity: 0.2, depthWrite: false }),
    ),
  );
}

function Stage({ motion, reduced, kind }) {
  const [finish, setFinish] = useState(motion.finish);
  const [live, setLive] = useState(true);
  useEffect(() => {
    motion.onFinish = setFinish;
    motion.setLive = setLive;
    return () => {
      motion.onFinish = null;
      motion.setLive = null;
    };
  }, [motion]);
  return h(
    Canvas,
    {
      frameloop: !live ? 'never' : reduced ? 'demand' : 'always',
      dpr: [1, 1.5],
      gl: { antialias: true, alpha: true },
      camera: { position: [0.05, 0.95, DOLLY], fov: 30 },
      onCreated: ({ gl, scene, invalidate }) => {
        gl.setClearColor('#14110e', 1);
        gl.domElement.setAttribute('aria-hidden', 'true');
        motion.invalidate = invalidate;
        motion.scene = scene;
        invalidate();
      },
    },
    h(Environment),
    h(Piece, { motion, finish, kind }),
  );
}

function kick(motion) {
  if (!motion.reduced || motion.pump) return;
  const step = () => {
    motion.invalidate?.();
    const settled =
      !motion.held &&
      !motion.auto &&
      Math.abs(motion.tilt - motion.tiltTarget) < 0.002 &&
      Math.abs(motion.dolly - motion.dollyTarget) < 0.002;
    if (!settled && motion.live) {
      requestAnimationFrame(step);
    } else {
      motion.pump = false;
    }
  };
  motion.pump = true;
  step();
}

const mounted = new Map();

function mount(root) {
  if (root.dataset.mtMounted === 'true') return;
  const host = root.querySelector('[data-mt-canvas]');
  const fallback = root.querySelector('[data-mt-fallback]');
  const status = root.querySelector('[data-mt-finish-status]');
  if (!host) return;
  root.dataset.mtMounted = 'true';

  if (!hasWebGL()) {
    if (fallback) fallback.hidden = false;
    return;
  }

  const motion = {
    finish: 'bronze',
    yaw: 0.4,
    tilt: TILT_REST,
    tiltTarget: TILT_REST,
    dolly: DOLLY,
    dollyTarget: DOLLY,
    auto: !reducedMotion(),
    held: false,
    live: true,
    reduced: reducedMotion(),
    explode: 0,
    lid: false,
    pump: false,
    onFinish: null,
    setLive: null,
    invalidate: null,
  };

  const reactRoot = createRoot(host);
  reactRoot.render(h(Stage, { motion, reduced: motion.reduced, kind: root.dataset.vesselKind || 'pan' }));

  const observer = new IntersectionObserver(
    ([entry]) => {
      motion.live = entry.isIntersecting;
      motion.setLive?.(entry.isIntersecting);
      if (entry.isIntersecting) kick(motion);
    },
    { rootMargin: '160px' },
  );
  observer.observe(root);

  const drag = new DragGesture(
    host,
    ({ delta: [dx, dy], last, pinching }) => {
      if (pinching) return;
      motion.auto = false;
      motion.held = !last;
      motion.yaw += dx * 0.01;
      const next = motion.tiltTarget + dy * 0.006;
      if (next < TILT_MIN || next > TILT_MAX) motion.tiltTarget += dy * 0.0016;
      else motion.tiltTarget = next;
      if (last) {
        motion.held = false;
        motion.tiltTarget = Math.min(TILT_MAX, Math.max(TILT_MIN, motion.tiltTarget));
      }
      kick(motion);
    },
    { filterTaps: true, pointer: { touch: true } },
  );

  const pinch = new PinchGesture(
    host,
    ({ offset: [scale], active, last }) => {
      if (!active || !Number.isFinite(scale) || scale <= 0.2) return;
      motion.auto = false;
      const next = DOLLY / scale;
      const min = 4.2;
      const max = 7.2;
      const clamped = Math.min(max, Math.max(min, next));
      const overflow = next - clamped;
      motion.dollyTarget = last ? clamped : clamped + overflow * 0.2;
      kick(motion);
    },
    { scaleBounds: { min: 0.72, max: 1.7 } },
  );

  const abort = new AbortController();
  const onReducedMotion = (event) => {
    const reduced = event?.detail?.reduced ?? reducedMotion();
    motion.reduced = Boolean(reduced);
    if (motion.reduced) motion.auto = false;
    kick(motion);
  };
  document.addEventListener('maison:reduced-motion', onReducedMotion, { signal: abort.signal });

  root.addEventListener(
    'change',
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.name !== root.dataset.finishGroup) return;
      if (!materials[input.value]) return;
      motion.finish = input.value;
      motion.onFinish?.(input.value);
      root.dataset.finish = input.value;
      if (status) status.textContent = input.closest('label')?.innerText?.trim() || input.value;
      kick(motion);
    },
    { signal: abort.signal },
  );

  root.addEventListener(
    'click',
    (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-mt-turn], [data-mt-dolly], [data-mt-view], [data-mt-lid], [data-mt-explode]') : null;
      if (!button || !root.contains(button)) return;
      motion.auto = false;
      if (button.hasAttribute('data-mt-turn')) motion.yaw += Number(button.dataset.mtTurn) * 0.45;
      if (button.hasAttribute('data-mt-dolly')) {
        motion.dollyTarget = Math.min(7.2, Math.max(4.2, motion.dollyTarget + Number(button.dataset.mtDolly) * 0.35));
      }
      if (button.hasAttribute('data-mt-view')) {
        motion.tiltTarget = { hero: 0.38, overhead: 0.78, profile: 0.02 }[button.dataset.mtView] ?? 0.38;
        motion.dollyTarget = DOLLY;
        root.querySelectorAll('[data-mt-view]').forEach((control) => control.setAttribute('aria-pressed', String(control === button)));
      }
      if (button.hasAttribute('data-mt-lid')) {
        motion.lid = !motion.lid;
        button.setAttribute('aria-pressed', String(motion.lid));
      }
      if (button.hasAttribute('data-mt-explode')) {
        motion.explode = motion.explode ? 0 : 1;
        button.setAttribute('aria-pressed', String(Boolean(motion.explode)));
      }
      kick(motion);
    },
    { signal: abort.signal },
  );

  mounted.set(root, () => {
    abort.abort();
    observer.disconnect();
    drag.destroy();
    pinch.destroy();
    reactRoot.unmount();
    delete root.dataset.mtMounted;
  });
}

function mountAll() {
  document.querySelectorAll('[data-mt-vessel]').forEach(mount);
}

function unmountAll() {
  mounted.forEach((destroy, root) => {
    destroy();
    mounted.delete(root);
  });
}

window.MaisonVessel = { mountAll, unmountAll };
document.addEventListener('maison:page-leave', unmountAll);
document.addEventListener('maison:page-enter', mountAll);

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
else mountAll();
