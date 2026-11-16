/**
 * Service pillars. Pillar and service names are carried over from the June landing page draft.
 * TODO: confirm names and write the descriptions.
 */
export const pillars = [
  {
    id: 'brand',
    number: '01',
    title: 'Brand',
    summary: 'TODO: one or two sentences on brand work.',
    services: ['Logo and identity', 'Visual systems', 'Messaging and positioning', 'Print and collateral'],
  },
  {
    id: 'content',
    number: '02',
    title: 'Content',
    summary: 'TODO: one or two sentences on content production.',
    services: ['Video production', 'Photography', 'Social media management', 'Short-form and reels'],
  },
  {
    id: 'growth',
    number: '03',
    title: 'Growth',
    summary: 'TODO: one or two sentences on growth and search.',
    services: ['SEO and local search', 'Google and Meta ads', 'Lead generation', 'Web design'],
  },
] as const;
