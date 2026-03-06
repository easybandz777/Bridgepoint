export const SITE_CONFIG = {
  name: 'Bridgepointe',
  tagline: 'Where Craft Meets Home',
  description:
    'Premium painting services and exclusive high-end remodeling by a true craftsman. Bridgepointe delivers meticulous attention to detail on every project.',
  url: 'https://bridgepointepainting.com',
  phone: '(862) 421-8973',
  email: 'Bridgepointefloors@gmail.com',
  address: {
    street: 'Atlanta Metro Area',
    city: 'Atlanta',
    state: 'GA',
    zip: '',
  },
  social: {
    instagram: 'https://instagram.com/Bridgepointecraft',
    facebook: 'https://facebook.com/Bridgepointecraft',
  },
  stats: {
    yearsExperience: 18,
    projectsCompleted: 240,
    averageProjectValue: '$145K',
    satisfactionRate: '100%',
  },
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/painting', label: 'Painting' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/select-services', label: 'Select Services' },
  { href: '/about', label: 'About' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/contact', label: 'Contact' },
  { href: '/admin', label: 'Admin' },
] as const;
