import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownRight } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SectionLabel } from './ui';

const scenes = [
  {
    number: 'I',
    kicker: 'The hand',
    title: 'Struck, not stamped.',
    copy: 'Every hammer mark changes the surface by a fraction of a millimetre. What remains is not uniformity, but character—the quiet signature of the person who made it.',
    note: 'FORMED IN SMALL BATCHES',
    image: 'https://images.pexels.com/photos/38569164/pexels-photo-38569164.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1900',
    position: 'center 45%',
  },
  {
    number: 'II',
    kicker: 'The material',
    title: 'Heat, held in balance.',
    copy: 'Copper for response. Stainless steel for purity. Cast iron for endurance. We choose each material for what it does, then refine its form until nothing extraneous remains.',
    note: 'PURPOSE BEFORE ORNAMENT',
    image: 'https://images.pexels.com/photos/15401356/pexels-photo-15401356.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1900',
    position: 'center 50%',
  },
  {
    number: 'III',
    kicker: 'The ritual',
    title: 'Made for the daily ceremony.',
    copy: 'A pan becomes yours at the first sear, the hundredth sauce, the meal cooked without thinking. Our measure of luxury is how naturally an object becomes part of your life.',
    note: 'DESIGNED FOR A LIFETIME OF USE',
    image: 'https://images.pexels.com/photos/3933188/pexels-photo-3933188.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1900',
    position: 'center 42%',
  },
];

export function MaterialStory() {
  const section = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!section.current) return;
      const rect = section.current.getBoundingClientRect();
      const distance = section.current.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, -rect.top / Math.max(distance, 1))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section id="materials" className="bg-ink px-5 py-24 text-ivory">
        <div className="mx-auto max-w-7xl space-y-16">
          <SectionLabel light>The Tavo standard</SectionLabel>
          {scenes.map((scene) => (
            <article key={scene.number} className="grid gap-6 md:grid-cols-2 md:items-center">
              <img src={scene.image} alt="" className="aspect-[4/3] w-full object-cover" />
              <div><span className="text-copper-light">{scene.number} — {scene.kicker}</span><h2 className="mt-4 font-serif text-5xl">{scene.title}</h2><p className="mt-5 leading-7 text-ivory/65">{scene.copy}</p></div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const active = Math.min(2, Math.floor(progress * 3));
  const scene = scenes[active];

  return (
    <section ref={section} id="materials" className="material-story">
      <div className="material-sticky">
        <div className="material-scenes" aria-hidden="true">
          {scenes.map((item, index) => {
            const reveal = index === 0 ? 1 : Math.max(0, Math.min(1, progress * 3 - index));
            return (
              <div
                key={item.number}
                className="material-scene"
                style={{ clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`, zIndex: index + 1 }}
              >
                <img
                  src={item.image}
                  alt=""
                  style={{ objectPosition: item.position, transform: `scale(${1.12 - reveal * 0.08}) translateY(${(1 - reveal) * 4}%)` }}
                />
              </div>
            );
          })}
        </div>
        <div className="material-vignette" />
        <div className="material-content page-shell">
          <div className="material-topline">
            <SectionLabel light>The Tavo standard</SectionLabel>
            <span>OBJECT / MATERIAL / RITUAL</span>
          </div>

          <div className="material-copy-wrap">
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.number}
                initial={{ opacity: 0, y: 45 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="material-copy"
              >
                <span className="material-kicker">{scene.kicker}</span>
                <h2>{scene.title}</h2>
                <p>{scene.copy}</p>
                <span className="material-note"><ArrowDownRight size={15} />{scene.note}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="material-index">
            <AnimatePresence mode="wait">
              <motion.span key={scene.number} initial={{ y: 35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -35, opacity: 0 }}>
                {scene.number}
              </motion.span>
            </AnimatePresence>
            <span>/ III</span>
          </div>

          <div className="material-bottom">
            <div className="material-steps">
              {scenes.map((item, index) => <span key={item.number} className={index === active ? 'active' : ''}>{item.number} {item.kicker}</span>)}
            </div>
            <div className="material-progress"><span style={{ width: `${progress * 100}%` }} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
