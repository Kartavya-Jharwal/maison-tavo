/**
 * Fixture bank keyed by materialCategory + intent (Amendment II).
 * Catalog fields still win when present via buildFixtureAnswer.
 */

/** @type {Record<string, { activity: string, tag: string }>} */
export const INTENT_ACTIVITY = {
  care_season: { activity: 'Opening care protocol…', tag: 'CARE' },
  heat_check: { activity: 'Reading heat sources…', tag: 'HEAT' },
  acid: { activity: 'Checking acid tolerance…', tag: 'ACID' },
  wash: { activity: 'Checking hygiene rules…', tag: 'CARE' },
  material: { activity: 'Reading material record…', tag: 'SPEC' },
  triage: { activity: 'Opening surface triage…', tag: 'TRIAGE' },
  ritual: { activity: 'Finding the rites…', tag: 'RITES' },
  commerce: { activity: 'Opening the product…', tag: 'PRODUCT' },
  ar_place: { activity: 'Preparing Sight…', tag: 'SIGHT' },
  cv_triage: { activity: 'Preparing Look…', tag: 'LOOK' },
  default: { activity: 'Listening…', tag: 'KANSA' },
};

/** Guided CV confirm chips → remedy keys */
export const CV_CONFIRM_CHIPS = {
  metal: [
    { label: 'More orange than brown', key: 'rust' },
    { label: 'Sticky / gummy', key: 'gummy' },
    { label: 'Dry grey / stripped', key: 'dull' },
    { label: 'Carbon crust stuck', key: 'stuck' },
  ],
  clay: [
    { label: 'Fine crazing lines', key: 'crazing' },
    { label: 'Odour in the clay', key: 'odour' },
    { label: 'Scorched base', key: 'scorch' },
    { label: 'Base sweating', key: 'sweat' },
  ],
  blade: [
    { label: 'Edge lost bite', key: 'dull' },
    { label: 'Spot discolouration', key: 'stain' },
    { label: 'Edge rust', key: 'rust' },
  ],
};
