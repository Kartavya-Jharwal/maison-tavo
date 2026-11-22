import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Accordion from '@radix-ui/react-accordion';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Gift, Hammer, Mail, ShieldCheck, Truck, X } from 'lucide-react';
import { journalEntries } from '../data/products';
import { SectionLabel, Wordmark } from './ui';

type JournalEntry = typeof journalEntries[number];

export function Atelier() {
  return (
    <section id="atelier" className="atelier-section">
      <div className="page-shell atelier-grid">
        <div className="atelier-visual" data-reveal>
          <div className="atelier-main-image"><img src="https://images.pexels.com/photos/15401356/pexels-photo-15401356.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1300&w=1050" alt="Artisan shaping metal by hand in a traditional workshop" loading="lazy" /></div>
          <motion.div className="atelier-product-inset" initial={{ y: 60 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}><img src="/images/copper-rondeau.png" alt="Copper Tavo rondeau" loading="lazy" /><span>FORM No. 05<br />THE RONDEAU</span></motion.div>
          <span className="atelier-image-caption">THE HUMAN HAND / THE FINAL MEASURE</span>
        </div>
        <div className="atelier-copy">
          <SectionLabel>Inside the atelier</SectionLabel>
          <h2 data-reveal>Crafted slowly.<br /><em>Used daily.</em></h2>
          <p className="atelier-lead">We do not believe luxury should be precious. It should be present—on the flame, in your hand, at the centre of the table.</p>
          <div className="atelier-process" data-reveal-group>
            <article><span>I</span><div><h3>Material with a reason</h3><p>Thick copper where response matters. Bonded steel where versatility counts. Dense iron where time does the cooking.</p></div></article>
            <article><span>II</span><div><h3>Finished by eye and hand</h3><p>Rims are smoothed, handles balanced, surfaces inspected. Small variations are the evidence of human workmanship.</p></div></article>
            <article><span>III</span><div><h3>Made to remain</h3><p>Replaceable knobs, written care guidance and structural support keep each piece in your kitchen, out of landfill.</p></div></article>
          </div>
          <a href="#journal" className="text-link">Read our material notes <ArrowUpRight size={14} /></a>
        </div>
      </div>
      <div className="atelier-quote page-shell" data-reveal>
        <span>“</span><blockquote>The most beautiful object in a kitchen<br />is the one you reach for <em>without thinking.</em></blockquote><small>THE MAISON TAVO PHILOSOPHY</small>
      </div>
    </section>
  );
}

export function Services() {
  const services = [
    { icon: Truck, title: 'Insured delivery', copy: 'Tracked and plastic-free. Complimentary over $250, with express options at reservation.' },
    { icon: ShieldCheck, title: 'A lifetime of support', copy: 'Structural warranty, practical care guidance and replacement knobs when life happens.' },
    { icon: Hammer, title: 'Hand engraving', copy: 'Up to twelve characters, finished by hand. A quiet mark for milestones and gifts.' },
    { icon: Gift, title: 'Gifting, personally', copy: 'Protective presentation packaging and a handwritten atelier card with your own words.' },
  ];
  return <section className="services-section"><div className="page-shell services-grid" data-reveal-group>{services.map(({ icon: Icon, title, copy }) => <article key={title}><div><Icon size={22} strokeWidth={1.2} /></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>;
}

export function Journal() {
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  return (
    <section id="journal" className="journal-section">
      <div className="page-shell">
        <div className="section-heading-row" data-reveal><div><SectionLabel>Notes from the atelier</SectionLabel><h2>The Tavo <em>Journal</em></h2></div><p>Material intelligence, useful technique,<br />and a slower way to choose.</p></div>
        <div className="journal-grid" data-reveal-group>
          {journalEntries.map((entry, index) => (
            <motion.article key={entry.id} className={index === 0 ? 'journal-featured' : ''} whileHover={{ y: -5 }}>
              <button className="journal-image" onClick={() => setSelected(entry)} aria-label={`Read ${entry.title}`}><img src={entry.image} alt="" loading="lazy" /><span><ArrowUpRight /></span></button>
              <div className="journal-meta"><span>{entry.number} · {entry.category}</span><span>{entry.readTime}</span></div>
              <button className="journal-title" onClick={() => setSelected(entry)}><h3>{entry.title}</h3></button>
              <p>{entry.excerpt}</p>
              <button className="journal-read" onClick={() => setSelected(entry)}>Read the story <ArrowRight size={14} /></button>
            </motion.article>
          ))}
        </div>
      </div>

      <Dialog.Root open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <AnimatePresence>
          {selected && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild><motion.div className="dialog-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /></Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.article className="article-dialog" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 35 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                  <Dialog.Close className="dialog-close" aria-label="Close article"><X /></Dialog.Close>
                  <div className="article-hero"><img src={selected.image} alt="" /><div><span>{selected.category} · {selected.readTime}</span><Dialog.Title>{selected.title}</Dialog.Title></div></div>
                  <div className="article-body"><Dialog.Description>{selected.intro}</Dialog.Description>{selected.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="article-signoff"><Wordmark /><span>Objects of heat, made to last.</span></div></div>
                </motion.article>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </section>
  );
}

const faqs = [
  { q: 'Can I use copper on an induction cooktop?', a: 'Solid copper is not magnetic, so our copper pieces require a high-quality induction interface disk. For native induction compatibility, choose our five-ply stainless steel or cast iron pieces. The pan finder filters for this automatically.' },
  { q: 'Should I polish away copper patina?', a: 'Only if you want to. Patina is a natural surface reaction, not a flaw, and it does not affect the stainless cooking interior. Polish for brilliance or leave the surface to record its life in your kitchen.' },
  { q: 'What does the lifetime structural warranty cover?', a: 'It covers defects in the vessel body, bonded layers, handle attachment and workmanship under normal domestic use. It does not cover cosmetic patina, accidental damage, misuse or ordinary wear to cooking surfaces.' },
  { q: 'How does hand engraving affect delivery and returns?', a: 'Engraving adds two to three working days before dispatch. Because an engraved piece is made personal to you, it cannot be returned unless faulty. We always show the engraving text in your bag for review.' },
  { q: 'What is the 30-day return window?', a: 'Unused, non-engraved pieces in their original presentation packaging can be returned within 30 days of delivery. In this storefront preview no physical order is transmitted, so no return request is necessary.' },
  { q: 'Is stainless steel dishwasher safe?', a: 'Yes, although hand washing and prompt drying best preserve a mirror finish. Copper and enamelled cast iron should always be hand washed. Every product dialog includes material-specific care instructions.' },
];

export function CareAndFaq() {
  return (
    <section id="care" className="faq-section">
      <div className="page-shell faq-grid">
        <div className="faq-intro"><SectionLabel>Ownership, explained</SectionLabel><h2>A lifetime<br /><em>of good use.</em></h2><p>The relationship begins after the unboxing. Practical answers for choosing, cooking and caring.</p><a href="mailto:concierge@maisontavo.com" className="button button-outline"><span className="button-label">Ask the concierge</span><span className="button-icon"><Mail size={15} /></span></a></div>
        <Accordion.Root type="single" collapsible className="faq-list">
          {faqs.map((faq, index) => <Accordion.Item key={faq.q} value={`item-${index}`}><Accordion.Header><Accordion.Trigger><span>0{index + 1}</span><strong>{faq.q}</strong><ChevronDown size={17} /></Accordion.Trigger></Accordion.Header><Accordion.Content><p>{faq.a}</p></Accordion.Content></Accordion.Item>)}
        </Accordion.Root>
      </div>
    </section>
  );
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const subscribe = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    const existing = JSON.parse(localStorage.getItem('maison-tavo-letters') || '[]') as string[];
    localStorage.setItem('maison-tavo-letters', JSON.stringify(Array.from(new Set([...existing, email]))));
    setSubmitted(true);
    setError('');
  };
  return (
    <footer className="site-footer">
      <div className="page-shell newsletter">
        <div><SectionLabel light>Private letters</SectionLabel><h2>From the atelier,<br /><em>occasionally.</em></h2></div>
        <div className="newsletter-form-wrap"><p>New editions, material notes and useful technique.<br />Never more than twice a month.</p><AnimatePresence mode="wait">{submitted ? <motion.div key="done" className="newsletter-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Check /><div><strong>You’re on the list.</strong><span>Preview signup saved on this device; no email has been sent.</span></div></motion.div> : <motion.div key="form" exit={{ opacity: 0, y: -10 }}><div className="newsletter-form"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && subscribe()} placeholder="Your email address" aria-label="Email address" /><button onClick={subscribe} aria-label="Join newsletter"><ArrowRight /></button></div>{error && <span className="newsletter-error">{error}</span>}<small>Preview only: your address is stored locally, never transmitted.</small></motion.div>}</AnimatePresence></div>
      </div>
      <div className="page-shell footer-links">
        <div className="footer-brand"><Wordmark light /><p>Vessels for the daily ritual.</p><span>18 RUE DE LA BRAISE, 75003 PARIS<br />BY APPOINTMENT · MON–FRI, 10:00–18:00 CET</span></div>
        <div><strong>Index</strong><a href="#collection">The collection</a><a href="#materials">Our materials</a><a href="#atelier">The atelier</a><a href="#journal">Journal</a></div>
        <div><strong>Client care</strong><a href="#care">Care & FAQ</a><a href="#finder">Pan consultation</a><a href="mailto:concierge@maisontavo.com">Email concierge</a><a href="#care">Shipping & returns</a></div>
      </div>
      <div className="page-shell footer-bottom"><span>© 2026 MAISON TAVO</span><span>STOREFRONT CONCEPT · RESERVATIONS STAY ON YOUR DEVICE</span><a href="#top">Back to top ↑</a></div>
      <div className="footer-wordmark" aria-hidden="true">TAVO</div>
    </footer>
  );
}
