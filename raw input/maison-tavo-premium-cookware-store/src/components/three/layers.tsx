import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionRings, OmitBaseContext, VesselBody, getKansaBump, type Finish, type VesselKind } from './vessels';
import { ROMAN, type LayerPart, type LayerSpec } from '../../data/layers';

type Geo = { baseR: number; rimR: number; wallH: number };

/** Base radius, rim radius and wall height per silhouette, in model units. */
const GEOMETRY: Record<VesselKind, Geo> = {
  skillet: { baseR: 1.45, rimR: 1.9, wallH: 0.8 },
  saucier: { baseR: 0.95, rimR: 1.5, wallH: 0.9 },
  saucepan: { baseR: 1.0, rimR: 1.08, wallH: 1.0 },
  cocotte: { baseR: 1.25, rimR: 1.4, wallH: 1.0 },
  rondeau: { baseR: 1.5, rimR: 1.86, wallH: 0.7 },
  grill: { baseR: 1.1, rimR: 1.15, wallH: 0.4 },
  tawa: { baseR: 1.42, rimR: 1.7, wallH: 0.18 },
  wok: { baseR: 0.9, rimR: 1.6, wallH: 1.0 },
  stockpot: { baseR: 1.18, rimR: 1.26, wallH: 1.66 },
  sauteuse: { baseR: 1.3, rimR: 1.4, wallH: 0.7 },
  lid: { baseR: 1.2, rimR: 1.5, wallH: 0.15 },
  steamer: { baseR: 1.4, rimR: 1.45, wallH: 1.1 },
  carekit: { baseR: 0.5, rimR: 0.55, wallH: 0.4 },
  handi: { baseR: 1.18, rimR: 1.5, wallH: 1.2 },
  matka: { baseR: 0.95, rimR: 1.6, wallH: 1.8 },
  pressure: { baseR: 1.15, rimR: 1.3, wallH: 1.3 },
  chai: { baseR: 0.9, rimR: 1.0, wallH: 1.1 },
  collection: { baseR: 1.2, rimR: 1.5, wallH: 0.8 },
};

const THERMAL_VERTEX = /* glsl */ `
  #include <clipping_planes_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;

const THERMAL_FRAGMENT = /* glsl */ `
  #include <clipping_planes_pars_fragment>
  varying vec3 vWorld;
  uniform float uTime;
  uniform float uProgress;
  uniform float uSpread;

  vec3 ramp(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.09, 0.10, 0.11);
    vec3 c1 = vec3(0.25, 0.35, 0.30);
    vec3 c2 = vec3(0.84, 0.55, 0.27);
    vec3 c3 = vec3(0.80, 0.22, 0.13);
    vec3 c4 = vec3(1.00, 0.93, 0.80);
    if (t < 0.25) return mix(c0, c1, t * 4.0);
    if (t < 0.50) return mix(c1, c2, (t - 0.25) * 4.0);
    if (t < 0.75) return mix(c2, c3, (t - 0.50) * 4.0);
    return mix(c3, c4, (t - 0.75) * 4.0);
  }

  void main() {
    #include <clipping_planes_fragment>
    float reach = max(0.05, uSpread * uProgress);
    float heat = (1.0 - smoothstep(0.0, reach, vWorld.y)) * (0.35 + 0.65 * uProgress);
    heat += sin(vWorld.y * 8.0 - uTime * 3.0) * 0.04 * uProgress;
    gl_FragColor = vec4(ramp(heat), 1.0);
  }
