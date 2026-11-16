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

const skillet = new LatheGeometry(
  [
    new Vector2(0.02, 0),
    new Vector2(0.55, 0.02),
    new Vector2(0.74, 0.06),
    new Vector2(0.8, 0.16),
    new Vector2(0.74, 0.21),
    new Vector2(0.66, 0.12),
    new Vector2(0.16, 0.09),
    new Vector2(0.02, 0.12),
  ],
  56,
);

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

function Piece({ motion, finish }) {
  const group = useRef(null);
  const camera = useThree((state) => state.camera);
  useFrame((_, delta) => {
    if (!group.current || !motion.live) return;
    if (motion.auto && !motion.held) motion.yaw += delta * 0.22;
    motion.tilt += (motion.tiltTarget - motion.tilt) * 0.14;
    motion.dolly += (motion.dollyTarget - motion.dolly) * 0.14;
    group.current.rotation.y = motion.yaw;
    group.current.rotation.x = motion.tilt;
    camera.position.set(0.15, 1.25, Math.max(4.2, motion.dolly));
    camera.lookAt(-0.15, 0.02, 0);
    document.documentElement.dataset.mtDolly = `${camera.position.z.toFixed(2)}|${group.current.position.x.toFixed(2)}|${motion.yaw.toFixed(2)}`;
  });
  return     h(
    'group',
    { ref: group, position: [-0.32, 0, 0] },
    h('mesh', { geometry: skillet, material: materials[finish] || materials.bronze }),
    h(
      'mesh',
      { material: materials[finish] || materials.bronze, position: [1.02, 0.15, 0], rotation: [0, 0, -0.55] },
      h('boxGeometry', { args: [0.56, 0.055, 0.13] }),
    ),
    h(
      'mesh',
      { rotation: [-Math.PI / 2, 0, 0], position: [0.1, -0.08, 0] },
      h('circleGeometry', { args: [1.15, 40] }),
      h('meshBasicMaterial', { color: '#1a140f', transparent: true, opacity: 0.2, depthWrite: false }),
    ),
  );
}

function Stage({ motion, reduced }) {
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
    h(Piece, { motion, finish }),
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
    pump: false,
    onFinish: null,
    setLive: null,
    invalidate: null,
  };

  const reactRoot = createRoot(host);
  reactRoot.render(h(Stage, { motion, reduced: motion.reduced }));

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
      const button = event.target instanceof Element ? event.target.closest('[data-mt-turn], [data-mt-dolly]') : null;
      if (!button || !root.contains(button)) return;
      motion.auto = false;
      if (button.hasAttribute('data-mt-turn')) motion.yaw += Number(button.dataset.mtTurn) * 0.45;
      if (button.hasAttribute('data-mt-dolly')) {
        motion.dollyTarget = Math.min(4.4, Math.max(2.15, motion.dollyTarget + Number(button.dataset.mtDolly) * 0.35));
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
