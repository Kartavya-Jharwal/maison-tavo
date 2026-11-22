import { createContext, useContext, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export type VesselKind =
  | 'skillet'
  | 'saucier'
  | 'saucepan'
  | 'cocotte'
  | 'rondeau'
  | 'grill'
  | 'tawa'
  | 'wok'
  | 'stockpot'
  | 'sauteuse'
  | 'lid'
  | 'steamer'
  | 'carekit'
  | 'handi'
  | 'matka'
  | 'pressure'
  | 'chai'
  | 'collection';

export type Finish = 'steel' | 'copper' | 'iron' | 'terracotta' | 'burnished' | 'charcoal';

export const FINISHES: Record<Finish, { label: string; color: string; rough: number; metalness: number; clearcoat: number }> = {
  steel: { label: 'Five-ply steel', color: '#c8c9c3', rough: 0.22, metalness: 0.98, clearcoat: 0.4 },
  copper: { label: 'Copper', color: '#b86b43', rough: 0.19, metalness: 1, clearcoat: 0.45 },
  iron: { label: 'Cast iron', color: '#2b2926', rough: 0.54, metalness: 0.45, clearcoat: 0.1 },
  terracotta: { label: 'Raw terracotta', color: '#b27a57', rough: 0.88, metalness: 0.02, clearcoat: 0 },
  burnished: { label: 'Burnished earth', color: '#946247', rough: 0.62, metalness: 0.05, clearcoat: 0.08 },
  charcoal: { label: 'Smoked charcoal', color: '#3b3530', rough: 0.84, metalness: 0.06, clearcoat: 0 },
};

const STEEL_INNER = { color: '#c4c5bf', rough: 0.24 };
const KANSA = { color: '#c68a59', rough: 0.28, metalness: 0.96 };
const BRASS = { color: '#b08d57', rough: 0.3 };
const HANDLE_BY_FINISH: Record<Finish, string> = {
  copper: '#8b5a3d',
  steel: '#b9bab4',
  iron: '#2b2926',
  terracotta: '#c68a59',
  burnished: '#c68a59',
  charcoal: '#b57b4c',
};

const v2 = (points: number[][]) => points.map(([x, y]) => new THREE.Vector2(x, y));

/** When true, KansaBase renders nothing — the exploded view draws its base layers separately. */
export const OmitBaseContext = createContext(false);

let clayBumpTex: THREE.CanvasTexture | null = null;
let kansaBumpTex: THREE.CanvasTexture | null = null;

/** Procedural micro-porosity bump for unglazed terracotta. */
export function getClayBump() {
  if (clayBumpTex) return clayBumpTex;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 24000; i++) {
    const value = 90 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgb(${value},${value},${value})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }
  clayBumpTex = new THREE.CanvasTexture(canvas);
  clayBumpTex.wrapS = clayBumpTex.wrapT = THREE.RepeatWrapping;
  clayBumpTex.repeat.set(4, 4);
  return clayBumpTex;
}

/** Procedural hammer-dimple bump for hand-beaten Kansa bronze. */
export function getKansaBump() {
  if (kansaBumpTex) return kansaBumpTex;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 6 + Math.random() * 12;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.75, '#505050');
    gradient.addColorStop(1, '#808080');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  kansaBumpTex = new THREE.CanvasTexture(canvas);
  kansaBumpTex.wrapS = kansaBumpTex.wrapT = THREE.RepeatWrapping;
  kansaBumpTex.repeat.set(6, 3);
  return kansaBumpTex;
}