`;

/** Section plane: removes the half of the vessel facing the default camera. */
export const CUT_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
const CUT_PLANES = [CUT_PLANE];
const NO_PLANES: THREE.Plane[] = [];

function Shell({ g, inset, color, rough, metalness, clearcoat = 0 }: { g: Geo; inset: number; color: string; rough: number; metalness: number; clearcoat?: number }) {
  return (
    <group>
      <mesh position={[0, g.wallH / 2 + 0.06, 0]}>
        <cylinderGeometry args={[g.rimR * inset, g.baseR * inset, g.wallH, 64, 1, true]} />
        <meshPhysicalMaterial color={color} metalness={metalness} roughness={rough} clearcoat={clearcoat} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[g.baseR * inset, g.baseR * inset, 0.04, 64]} />
        <meshPhysicalMaterial color={color} metalness={metalness} roughness={rough} clearcoat={clearcoat} />
      </mesh>
    </group>
  );
}

function LayerPartMesh({ part, kind, finish, diameterCm, showLid, clay }: { part: LayerPart; kind: VesselKind; finish: Finish; diameterCm: number; showLid: boolean; clay: boolean }) {
  const g = GEOMETRY[kind];
  switch (part) {
    case 'body':
      return (
        <OmitBaseContext.Provider value>
          <VesselBody kind={kind} finish={finish} diameterCm={diameterCm} showLid={showLid} />
        </OmitBaseContext.Provider>
      );
    case 'core':
      return <Shell g={g} inset={0.97} color="#d6d8da" rough={0.4} metalness={1} />;
    case 'lining':
      return <Shell g={g} inset={0.95} color="#c4c5bf" rough={0.24} metalness={0.96} />;
    case 'enamel':
      return <Shell g={g} inset={0.95} color="#5a2326" rough={0.32} metalness={0.08} clearcoat={0.7} />;
    case 'mesh':
      return kind === 'tawa' ? (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ keepMaterial: true }}>
          <planeGeometry args={[g.baseR * 1.7, g.baseR * 1.7, 16, 16]} />
          <meshStandardMaterial color="#d89a73" wireframe metalness={0.9} roughness={0.25} emissive="#5a3220" emissiveIntensity={0.5} />
        </mesh>
      ) : (
        <mesh position={[0, Math.max(0.12, g.wallH * 0.64) / 2 + 0.1, 0]} userData={{ keepMaterial: true }}>
          <cylinderGeometry args={[g.rimR * 0.98, g.baseR * 1.02, Math.max(0.12, g.wallH * 0.64), 28, 6, true]} />
          <meshStandardMaterial color="#d89a73" wireframe metalness={0.9} roughness={0.25} emissive="#5a3220" emissiveIntensity={0.5} />
        </mesh>
      );
    case 'puck':
      return (
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[g.baseR * 0.8, g.baseR * 0.8, 0.06, 48]} />
          <meshStandardMaterial color="#6f777b" metalness={0.95} roughness={0.28} />
        </mesh>
      );
    case 'plate':
      return (
        <mesh position={[0, clay ? 0.028 : -0.012, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[g.baseR, g.baseR * 0.94, 0.056, 64]} />
          {clay ? (
            <meshPhysicalMaterial color="#c68a59" metalness={0.96} roughness={0.28} clearcoat={0.2} bumpMap={getKansaBump()} bumpScale={0.04} />
          ) : (
            <meshStandardMaterial color="#a3a7a9" metalness={0.95} roughness={0.32} />
          )}
        </mesh>
      );
  }
}

function hotspotPosition(part: LayerPart, g: Geo): [number, number, number] {
  const x = g.rimR * 0.8;
  const z = g.rimR * 0.15;
  switch (part) {
    case 'body': return [x, g.wallH * 0.72 + 0.1, z];
    case 'core': return [x * 0.95, g.wallH * 0.45 + 0.06, z];
    case 'lining':
    case 'enamel': return [x * 0.88, g.wallH * 0.85, z];
    case 'mesh': return [g.rimR * 0.9, g.wallH * 0.35 + 0.1, z];
    case 'puck': return [g.baseR * 0.82, 0.14, z];
    case 'plate': return [g.baseR * 0.95, 0.02, z];
  }
}

export interface LayeredVesselProps {
  kind: VesselKind;
  finish: Finish;
  diameterCm: number;
  showLid: boolean;
  layers: LayerSpec[];
  explode: number;
  thermal: boolean;
  cutaway: boolean;
  spread: number;
  activeLayer: number | null;
  onSelectLayer: (index: number) => void;
  showDimensions: boolean;
  baseCm?: number;
  inductionZoneCm?: number;
  reduced: boolean;
}

export function LayeredVessel({
  kind, finish, diameterCm, showLid, layers, explode, thermal, cutaway, spread,
  activeLayer, onSelectLayer, showDimensions, baseCm, inductionZoneCm, reduced,
}: LayeredVesselProps) {
  const root = useRef<THREE.Group>(null);
  const scaler = useRef<THREE.Group>(null);
  const layerRefs = useRef<(THREE.Group | null)[]>([]);
  const entrance = useRef(0);
  const heat = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const controls = useThree((state) => state.controls) as unknown as { target: THREE.Vector3 } | null;

  const targetScale = Math.max(0.74, Math.min(1.24, diameterCm / 24));
  const clay = finish === 'terracotta' || finish === 'burnished' || finish === 'charcoal';
  const g = GEOMETRY[kind];

  const thermalMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: THERMAL_VERTEX,
    fragmentShader: THERMAL_FRAGMENT,
    uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uSpread: { value: 1 } },
    side: THREE.DoubleSide,
    clipping: true,
  }), []);
  useEffect(() => () => thermalMat.dispose(), [thermalMat]);

  useFrame((state, delta) => {
    // Entrance scale
    if (scaler.current) {
      entrance.current = Math.min(1, entrance.current + delta * 1.9);
      const eased = 1 - Math.pow(1 - entrance.current, 3);
      scaler.current.scale.setScalar(targetScale * (0.88 + 0.12 * eased));
    }

    // Exploded architecture
    const ease = reduced ? 1 : Math.min(1, delta * 6);
    layers.forEach((layer, index) => {
      const group = layerRefs.current[index];
      if (group) group.position.y = THREE.MathUtils.lerp(group.position.y, explode * layer.offset * 1.5, ease);
    });

    // Heat climbs from the base after the map is switched on
    heat.current = thermal ? Math.min(1, heat.current + delta / 3.2) : 0;
    thermalMat.uniforms.uTime.value = reduced ? 0 : state.clock.elapsedTime;
    thermalMat.uniforms.uProgress.value = thermal && reduced ? 1 : heat.current;
    thermalMat.uniforms.uSpread.value = spread * targetScale;

    // Swap materials for thermal view; apply section plane for cutaway
    root.current?.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (thermal && !mesh.userData.keepMaterial) {
        if (mesh.material !== thermalMat) {
          mesh.userData.original = mesh.material;
          mesh.material = thermalMat;
        }
      } else if (mesh.userData.original) {
        mesh.material = mesh.userData.original as THREE.Material;
        mesh.userData.original = undefined;
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (material.userData.clipOn !== cutaway) {
          material.clippingPlanes = cutaway ? CUT_PLANES : NO_PLANES;
          material.clipShadows = true;
          material.userData.clipOn = cutaway;
          material.needsUpdate = true;
        }
      });
    });

    // Ease the orbit target towards the inspected layer
    if (controls) {
      let targetY = 0.85;
      const focused = activeLayer !== null ? layerRefs.current[activeLayer] : null;
      if (focused) {
        focused.getWorldPosition(tmp);
        targetY = tmp.y + 0.35 * targetScale;
      }
      controls.target.y = THREE.MathUtils.lerp(controls.target.y, targetY, Math.min(1, delta * 3));
    }
  });

  return (
    <>
      <group ref={root}>
        <group ref={scaler} scale={targetScale * 0.88}>
          {layers.map((layer, index) => (
            <group key={layer.id} ref={(element) => { layerRefs.current[index] = element; }}>
              <LayerPartMesh part={layer.part} kind={kind} finish={finish} diameterCm={diameterCm} showLid={showLid && layer.part === 'body'} clay={clay} />
              <Html position={hotspotPosition(layer.part, g)} center zIndexRange={[12, 0]}>
                <button
                  className={`rr-hotspot ${activeLayer === index ? 'active' : ''}`}
                  onClick={(event) => { event.stopPropagation(); onSelectLayer(index); }}
                  aria-label={`Inspect ${layer.title}`}
                  title={layer.title}
                >
                  {ROMAN[index]}
                </button>
              </Html>
            </group>
          ))}
        </group>
      </group>
      {showDimensions && <DimensionRings scale={targetScale} baseCm={baseCm} inductionZoneCm={inductionZoneCm} diameterCm={diameterCm} />}
    </>
  );
}
