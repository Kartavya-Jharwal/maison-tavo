export const METAL_REMEDIES = {
  gummy: {
    label: 'Sticky / Gummy Surface',
    cause: 'Too much oil was applied during seasoning and did not reach full polymerization temperature.',
    fix: 'Place pan on burner over medium heat for 10–12 minutes until the sticky lipid fully smokes off into a smooth matte dry surface. Buff lightly with dry cotton cloth while warm.',
  },
  dull: {
    label: 'Dry / Stripped Grey Surface',
    cause: 'Cooking without fat or stripped patina from acidic wine/tomato deglazing during early cycles.',
    fix: 'Stovetop touch-up: Warm the pan, wipe a drop of oil across the surface, smoke lightly for 1 minute, and let cool before storing.',
  },
  stuck: {
    label: 'Stuck Food / Carbon Crust',
    cause: 'Pan was too cold when protein contacted the surface, or carbon residue accumulated.',
    fix: 'Deglaze by simmering 1 inch of hot water in the skillet for 3 minutes to loosen fond. Scrape with a flat wooden spatula. Discard water, dry over flame for 60s, and buff with fresh oil.',
  },
  rust: {
    label: 'Orange Surface Rust',
    cause: 'Pan was left damp or air-dried in a dish rack without stovetop heat drying.',
    fix: 'Scrub the rust spots with coarse salt and a few drops of oil. Wipe clean, rinse quickly, dry completely over heat for 60 seconds, and run 1 full seasoning coat.',
  },
};

export const CLAY_REMEDIES = {
  crazing: {
    label: 'Fine Glaze Crazing Lines',
    cause: 'Differential thermal expansion between the clay body and glazed slip during rapid heating.',
    fix: 'Hairline crazing is normal in traditional high-fire ceramics and does not affect integrity. To prevent deepening: always heat gradually using a diffuser on gas, and start cold in the oven.',
  },
  odour: {
    label: 'Trapped Food Aromas / Odour',
    cause: 'Porous unglazed exterior base absorbed food steam or soapy wash water.',
    fix: 'Fill the vessel with warm water and 2 tablespoons of baking soda. Simmer gently on low heat with a diffuser for 15 minutes. Rinse with warm water and dry thoroughly in open air.',
  },
  scorch: {
    label: 'Scorched Braise Base Residue',
    cause: 'Starch or sugars settled at the bottom during prolonged low-moisture braising.',
    fix: 'Allow vessel to cool completely to room temperature. Soak with warm water and 1 tablespoon baking soda for 30 minutes. Gently lift with a wooden spatula or soft natural sponge. Never use abrasive metal scouring pads.',
  },
  sweat: {
    label: 'Base Moisture Sweating / Seepage',
    cause: 'New clay vessel has not completed its pore hydration cure.',
    fix: 'Perform a starch cure: fill vessel with water and 1/2 cup rice flour or cooked rice water. Simmer on low heat for 30 minutes. The rice starches vitrify micro-pores in the clay body, creating a natural impermeable seal.',
  },
};

export const BLADE_REMEDIES = {
  dull: {
    label: 'Edge Losing Bite',
    cause: 'Board contact and acid residue flattened the micro-bevel.',
    fix: 'Hone at 15° per side on a 1000/6000 ceramic whetstone. Wipe dry and oil lightly with camellia oil.',
  },
  stain: {
    label: 'Spot Discolouration',
    cause: 'Acidic food left on the blade etched the Damascus relief.',
    fix: 'Wipe immediately after citrus or tomato. Polish with a soft cloth and a drop of mineral oil; avoid abrasive pads on the etched pattern.',
  },
  rust: {
    label: 'Edge Spot Rust',
    cause: 'Blade stored damp or sheathed while wet.',
    fix: 'Remove with fine abrasive and oil. Dry fully before sheathing. Never dishwasher.',
  },
};

/** @param {'metal'|'clay'|'blade'|'accessory'} cat */
export function remediesFor(cat) {
  if (cat === 'clay') return CLAY_REMEDIES;
  if (cat === 'blade') return BLADE_REMEDIES;
  return METAL_REMEDIES;
}

/**
 * Map coarse CV / colour cues + user confirm to a remedy key.
 * @param {{ avgR: number, avgG: number, avgB: number, materialCategory: string }} cues
 */
export function suggestRemedyFromCues(cues) {
  const { avgR, avgG, avgB, materialCategory } = cues;
  if (materialCategory === 'clay') {
    if (avgR > 140 && avgG < 110) return 'scorch';
    if (avgB > avgR && avgB > avgG) return 'sweat';
    return 'crazing';
  }
  if (materialCategory === 'blade') {
    if (avgR > avgG + 30 && avgR > avgB + 20) return 'rust';
    return 'dull';
  }
  // metal
  if (avgR > avgG + 40 && avgR > avgB + 30) return 'rust';
  if (avgR > 160 && avgG > 140 && avgB > 100) return 'gummy';
  if (avgR < 90 && avgG < 90 && avgB < 90) return 'stuck';
  return 'dull';
}