const PROFILES = {
  skilletOuter: v2([[0, 0], [1.42, 0], [1.62, 0.06], [1.79, 0.23], [1.92, 0.52], [1.98, 0.83], [1.9, 0.85], [1.84, 0.55], [1.71, 0.31], [1.52, 0.17], [0, 0.14]]),
  skilletInner: v2([[0, 0.155], [1.49, 0.19], [1.68, 0.33], [1.82, 0.57], [1.89, 0.81]]),
  saucierOuter: v2([[0, 0], [0.95, 0], [1.25, 0.08], [1.45, 0.3], [1.55, 0.62], [1.58, 0.95]]),
  saucierInner: v2([[0, 0.16], [0.9, 0.16], [1.2, 0.26], [1.4, 0.55], [1.49, 0.9]]),
  saucepanOuter: v2([[0, 0], [1.02, 0], [1.1, 0.06], [1.14, 0.35], [1.14, 1.05]]),
  saucepanInner: v2([[0, 0.14], [0.96, 0.14], [1.02, 0.32], [1.02, 1.0]]),
  saucepanLid: v2([[0, 1.08], [0.55, 1.1], [0.95, 1.17], [1.1, 1.28]]),
  cocotteOuter: v2([[0, 0], [1.25, 0], [1.45, 0.1], [1.55, 0.45], [1.5, 0.85], [1.42, 1.05]]),
  cocotteInner: v2([[0, 0.15], [1.2, 0.15], [1.38, 0.4], [1.42, 0.8], [1.34, 1.0]]),
  cocotteLid: v2([[0.25, 1.08], [0.8, 1.1], [1.25, 1.18], [1.4, 1.28], [1.41, 1.32]]),
  rondeauOuter: v2([[0, 0], [1.5, 0], [1.68, 0.07], [1.82, 0.25], [1.9, 0.55], [1.93, 0.72]]),
  rondeauInner: v2([[0, 0.15], [1.45, 0.15], [1.62, 0.24], [1.76, 0.45], [1.83, 0.68]]),
  wokOuter: v2([[0, 0], [0.88, 0.02], [1.28, 0.14], [1.52, 0.44], [1.64, 0.82], [1.66, 1.04]]),
  wokInner: v2([[0, 0.11], [0.84, 0.12], [1.22, 0.22], [1.44, 0.49], [1.56, 0.84], [1.59, 1.01]]),
  stockpotOuter: v2([[0, 0], [1.18, 0], [1.26, 0.07], [1.3, 0.5], [1.3, 1.7]]),
  stockpotInner: v2([[0, 0.14], [1.12, 0.14], [1.18, 0.4], [1.18, 1.66]]),
  stockpotLid: v2([[0, 1.73], [0.75, 1.76], [1.15, 1.84], [1.27, 1.94]]),
  sauteuseOuter: v2([[0, 0], [1.3, 0], [1.38, 0.06], [1.42, 0.34], [1.44, 0.72]]),
  sauteuseInner: v2([[0, 0.13], [1.26, 0.13], [1.32, 0.32], [1.36, 0.69]]),
  tawaDisc: v2([[0, 0.02], [1.4, 0.03], [1.65, 0.08], [1.75, 0.22], [1.66, 0.23], [1.52, 0.15], [0, 0.11]]),
  handiOuter: v2([[0, 0.05], [1.18, 0.06], [1.55, 0.28], [1.68, 0.7], [1.52, 1.12], [1.32, 1.24], [1.38, 1.32], [1.24, 1.32], [1.2, 1.2], [1.44, 0.72], [1.38, 0.34], [1.1, 0.18], [0, 0.17]]),
  matkaOuter: v2([[0, 0.05], [0.95, 0.06], [1.48, 0.42], [1.66, 0.92], [1.42, 1.46], [1.02, 1.74], [1.18, 1.88], [1.06, 1.92], [0.88, 1.72], [1.26, 1.36], [1.48, 0.9], [1.32, 0.46], [0.88, 0.18], [0, 0.17]]),
  pressureOuter: v2([[0, 0.05], [1.15, 0.06], [1.3, 0.16], [1.34, 1.28], [1.24, 1.4], [1.16, 1.36], [1.2, 0.24], [1.08, 0.18], [0, 0.17]]),
  chaiOuter: v2([[0, 0.05], [0.9, 0.06], [1.0, 0.2], [1.02, 1.08], [1.08, 1.14], [0.94, 1.14], [0.92, 0.22], [0.84, 0.16], [0, 0.16]]),
};

