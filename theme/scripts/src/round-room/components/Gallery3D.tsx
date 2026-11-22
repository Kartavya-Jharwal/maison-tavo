import type React from 'react';
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Flame, Layers, Move3d, Pause, Play, RotateCcw, Ruler, Scissors, ShoppingBag, X } from 'lucide-react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LINE_ORDER, lineFor, products as allProducts, series, type Product, type SeriesId } from '../data/catalog';
import { BRIEFS, MATERIAL_PROFILES, ROMAN, materialSetFor } from '../data/layers';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { FINISHES, type Finish } from './three/vessels';
import { LayeredVessel } from './three/layers';
import { Button } from './ui';

export type CameraPreset = 'hero' | 'overhead' | 'profile' | 'underside';

const CAMERA_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  hero: [0, 3.4, 7.4],
  overhead: [0, 7.8, 0.8],
  profile: [6.8, 1.35, 0.2],
  underside: [3.2, -1.3, 6.2],
};

const ORBIT_TARGET: [number, number, number] = [0, 0.85, 0];

const finishFor = (product: Product): Finish => {
  if (product.seriesId === 'matka') {
    return product.id === 'matka-kadhai' ? 'charcoal' : product.id === 'matka-handi' ? 'burnished' : 'terracotta';
  }
  return /stainless|five-ply/i.test(product.material) ? 'steel' : product.material === 'Cast iron' ? 'iron' : 'copper';
};

const availableFinishesFor = (product: Product): Finish[] =>
  product.seriesId === 'matka' ? ['terracotta', 'burnished', 'charcoal'] : ['steel', 'copper', 'iron'];

const parseDiameterCm = (sizeName: string): number => {
  const cm = sizeName.match(/(\d+(?:\.\d+)?)\s*cm/);
  if (cm) return Number(cm[1]);
  const litres = sizeName.match(/(\d+(?:\.\d+)?)\s*L/);
  if (litres) return Math.min(30, 18 + Number(litres[1]) * 1.4);
  return 24;
};

function StageLighting({ isMatka }: { isMatka: boolean }) {
  return (
    <>
      <ambientLight intensity={isMatka ? 0.78 : 0.65} />
      <spotLight position={[-4, 8, 5]} intensity={isMatka ? 62 : 72} angle={0.45} penumbra={1} color="#fff4e5" />
      <pointLight position={[5, 2, -4]} intensity={26} color={isMatka ? '#e29e6c' : '#d78352'} />
      <pointLight position={[0, -3, 2]} intensity={14} color="#ffd7b0" />
    </>
  );
}

function CameraRig({ preset, trigger, controlsRef }: { preset: CameraPreset; trigger: number; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...CAMERA_POSITIONS[preset]));
  const animating = useRef(false);

  useEffect(() => {
    if (trigger === 0) return;
    targetPos.current.set(...CAMERA_POSITIONS[preset]);
    animating.current = true;
  }, [preset, trigger]);

  useFrame((_, delta) => {
    if (!animating.current) return;
    camera.position.lerp(targetPos.current, Math.min(1, delta * 5.2));
    controlsRef.current?.update();
    if (camera.position.distanceTo(targetPos.current) < 0.04) animating.current = false;
  });

  return null;
}

export interface RoundRoomProps {
  visible?: boolean;
  initialSeries?: SeriesId;
  initialProductId?: string;
  onProduct?: (product: Product) => void;
  onAddToCart?: (sku: string, product: Product, sizeName: string, finishLabel: string) => void;
  onToast?: (message: string) => void;
}

