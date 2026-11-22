export const maintenanceCategory = {
  handle: 'maintenance',
  title: 'Maintenance',
  summary: 'Care kits, lids and replacement parts for the pieces you cook with.',
  description: 'Find a care kit by cooking-surface material. For a lid or replacement part, match the model and size printed on your cookware.',
} as const;

export const maintenanceGroups = [
  {
    handle: 'care-kits',
    title: 'Care kits',
    summary: 'Match the care kit to the cooking surface.',
    existingSkus: ['MT-FOR-KIT-C01', 'MT-FOR-OIL-250', 'MT-FOR-KIT-SS1'],
  },
  {
    handle: 'lids',
    title: 'Replacement lids',
    summary: 'Check the vessel model and inner rim diameter against the lid compatibility list.',
    existingSkus: [16, 20, 24, 26, 28, 30, 32].map(size => `MT-FOR-LID-${size}`),
  },
  {
    handle: 'handles',
    title: 'Replacement handles',
    summary: 'Match the vessel model and handle attachment before requesting a replacement.',
    existingSkus: [],
  },
] as const;