const RIM_SPECS: Partial<Record<VesselKind, { radius: number; y: number }>> = {
  skillet: { radius: 1.91, y: 0.84 },
  saucier: { radius: 1.52, y: 0.95 },
  saucepan: { radius: 1.08, y: 1.05 },
  cocotte: { radius: 1.36, y: 1.05 },
  rondeau: { radius: 1.86, y: 0.72 },
  wok: { radius: 1.61, y: 1.04 },
  stockpot: { radius: 1.23, y: 1.7 },
  sauteuse: { radius: 1.38, y: 0.72 },
  handi: { radius: 1.28, y: 1.3 },
  matka: { radius: 1.05, y: 1.89 },
  chai: { radius: 0.98, y: 1.13 },
};

function LongHandle({ x, y, z = 0, length = 2.6, color, lift = 0.13 }: { x: number; y: number; z?: number; length?: number; color: string; lift?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, 0, 0.1]}>
      <RoundedBox args={[0.7, 0.22, 0.4]} radius={0.08} smoothness={4} position={[0.2, 0, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.27} />
      </RoundedBox>
      <RoundedBox args={[length, 0.16, 0.3]} radius={0.07} smoothness={4} position={[length / 2 + 0.45, lift, 0]} castShadow>
        <meshPhysicalMaterial color={color} metalness={1} roughness={0.24} clearcoat={0.25} />
      </RoundedBox>
      <mesh position={[length + 0.82, lift + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.08, 0.026, 12, 32]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}

function LoopHandle({ x, y, r = 0.27, tube = 0.045, color }: { x: number; y: number; r?: number; tube?: number; color: string }) {
  return (
    <mesh position={[x, y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
      <torusGeometry args={[r, tube, 14, 40]} />
      <meshStandardMaterial color={color} metalness={1} roughness={0.26} />
    </mesh>
  );
}

function Knob({ y, color = BRASS.color }: { y: number; color?: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.1, 0.14, 0.09, 24]} /><meshStandardMaterial color={color} roughness={0.28} metalness={1} /></mesh>
      <mesh position={[0, 0.11, 0]} castShadow><sphereGeometry args={[0.12, 24, 24]} /><meshStandardMaterial color={color} roughness={0.28} metalness={1} /></mesh>
    </group>
  );
}

/** Kansa bronze base plate + optional X-ray internal mesh/magnetic puck for Matka vessels */
function KansaBase({ radius = 1.15, xray = false }: { radius?: number; xray?: boolean }) {
  const omit = useContext(OmitBaseContext);
  if (omit) return null;
  return (
    <group>
      {/* Exposed hand-hammered Kansa underside plate */}
      <mesh position={[0, 0.028, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.94, 0.056, 64]} />
        <meshPhysicalMaterial color={KANSA.color} metalness={KANSA.metalness} roughness={KANSA.rough} clearcoat={0.2} bumpMap={getKansaBump()} bumpScale={0.04} />
      </mesh>
      {/* Subtle hammered collar */}
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.99, 0.018, 12, 64]} />
        <meshStandardMaterial color="#9f673f" metalness={1} roughness={0.34} />
      </mesh>
      {xray && (
        <group>
          {/* 430 Ferromagnetic Induction Core Puck */}
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[radius * 0.78, radius * 0.78, 0.055, 48]} />
            <meshStandardMaterial color="#677075" metalness={0.95} roughness={0.25} emissive="#2c3e4c" emissiveIntensity={0.35} />
          </mesh>
          {/* 3D Structural Stainless Wireframe Mesh Cage */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[radius * 1.12, radius * 0.92, 0.72, 20, 4, true]} />
            <meshBasicMaterial color="#d89a73" wireframe transparent opacity={0.75} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Flush-fitting Universal Lid that drops onto any compatible rim */
function SharedLid({ radius, y, color, metalness, rough }: { radius: number; y: number; color: string; metalness: number; rough: number }) {
  const profile = v2([[0, 0.09], [radius * 0.45, 0.08], [radius * 0.86, 0.04], [radius, 0]]);
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <latheGeometry args={[profile, 72]} />
        <meshPhysicalMaterial color={color} metalness={metalness} roughness={rough} clearcoat={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.985, 0.022, 12, 72]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.2} />
      </mesh>
      <Knob y={0.14} color={color} />
    </group>
  );
}

