/** Site-wide business details. Everything marked TODO needs real values before launch. */
export const site = {
  name: 'B Keim Rewind Marketing',
  shortName: 'B Keim Rewind',
  email: 'Brandon@bkrewind.com',
  emailHref: 'mailto:Brandon@bkrewind.com',
  /** TODO: business phone, e.g. '985-555-0100'. Leave empty to hide it everywhere. */
  phone: '',
  phoneHref: '',
  location: 'Covington, Louisiana',
  serviceArea: 'New Orleans, Baton Rouge and the Northshore',
} as const;

export const nav = [
  { href: '/about-us', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
] as const;

export const cta = { href: '/contact-us', label: 'Contact us' } as const;

/** TODO: real profile URLs. Entries with an empty href are not rendered. */
export const socials: { label: string; href: string; icon: 'instagram' | 'facebook' | 'linkedin' }[] = [
  { label: 'Instagram', href: '', icon: 'instagram' },
  { label: 'Facebook', href: '', icon: 'facebook' },
  { label: 'LinkedIn', href: '', icon: 'linkedin' },
];
