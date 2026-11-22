import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { products, type Product } from '../data/catalog';
import { Button, SectionLabel } from './ui';

const questions = [
  { key: 'method', eyebrow: 'YOUR RITUAL', title: 'What do you love to cook?', options: [{ value: 'sear', label: 'A perfect sear', note: 'Steaks, fish, golden edges' }, { value: 'sauce', label: 'Sauces & slow stirring', note: 'Emulsions, grains, custards' }, { value: 'slow', label: 'Low & slow', note: 'Braises, broths, fresh bread' }, { value: 'fast', label: 'Fast & over flame', note: 'Stir-fries, vegetables, noodles' }] },
  { key: 'cooktop', eyebrow: 'YOUR FLAME', title: 'What does your kitchen cook on?', options: [{ value: 'gas', label: 'Gas', note: 'Responsive, open flame' }, { value: 'induction', label: 'Induction', note: 'Magnetic, precise heat' }, { value: 'electric', label: 'Electric', note: 'Radiant or ceramic' }] },
  { key: 'people', eyebrow: 'YOUR TABLE', title: 'Who usually gathers?', options: [{ value: 'small', label: 'One or two', note: 'An intimate daily ritual' }, { value: 'medium', label: 'Three or four', note: 'The everyday table' }, { value: 'large', label: 'Five or more', note: 'A generous gathering' }] },
] as const;

type Answers = { method?: string; cooktop?: string; people?: string };

function recommend(answers: Answers) {
  let id = 'forge-frying-pan';
  if (answers.method === 'sauce') id = answers.people === 'small' ? 'forge-saucepan' : 'forge-saucier';
  else if (answers.method === 'slow') id = answers.people === 'large' ? 'forge-stockpot' : 'forge-kadhai';
  else if (answers.method === 'fast') id = 'forge-kadhai';
  return products.find((product) => product.id === id) ?? products[0];
}

export function Finder({ onProduct }: { onProduct: (product: Product) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const result = step === 3 ? recommend(answers) : null;
  const sizeIndex = answers.people === 'small' ? 0 : answers.people === 'large' ? (result?.sizes.length ?? 1) - 1 : Math.min(1, (result?.sizes.length ?? 1) - 1);

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setTimeout(() => setStep((current) => Math.min(3, current + 1)), 180);
  };
  const reset = () => { setAnswers({}); setStep(0); };

  return (
    <section id="finder" className="finder-section">
      <div className="finder-bg-word" aria-hidden="true">YOURS</div>
      <div className="page-shell finder-layout">
        <div className="finder-intro">
          <SectionLabel light>The private consultation</SectionLabel>
          <h2>One pan.<br /><em>Chosen well.</em></h2>
          <p>Tell us how you cook. You leave with one honest recommendation, not a set nobody asked for.</p>
          <div className="finder-progress">{[0, 1, 2].map((index) => <span key={index} className={step >= index ? 'active' : ''} />)}<small>{step < 3 ? ['FIRST QUESTION', 'SECOND QUESTION', 'THIRD QUESTION'][step] : 'YOUR MATCH'}</small></div>
        </div>
        <div className="finder-card">
          <AnimatePresence mode="wait">
            {step < 3 ? (
              <motion.div key={step} className="finder-question" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -25 }} transition={{ duration: 0.35 }}>
                <span>{questions[step].eyebrow}</span><h3>{questions[step].title}</h3>
                <div className="finder-options">{questions[step].options.map((option) => <button key={option.value} className={answers[questions[step].key] === option.value ? 'selected' : ''} onClick={() => choose(questions[step].key, option.value)}><span><strong>{option.label}</strong><small>{option.note}</small></span><ArrowRight size={17} /></button>)}</div>
                {step > 0 && <button className="finder-back" onClick={() => setStep(step - 1)}><ArrowLeft size={14} /> Previous question</button>}
              </motion.div>
            ) : result && (
              <motion.div key="result" className="finder-result" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}>
                <div className="finder-result-image"><img src={result.image} alt={result.name} /><span>YOUR TAVO MATCH</span></div>
                <div className="finder-result-copy"><span>{result.frenchName}</span><h3>{result.name}</h3><p>{result.short} We suggest the <strong>{result.sizes[sizeIndex].name}</strong> for your table.</p><ul><li>{answers.cooktop === 'induction' ? 'Natively induction compatible' : 'Matched to your cooking ritual'}</li><li>{result.bestFor.slice(0, 2).join(' and ')}</li></ul><Button variant="copper" full onClick={() => onProduct(result)}>Meet your match</Button><button className="finder-reset" onClick={reset}><RotateCcw size={13} /> Start again</button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