export interface VesselProps {
  kind: VesselKind;
  finish: Finish;
  diameterCm?: number;
  showLid?: boolean;
  xray?: boolean;
  showDimensions?: boolean;
  baseCm?: number;
  inductionZoneCm?: number;
}

export function VesselBody({
  kind,
  finish,
  diameterCm = 24,
  showLid = false,
  xray = false,
}: Omit<VesselProps, 'showDimensions' | 'baseCm' | 'inductionZoneCm'>) {
  const mat = FINISHES[finish];
  const handle = HANDLE_BY_FINISH[finish];
  const isClay = finish === 'terracotta' || finish === 'burnished' || finish === 'charcoal';
  const bodyOpacity = xray ? 0.36 : 1;

  const bodyMat = (
    <meshPhysicalMaterial
      color={mat.color}
      metalness={mat.metalness}
      roughness={mat.rough}
      clearcoat={mat.clearcoat}
      clearcoatRoughness={0.14}
      side={THREE.DoubleSide}
      transparent={xray}
      opacity={bodyOpacity}
      depthWrite={!xray}
      bumpMap={isClay ? getClayBump() : null}
      bumpScale={0.025}
    />
  );

  const innerMat = isClay ? (
    <meshPhysicalMaterial
      color={finish === 'charcoal' ? '#4a4038' : '#a8704e'}
      metalness={0.02}
      roughness={0.85}
      side={THREE.DoubleSide}
      transparent={xray}
      opacity={bodyOpacity}
      depthWrite={!xray}
    />
  ) : (
    <meshPhysicalMaterial
      color={STEEL_INNER.color}
      metalness={0.96}
      roughness={STEEL_INNER.rough}
      side={THREE.DoubleSide}
      transparent={xray}
      opacity={bodyOpacity}
    />
  );

  const rimSpec = RIM_SPECS[kind];
  const addHelper = diameterCm >= 26;
  const dualLoopsKadhai = diameterCm >= 28;
  const dualLoopsTawa = diameterCm >= 30;

  const renderShape = () => {
    switch (kind) {
      case 'skillet':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.skilletOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.skilletInner, 128]} />{innerMat}</mesh>
            <mesh position={[0, 0.845, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[1.94, 0.034, 16, 128]} />
              <meshStandardMaterial color={finish === 'copper' ? '#d59567' : mat.color} metalness={1} roughness={0.16} />
            </mesh>
            <LongHandle x={1.78} y={0.52} length={3.05} color={handle} />
            {addHelper && <LoopHandle x={-2.06} y={0.68} r={0.24} tube={0.04} color={handle} />}
            {[0.58, 0.76].map((y, index) => (
              <mesh key={y} position={[1.75 - index * 0.03, y, index === 0 ? -0.17 : 0.17]} rotation={[0, 0, Math.PI / 2]}>
                <sphereGeometry args={[0.06, 20, 20]} /><meshStandardMaterial color={handle} metalness={1} roughness={0.2} />
              </mesh>
            ))}
          </group>
        );
      case 'saucier':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.saucierOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.saucierInner, 128]} />{innerMat}</mesh>
            <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.545, 0.03, 14, 110]} /><meshStandardMaterial color={mat.color} metalness={1} roughness={0.15} /></mesh>
            <LongHandle x={1.42} y={0.72} length={2.5} color={handle} />
          </group>
        );
      case 'saucepan':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.saucepanOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.saucepanInner, 128]} />{innerMat}</mesh>
            <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.09, 0.03, 14, 110]} /><meshStandardMaterial color={mat.color} metalness={1} roughness={0.15} /></mesh>
            <LongHandle x={1.02} y={0.82} length={2.3} color={handle} />
          </group>
        );
      case 'cocotte':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.cocotteOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.cocotteInner, 128]} />{innerMat}</mesh>
            <LoopHandle x={1.6} y={0.72} color={handle} />
            <LoopHandle x={-1.6} y={0.72} color={handle} />
          </group>
        );
      case 'rondeau':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.rondeauOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.rondeauInner, 128]} />{innerMat}</mesh>
            <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.885, 0.035, 14, 120]} /><meshStandardMaterial color={mat.color} metalness={1} roughness={0.15} /></mesh>
            <LoopHandle x={2.02} y={0.5} r={0.3} color={handle} />
            <LoopHandle x={-2.02} y={0.5} r={0.3} color={handle} />
          </group>
        );
      case 'grill':
        return (
          <group>
            <RoundedBox args={[2.3, 0.42, 2.3]} radius={0.07} smoothness={4} position={[0, 0.21, 0]} castShadow receiveShadow>
              <meshPhysicalMaterial color={mat.color} metalness={mat.metalness} roughness={mat.rough} clearcoat={0.15} />
            </RoundedBox>
            {Array.from({ length: 7 }).map((_, index) => (
              <mesh key={index} position={[0, 0.44, -0.78 + index * 0.26]} castShadow>
                <boxGeometry args={[1.95, 0.07, 0.09]} />
                <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={0.6} />
              </mesh>
            ))}
            <LongHandle x={1.1} y={0.3} length={2.2} color={handle} />
            <LoopHandle x={-1.35} y={0.3} r={0.22} tube={0.04} color={handle} />
          </group>
        );
      case 'tawa':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.tawaDisc, 128]} />{bodyMat}</mesh>
            {isClay && <KansaBase radius={1.42} xray={xray} />}
            {dualLoopsTawa ? (
              <>
                <LoopHandle x={1.86} y={0.24} r={0.22} tube={0.04} color={handle} />
                <LoopHandle x={-1.86} y={0.24} r={0.22} tube={0.04} color={handle} />
              </>
            ) : (
              <LongHandle x={1.6} y={0.22} length={1.65} lift={0.09} color={handle} />
            )}
          </group>
        );
      case 'wok':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.wokOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.wokInner, 128]} />{innerMat}</mesh>
            {isClay && <KansaBase radius={0.96} xray={xray} />}
            <mesh position={[0, 1.04, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.63, 0.032, 14, 120]} /><meshStandardMaterial color={isClay ? KANSA.color : mat.color} metalness={1} roughness={0.2} /></mesh>
            {dualLoopsKadhai || isClay ? (
              <>
                <LoopHandle x={1.76} y={0.85} r={0.26} tube={0.042} color={handle} />
                <LoopHandle x={-1.76} y={0.85} r={0.26} tube={0.042} color={handle} />
              </>
            ) : (
              <>
                <LongHandle x={1.5} y={0.85} length={2.45} color={handle} />
                <LoopHandle x={-1.78} y={0.85} r={0.24} tube={0.04} color={handle} />
              </>
            )}
          </group>
        );
      case 'stockpot':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.stockpotOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.stockpotInner, 128]} />{innerMat}</mesh>
            {isClay && <KansaBase radius={1.2} xray={xray} />}
            <mesh position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.24, 0.035, 14, 110]} /><meshStandardMaterial color={isClay ? KANSA.color : mat.color} metalness={1} roughness={0.2} /></mesh>
            <LoopHandle x={1.42} y={1.32} color={handle} />
            <LoopHandle x={-1.42} y={1.32} color={handle} />
          </group>
        );
      case 'sauteuse':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.sauteuseOuter, 128]} />{bodyMat}</mesh>
            <mesh><latheGeometry args={[PROFILES.sauteuseInner, 128]} />{innerMat}</mesh>
            <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.41, 0.03, 14, 110]} /><meshStandardMaterial color={mat.color} metalness={1} roughness={0.15} /></mesh>
            <LongHandle x={1.34} y={0.5} length={2.4} color={handle} />
            <LoopHandle x={-1.62} y={0.5} r={0.22} tube={0.04} color={handle} />
          </group>
        );
      case 'handi':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.handiOuter, 128]} />{bodyMat}</mesh>
            <KansaBase radius={1.22} xray={xray} />
            <LoopHandle x={1.68} y={0.82} r={0.24} tube={0.045} color={KANSA.color} />
            <LoopHandle x={-1.68} y={0.82} r={0.24} tube={0.045} color={KANSA.color} />
          </group>
        );
      case 'matka':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.matkaOuter, 128]} />{bodyMat}</mesh>
            <KansaBase radius={1.04} xray={xray} />
            <LoopHandle x={1.66} y={1.08} r={0.23} tube={0.045} color={KANSA.color} />
            <LoopHandle x={-1.66} y={1.08} r={0.23} tube={0.045} color={KANSA.color} />
          </group>
        );
      case 'pressure':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.pressureOuter, 128]} />{bodyMat}</mesh>
            <KansaBase radius={1.18} xray={xray} />
            {/* Machined Kansa bayonet locking collar */}
            <mesh position={[0, 1.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.24, 0.065, 16, 80]} />
              <meshStandardMaterial color={KANSA.color} metalness={1} roughness={0.22} />
            </mesh>
            {/* Domed lid + regulator weight */}
            <SharedLid radius={1.2} y={1.4} color={KANSA.color} metalness={1} rough={0.24} />
            <mesh position={[0.42, 1.5, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 0.14, 16]} /><meshStandardMaterial color="#3c372f" metalness={0.9} roughness={0.3} /></mesh>
            <LoopHandle x={1.48} y={1.26} r={0.26} tube={0.05} color={KANSA.color} />
            <LoopHandle x={-1.48} y={1.26} r={0.26} tube={0.05} color={KANSA.color} />
          </group>
        );
      case 'chai':
        return (
          <group>
            <mesh castShadow receiveShadow><latheGeometry args={[PROFILES.chaiOuter, 128]} />{bodyMat}</mesh>
            <KansaBase radius={0.94} xray={xray} />
            {/* Precision pour spout */}
            <mesh position={[-1.02, 1.07, 0]} rotation={[0, 0, 0.55]}>
              <cylinderGeometry args={[0.14, 0.08, 0.24, 16, 1, true, 0, Math.PI]} />
              <meshPhysicalMaterial color={mat.color} roughness={0.65} metalness={0.05} side={THREE.DoubleSide} />
            </mesh>
            {/* Counter-balanced mesh-anchored handle */}
            <LongHandle x={0.94} y={0.86} length={2.1} color={KANSA.color} />
          </group>
        );
      case 'lid':
        return <SharedLid radius={1.55} y={0.2} color={mat.color} metalness={mat.metalness} rough={mat.rough} />;
      case 'steamer':
        return (
          <group>
            {[0, 0.56].map((tierY) => (
              <group key={tierY} position={[0, tierY, 0]}>
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[1.45, 1.45, 0.52, 48, 1, true]} />
                  <meshStandardMaterial color="#c9a86a" roughness={0.78} metalness={0.02} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[1.45, 0.04, 12, 64]} />
                  <meshStandardMaterial color="#a8844c" roughness={0.82} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[1.38, 1.46, 0.14, 48]} />
              <meshStandardMaterial color="#b99658" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.16, 0.032, 12, 24, Math.PI]} />
              <meshStandardMaterial color="#9c7a42" roughness={0.85} />
            </mesh>
          </group>
        );
      case 'carekit':
        return (
          <group>
            <mesh position={[-0.5, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.38, 0.38, 1.2, 32]} />
              <meshPhysicalMaterial color="#e8e1d5" roughness={0.42} metalness={0.05} />
            </mesh>
            <mesh position={[-0.5, 1.26, 0]}><cylinderGeometry args={[0.16, 0.18, 0.16, 24]} /><meshStandardMaterial color="#1b1c19" roughness={0.35} /></mesh>
            <mesh position={[0.45, 0.55, 0.1]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 1.1, 32]} />
              <meshPhysicalMaterial color="#b86b43" roughness={0.3} metalness={0.85} />
            </mesh>
            <RoundedBox args={[1.1, 0.16, 0.72]} radius={0.04} smoothness={3} position={[0.1, 0.08, 0.72]} castShadow>
              <meshStandardMaterial color="#6e655a" roughness={0.92} />
            </RoundedBox>
          </group>
        );
      case 'collection':
        return (
          <group>
            <group position={[0, 0, 0.7]} rotation={[0, 0.45, 0]} scale={0.5}><VesselBody kind="skillet" finish={finish} /></group>
            <group position={[-1.25, 0, -0.55]} rotation={[0, 0.9, 0]} scale={0.46}><VesselBody kind="saucepan" finish={finish} /></group>
            <group position={[1.3, 0, -0.5]} rotation={[0, -0.5, 0]} scale={0.52}><VesselBody kind="cocotte" finish={finish === 'copper' ? 'iron' : finish} /></group>
          </group>
        );
    }
  };

  return (
    <group>
      {renderShape()}
      {showLid && rimSpec && kind !== 'lid' && kind !== 'pressure' && (
        <SharedLid
          radius={rimSpec.radius}
          y={rimSpec.y}
          color={isClay ? KANSA.color : mat.color}
          metalness={isClay ? 1 : mat.metalness}
          rough={isClay ? 0.26 : mat.rough}
        />
      )}
    </group>
  );
}

