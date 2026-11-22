import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const override = document.documentElement.dataset.reducedMotion;
      setReduced(override === 'true' || (override !== 'false' && media.matches));
    };
    update();
    media.addEventListener('change', update);
    document.addEventListener('maison:reduced-motion', update);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('maison:reduced-motion', update);
    };
  }, []);

  return reduced;
}
