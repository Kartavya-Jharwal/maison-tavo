import { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Lightformer, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { Vessel } from './three/vessels';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, MousePointer2 } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Button } from './ui';

gsap.registerPlugin(ScrollTrigger);

function PanModel({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current || reduced) return;
    group.current.rotation.y += delta * 0.055;
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -0.12 + state.pointer.y * 0.035, 0.035);
  });

  return (
    <PresentationControls
      global
      cursor
      snap
      speed={1.2}
      zoom={1}
      rotation={[0.06, -0.28, -0.12]}
      polar={[-0.2, 0.25]}
      azimuth={[-0.55, 0.55]}
    >
      <Float enabled={!reduced} speed={1.25} rotationIntensity={0.1} floatIntensity={0.35} floatingRange={[-0.08, 0.12]}>
        <group ref={group} position={[-0.35, -0.1, 0]} rotation={[0.06, -0.28, -0.12]}>
          <Vessel kind="skillet" finish="copper" />
        </group>
      </Float>
    </PresentationControls>
  );
}

function PanScene({ reduced }: { reduced: boolean }) {
  return (
    <Canvas dpr={[1, 1.7]} camera={{ position: [0, 5.8, 8.8], fov: 34 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.65} />
      <spotLight position={[-4, 8, 5]} intensity={70} angle={0.45} penumbra={1} color="#fff4e5" />
      <pointLight position={[5, 2, -4]} intensity={25} color="#d78352" />
      <Suspense fallback={null}>
        <PanModel reduced={reduced} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={4} position={[-4, 5, 2]} rotation={[0, Math.PI / 3, 0]} scale={[7, 2, 1]} />
          <Lightformer form="rect" intensity={2.5} position={[5, 2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 3, 1]} color="#ffe0c2" />
          <Lightformer form="circle" intensity={2} position={[0, 6, -3]} rotation={[Math.PI / 2, 0, 0]} scale={4} />
        </Environment>
        <ContactShadows position={[0, -0.2, 0]} opacity={0.32} scale={12} blur={2.4} far={5} color="#48281d" />
      </Suspense>
    </Canvas>
  );
}

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !root.current) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
      timeline
        .from('.hero-eyebrow', { y: 18, opacity: 0, duration: 0.8 }, 0.2)
        .from('.hero-line > span', { yPercent: 115, rotate: 3, duration: 1.35, stagger: 0.12 }, 0.25)
        .from('.hero-intro', { y: 25, opacity: 0, duration: 0.9 }, 0.8)
        .from('.hero-actions', { y: 20, opacity: 0, duration: 0.8 }, 0.95)
        .from('.hero-visual', { scale: 0.82, opacity: 0, rotate: 8, duration: 1.8 }, 0.15)
        .from('.hero-meta > *', { y: 15, opacity: 0, duration: 0.7, stagger: 0.08 }, 1.1);

      gsap.to('.hero-scene-motion', {
        scale: 1.22,
        yPercent: 15,
        rotate: -7,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 1.1 },
      });
      gsap.to('.hero-copy', {
        yPercent: -18,
        opacity: 0.08,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: '25% top', end: 'bottom top', scrub: 1 },
      });
      gsap.to('.hero-watermark', {
        xPercent: -13,
        scale: 1.16,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 1.3 },
      });
    }, root);
    return () => context.revert();
  }, [reduced]);

  return (
    <section ref={root} id="top" className="hero-section">
      <div className="hero-grain" />
      <div className="hero-watermark" aria-hidden="true">MAISON</div>
      <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
      <div className="hero-orbit hero-orbit-two" aria-hidden="true" />

      <div className="hero-layout page-shell">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="h-px w-9 bg-copper" />
            <span>Copper, steel and iron, in small batches</span>
          </div>
          <h1 className="hero-heading" aria-label="The art of heat">
            <span className="hero-line"><span>The art</span></span>
            <span className="hero-line hero-line-indent"><span>of <em>heat.</em></span></span>
          </h1>
          <p className="hero-intro">
            Pans and pots made to be kept. Copper where heat must answer quickly, steel where it must hold, iron where it must last.
          </p>
          <div className="hero-actions">
            <Button variant="dark" onClick={() => document.querySelector('#collection')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })}>
              See the collection
            </Button>
            <a className="text-link" href="#materials">The materials, in brief <span>↗</span></a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Interactive three-dimensional copper frying pan">
          <div className="hero-scene-motion">
            <PanScene reduced={reduced} />
            <div className="hero-drag-hint"><MousePointer2 size={13} /> Drag to inspect</div>
          </div>
        </div>

        <div className="hero-edition">
          <span>ATELIER SERIES</span>
          <span>ÉDITION 01 / 2026</span>
        </div>
      </div>

      <div className="hero-meta page-shell">
        <div><p>Hand-finished,<br />small batches</p></div>
        <div><p>Structural warranty,<br />for life</p></div>
        <div className="hero-scroll"><span>Keep going</span><ArrowDown size={15} /></div>
        <div className="hero-coordinate"><span>48.8566° N</span><span>PARIS · FRANCE</span></div>
      </div>
    </section>
  );
}