/** Floor concentric rings showing inner-rim Ø, base Ø and induction zone */
export function DimensionRings({ scale, baseCm, inductionZoneCm, diameterCm }: { scale: number; baseCm?: number; inductionZoneCm?: number; diameterCm: number }) {
  const rimR = 1.58 * scale;
  const baseR = ((baseCm ?? diameterCm * 0.72) / diameterCm) * rimR;
  const zoneR = ((inductionZoneCm ?? baseCm ?? diameterCm * 0.72) / diameterCm) * rimR;
  return (
    <group position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[rimR - 0.02, rimR, 96]} />
        <meshBasicMaterial color="#d89a73" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[baseR - 0.015, baseR, 72]} />
        <meshBasicMaterial color="#8aa394" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[zoneR - 0.04, zoneR - 0.025, 72]} />
        <meshBasicMaterial color="#f3efe7" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Vessel({
  kind,
  finish,
  diameterCm = 24,
  showLid = false,
  xray = false,
  showDimensions = false,
  baseCm,
  inductionZoneCm,
}: VesselProps) {
  const group = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const targetScale = Math.max(0.74, Math.min(1.24, diameterCm / 24));

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = Math.min(1, progress.current + delta * 1.9);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    group.current.scale.setScalar(targetScale * (0.88 + 0.12 * eased));
  });

  return (
    <group>
      <group ref={group} scale={targetScale * 0.88}>
        <VesselBody kind={kind} finish={finish} diameterCm={diameterCm} showLid={showLid} xray={xray} />
      </group>
      {showDimensions && (
        <DimensionRings scale={targetScale} baseCm={baseCm} inductionZoneCm={inductionZoneCm} diameterCm={diameterCm} />
      )}
    </group>
  );
}