export function RoundRoom({ initialSeries = 'forge', initialProductId, onProduct, onAddToCart, onToast, visible = true }: RoundRoomProps) {
  const [activeSeries, setActiveSeries] = useState<SeriesId>(initialSeries);
  const seriesProducts = useMemo(
    () => allProducts
      .filter((p) => p.seriesId === activeSeries && p.model)
      .sort((a, b) => LINE_ORDER.indexOf(lineFor(a)) - LINE_ORDER.indexOf(lineFor(b))),
    [activeSeries],
  );
  const [activeId, setActiveId] = useState<string>(initialProductId ?? seriesProducts[0]?.id ?? allProducts[0].id);
  const activeIndex = Math.max(0, seriesProducts.findIndex((p) => p.id === activeId));
  const active = seriesProducts[activeIndex] ?? seriesProducts[0];

  const [sizeIndex, setSizeIndex] = useState(() => Math.min(1, active.sizes.length - 1));
  const [finish, setFinish] = useState<Finish>(() => finishFor(active));
  const [showLid, setShowLid] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const hotspotPortal = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<CameraPreset>('hero');
  const [presetTrigger, setPresetTrigger] = useState(0);
  const [fading, setFading] = useState(false);
  const [spinning, setSpinning] = useState(true);
  const [explode, setExplode] = useState(0);
  const [thermal, setThermal] = useState(false);
  const [cutaway, setCutaway] = useState(false);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const tween = useRef<ReturnType<typeof gsap.to> | null>(null);

  const reduced = useReducedMotion();

  const profile = MATERIAL_PROFILES[materialSetFor(finish)];
  const brief = BRIEFS[activeSeries];
  const layer = activeLayer !== null ? profile.layers[activeLayer] : undefined;

  const applySelection = (next: Product) => {
    setActiveId(next.id);
    setSizeIndex(Math.min(1, next.sizes.length - 1));
    setFinish(finishFor(next));
    setShowLid(false);
    setActiveLayer(null);
  };

  const withFade = (action: () => void) => {
    if (reduced) { action(); return; }
    setFading(true);
    setTimeout(() => { action(); setFading(false); }, 190);
  };

  const switchSeries = (id: SeriesId) => {
    if (id === activeSeries) return;
    const nextList = allProducts.filter((p) => p.seriesId === id && p.model);
    if (!nextList.length) return;
    withFade(() => { setActiveSeries(id); applySelection(nextList[0]); });
  };

  const switchTo = (id: string) => {
    if (id === activeId || fading) return;
    const next = seriesProducts.find((p) => p.id === id) ?? seriesProducts[0];
    withFade(() => applySelection(next));
  };

  const step = (direction: 1 | -1) =>
    switchTo(seriesProducts[(activeIndex + direction + seriesProducts.length) % seriesProducts.length].id);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const target = event.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || !target.closest('.rr'))) return;
      step(event.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => () => { tween.current?.kill(); }, []);

  const handlePreset = (next: CameraPreset) => {
    setPreset(next);
    setPresetTrigger((n) => n + 1);
    if (next !== 'hero') setSpinning(false);
  };

  const animateExplode = (to: number) => {
    tween.current?.kill();
    if (reduced) { setExplode(to); return; }
    const proxy = { value: explode };
    tween.current = gsap.to(proxy, { value: to, duration: 0.9, ease: 'power2.inOut', onUpdate: () => setExplode(proxy.value) });
  };

  const selectLayer = (index: number) => {
    setActiveLayer(index);
    setSpinning(false);
    if (explode < 0.2) animateExplode(0.55);
  };

  const toggleCutaway = () => {
    const next = !cutaway;
    setCutaway(next);
    if (next) handlePreset('hero');
  };

  const resetView = () => {
    setActiveLayer(null);
    setCutaway(false);
    setThermal(false);
    setShowLid(false);
    setShowDimensions(false);
    animateExplode(0);
    handlePreset('hero');
    setSpinning(!reduced);
  };

  const activeSize = active.sizes[Math.min(sizeIndex, active.sizes.length - 1)] ?? active.sizes[0];
  const diameterCm = parseDiameterCm(activeSize.name);

  const isMatka = active.seriesId === 'matka';
  const canSeatLid = ['skillet', 'saucier', 'saucepan', 'cocotte', 'rondeau', 'wok', 'stockpot', 'sauteuse', 'handi', 'matka'].includes(active.model ?? '');
  const explodePct = Math.round(explode * 100);
  const explodeLabel = explodePct === 0 ? 'Assembled' : explodePct === 100 ? 'Fully exploded' : `${explodePct}% exploded`;

  const handlePrimaryAction = () => onProduct?.(active);

  return (
    <section id="gallery" className="rr" aria-label="The round room: interactive 3D cookware showroom">
      <div className="rr-room">
        <div className="rr-canvas">
          <div ref={hotspotPortal} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          <Canvas
            frameloop="always"
            dpr={[1, 1.8]}
            camera={{ position: [0, 3.4, 7.4], fov: 32 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
          >
            <StageLighting isMatka={isMatka} />
            <CameraRig preset={preset} trigger={presetTrigger} controlsRef={controlsRef} />
            <Suspense fallback={null}>
              <LayeredVessel
                key={`${active.id}-${finish}`}
                hotspotPortal={hotspotPortal}
                kind={active.model!}
                finish={finish}
                diameterCm={diameterCm}
                showLid={showLid}
                layers={profile.layers}
                explode={explode}
                thermal={thermal}
                cutaway={cutaway}
                spread={profile.spread}
                activeLayer={activeLayer}
                onSelectLayer={selectLayer}
                showDimensions={showDimensions}
                baseCm={activeSize.baseDiameterCm}
                inductionZoneCm={activeSize.inductionZoneCm}
                reduced={reduced}
              />
              <Environment resolution={256}>
                <Lightformer form="rect" intensity={4} position={[-4, 5, 2]} rotation={[0, Math.PI / 3, 0]} scale={[7, 2, 1]} />
                <Lightformer form="rect" intensity={2.5} position={[5, 2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 3, 1]} color="#ffe0c2" />
                <Lightformer form="circle" intensity={2} position={[0, 6, -3]} rotation={[Math.PI / 2, 0, 0]} scale={4} />
              </Environment>
              <ContactShadows position={[0, -0.06, 0]} opacity={0.44} scale={13} blur={2.3} far={5} color="#000000" />
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enablePan={false}
              enableDamping
              dampingFactor={0.08}
              target={ORBIT_TARGET}
              minDistance={3.6}
              maxDistance={12}
              minPolarAngle={0.18}
              maxPolarAngle={preset === 'underside' ? 2.45 : 1.6}
              autoRotate={spinning && !reduced && !fading && explode < 0.1 && !cutaway && activeLayer === null}
              autoRotateSpeed={0.85}
            />
          </Canvas>
          <div className={`rr-fade ${fading ? 'on' : ''}`} aria-hidden="true" />
        </div>

        <header className="rr-head">
          <div className="rr-title">
            <span className="rr-kicker">The round room · {series.find((s) => s.id === activeSeries)?.name}</span>
            <h2>Every piece, <em>in the round.</em></h2>
          </div>
          <div className="rr-toolbar" role="toolbar" aria-label="Inspection tools">
            <button className={thermal ? 'on' : ''} aria-pressed={thermal} onClick={() => setThermal(!thermal)}><Flame size={13} />{thermal ? 'Heat map on' : 'Heat map'}</button>
            <button className={cutaway ? 'on' : ''} aria-pressed={cutaway} onClick={toggleCutaway}><Scissors size={13} />{cutaway ? 'Section on' : 'Cutaway'}</button>
            {canSeatLid && <button className={showLid ? 'on' : ''} aria-pressed={showLid} onClick={() => setShowLid(!showLid)}><Layers size={13} />{showLid ? 'Lid seated' : 'Seat lid'}</button>}
            <button className={showDimensions ? 'on' : ''} aria-pressed={showDimensions} onClick={() => setShowDimensions(!showDimensions)}><Ruler size={13} />Dimensions</button>
            <button onClick={() => setBriefOpen(true)}><BookOpen size={13} />Brief</button>
            <button className="rr-icon" onClick={resetView} aria-label="Reset the view"><RotateCcw size={14} /></button>
          </div>
        </header>

        <aside className="rr-left">
          <div className="rr-panel rr-selector">
            <div className="rr-series" role="tablist" aria-label="Series">
              {series.map((s) => (
                <button key={s.id} role="tab" aria-selected={activeSeries === s.id} className={activeSeries === s.id ? 'active' : ''} onClick={() => switchSeries(s.id)}>
                  {s.name.replace('The ', '').replace(' Series', '').replace('Matka', 'Chulha')}
                </button>
              ))}
            </div>
            <div className="rr-list" role="group" aria-label="Vessels">
              {seriesProducts.map((product, index) => {
                const line = lineFor(product);
                const firstOfLine = index === 0 || lineFor(seriesProducts[index - 1]) !== line;
                return (
                  <Fragment key={product.id}>
                    {firstOfLine && <span className="rr-list-line">{line}</span>}
                    <button aria-pressed={product.id === active.id} className={product.id === active.id ? 'active' : ''} onClick={() => switchTo(product.id)}>
                      <span>{product.name.replace(/^The\s+/, '').replace(/^(Copper|Cast-Iron)\s+/, '')}</span>
                      <small>{product.shape ?? product.category}</small>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="rr-panel rr-physics">
            <div className="rr-panel-head"><span>Material physics</span><em>{profile.name}</em></div>
            {profile.physics.map((bar) => (
              <div key={bar.label} className="rr-bar">
                <div><span>{bar.label}</span><strong className={`tone-${bar.tone}`}>{bar.value}</strong></div>
                <i><b className={`tone-bg-${bar.tone}`} style={{ width: `${bar.pct}%` }} /></i>
              </div>
            ))}
            <div className="rr-formula">
              <span>{profile.formulaTitle}</span>
              {profile.formula.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}
            </div>
          </div>
        </aside>

        <aside className="rr-right">
          <motion.div key={active.id} className="rr-panel rr-buy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <span className="rr-eyebrow">{active.frenchName}</span>
            <h3>{active.name}</h3>
            <p className="rr-handles">{active.handleConfig}</p>
            <p className="rr-oneliner">{active.oneLiner}</p>
            <div className="rr-group">
              <span>Diameter · inner rim</span>
              <div className="rr-sizes">
                {active.sizes.map((s, index) => (
                  <button key={s.sku} className={sizeIndex === index ? 'active' : ''} onClick={() => setSizeIndex(index)} aria-pressed={sizeIndex === index}>
                    <strong>{s.name}</strong>
                  </button>
                ))}
              </div>
              <p className="rr-note">{activeSize.detail}{activeSize.capacityL ? ` · ${activeSize.capacityL} L` : ''}{activeSize.weightKg ? ` · ${activeSize.weightKg} kg` : ''}</p>
            </div>
            <div className="rr-group">
              <span>Material study</span>
              <div className="rr-finishes">
                {availableFinishesFor(active).map((key) => (
                  <button key={key} className={finish === key ? 'active' : ''} onClick={() => { setFinish(key); setActiveLayer(null); }} aria-pressed={finish === key} aria-label={`Preview in ${FINISHES[key].label}`}>
                    <i style={{ background: FINISHES[key].color }} />{FINISHES[key].label.split(' ').slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>
            {active.fitsLids.length > 0 && <p className="rr-lids">Shared lid fit · {active.fitsLids.join(' · ')}</p>}
            <p className="rr-note">Interactive design study. Dimensions and material behaviour are illustrative; check the product record before ordering.</p>
            <Button variant="copper" full onClick={handlePrimaryAction}>View this piece in the shop</Button>

          </motion.div>

          <AnimatePresence>
            {layer && activeLayer !== null && (
              <motion.div
                key={layer.id}
                className="rr-panel rr-detail"
                initial={{ x: 36, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 36, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rr-detail-top">
                  <span>{layer.tag}</span>
                  <button onClick={() => setActiveLayer(null)} aria-label="Close layer details"><X size={16} /></button>
                </div>
                <h3>{layer.title}</h3>
                <p className="rr-detail-sub">{layer.subtitle}</p>
                <p className="rr-detail-desc">{layer.desc}</p>
                <dl>{layer.stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>
                <div className="rr-detail-nav" aria-label="Other layers">
                  {profile.layers.map((item, index) => (
                    <button key={item.id} className={index === activeLayer ? 'active' : ''} onClick={() => selectLayer(index)} aria-label={item.title}>{ROMAN[index]}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        <div className="rr-explode">
          <div className="rr-explode-head">
            <span><Layers size={12} /> Exploded architecture · {profile.layers.length} layers</span>
            <strong>{explodeLabel}</strong>
          </div>
          <div className="rr-explode-row">
            <button onClick={() => animateExplode(0)}>Assembled</button>
            <input
              type="range" min={0} max={1} step={0.005} value={explode}
              onChange={(event) => { tween.current?.kill(); setExplode(Number(event.target.value)); }}
              aria-label="Separate the vessel into its layers"
            />
            <button onClick={() => animateExplode(1)}>Exploded</button>
          </div>
        </div>

        <div className="rr-cams">
          <button className="rr-arrow" onClick={() => step(-1)} aria-label="Previous piece"><ArrowLeft size={15} /></button>
          <button className="rr-arrow" onClick={() => step(1)} aria-label="Next piece"><ArrowRight size={15} /></button>
          <div className="rr-cam-group" role="group" aria-label="Camera angle">
            {(['hero', 'overhead', 'profile', 'underside'] as CameraPreset[]).map((angle) => (
              <button key={angle} className={preset === angle ? 'active' : ''} onClick={() => handlePreset(angle)}>
                {angle === 'hero' ? '3/4' : angle === 'underside' ? 'Base' : angle}
              </button>
            ))}
          </div>
          <button className="rr-spin" onClick={() => setSpinning(!spinning)} aria-pressed={spinning} aria-label={spinning ? 'Pause rotation' : 'Resume rotation'}>
            {spinning ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>

        {thermal && (
          <div className="rr-heat">
            <div className="rr-heat-scale"><span>Cool</span><i /><span>Hot</span></div>
            <p>{profile.thermalNote}</p>
          </div>
        )}
        <div className="rr-readout">{FINISHES[finish].label} · Ø {diameterCm} cm{activeSize.baseDiameterCm ? ` · base Ø ${activeSize.baseDiameterCm} cm` : ''} · {activeSize.sku}</div>
        <div className="rr-hint"><Move3d size={12} /> Drag to turn · scroll to zoom · tap a numeral to inspect a layer</div>
      </div>

      <Dialog.Root open={briefOpen} onOpenChange={setBriefOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="maison-round-room-overlay" />
          <Dialog.Content className="rr-brief">
            <Dialog.Close className="rr-brief-close" aria-label="Close the brief"><X size={18} /></Dialog.Close>
            <span className="rr-kicker">{brief.kicker}</span>
            <Dialog.Title>{brief.title}</Dialog.Title>
            <Dialog.Description>{brief.lead}</Dialog.Description>
            {brief.paragraphs.map((paragraph) => <p key={paragraph.heading}><strong>{paragraph.heading}</strong> {paragraph.body}</p>)}
            <ul>{brief.points.map((point) => <li key={point}>{point}</li>)}</ul>
            <Button variant="copper" onClick={() => setBriefOpen(false)}>Back to the model</Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}

export const Gallery3D = RoundRoom;
