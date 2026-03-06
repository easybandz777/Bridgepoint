import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Agentation } from 'agentation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

const BASE_URL = 'https://bridgepointepainting.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Bridgepointe | #1 Luxury Painting Contractor in Atlanta, GA',
    template: '%s | Bridgepointe Painting — Atlanta, GA',
  },
  description: 'Atlanta\'s premier high-end painting and remodeling contractor. Interior painting, exterior painting, cabinet refinishing & full renovations across Buckhead, Alpharetta, Roswell, Marietta & all Metro Atlanta. 18+ years. 240+ projects. 100% satisfaction.',
  keywords: [
    'painting contractor Atlanta GA',
    'house painters Atlanta Georgia',
    'interior painting Atlanta',
    'exterior painting Atlanta',
    'luxury painting contractor Atlanta',
    'high end painters Atlanta',
    'professional painting Atlanta',
    'premium painting services Atlanta',
    'residential painting contractor Metro Atlanta',
    'cabinet painting Atlanta',
    'painting company Buckhead',
    'painting company Alpharetta',
    'painting company Roswell GA',
    'painting company Marietta GA',
    'painting company Sandy Springs',
    'painting company Kennesaw',
    'painting company Milton GA',
    'Benjamin Moore painting contractor Atlanta',
    'luxury home painting Atlanta',
    'interior exterior painting Atlanta Georgia',
    'best painters Atlanta',
    'top rated painting contractor Atlanta',
    'Atlanta painting company',
    'home painters near me Atlanta',
    'remodeling contractor Atlanta GA',
  ],
  authors: [{ name: 'Bridgepointe', url: BASE_URL }],
  creator: 'Bridgepointe',
  publisher: 'Bridgepointe',
  category: 'Home Services',
  applicationName: 'Bridgepointe',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Bridgepointe',
    title: 'Bridgepointe | Atlanta\'s Luxury Painting & Remodeling Contractor',
    description: 'Atlanta\'s premier high-end painting and remodeling contractor. 18+ years of meticulous craftsmanship across Buckhead, Alpharetta, Roswell, Marietta & all Metro Atlanta.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Bridgepointe — Luxury Painting Contractor Atlanta GA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bridgepointe | Atlanta\'s Luxury Painting Contractor',
    description: 'Premium interior, exterior & cabinet painting across Metro Atlanta. 18+ years of meticulous craftsmanship.',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: BASE_URL },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'geo.region': 'US-GA',
    'geo.placename': 'Atlanta, Georgia',
    'geo.position': '33.7490;-84.3880',
    'ICBM': '33.7490, -84.3880',
  },
};

// ─── JSON-LD Schema: LocalBusiness + AggregateRating ─────────────────────────
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
  name: 'Bridgepointe',
  alternateName: 'Bridgepointe Painting & Remodeling',
  description: 'Atlanta\'s premier luxury painting and remodeling contractor. Specializing in interior painting, exterior painting, cabinet refinishing, and complete home renovations across Metro Atlanta.',
  url: BASE_URL,
  telephone: '+18624218973',
  email: 'Bridgepointefloors@gmail.com',
  image: `${BASE_URL}/og-image.jpg`,
  logo: `${BASE_URL}/logo.png`,
  priceRange: '$$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Cash, Credit Card, Check',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Atlanta',
    addressRegion: 'GA',
    postalCode: '30301',
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 33.7490, longitude: -84.3880 },
  areaServed: [
    { '@type': 'City', name: 'Atlanta', addressRegion: 'GA' },
    { '@type': 'City', name: 'Buckhead', addressRegion: 'GA' },
    { '@type': 'City', name: 'Alpharetta', addressRegion: 'GA' },
    { '@type': 'City', name: 'Roswell', addressRegion: 'GA' },
    { '@type': 'City', name: 'Marietta', addressRegion: 'GA' },
    { '@type': 'City', name: 'Sandy Springs', addressRegion: 'GA' },
    { '@type': 'City', name: 'Milton', addressRegion: 'GA' },
    { '@type': 'City', name: 'Kennesaw', addressRegion: 'GA' },
    { '@type': 'City', name: 'Suwanee', addressRegion: 'GA' },
    { '@type': 'City', name: 'Cobb County', addressRegion: 'GA' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Painting & Remodeling Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Interior Painting', description: 'High-end interior painting for luxury homes — walls, ceilings, trim, doors, and cabinetry.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Exterior Painting', description: 'Premium exterior painting with superior surface preparation for lasting results.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Cabinet Painting & Refinishing', description: 'Professional spray finish cabinet painting and refinishing in Atlanta kitchens and bathrooms.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Luxury Home Painting', description: 'White-glove painting service for luxury and high-value residences across Metro Atlanta.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bathroom Renovation', description: 'Full bathroom remodeling including tile, waterproofing, vanity, and fixtures.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Flooring Installation', description: 'Hardwood, tile, LVP, and carpet installation across Metro Atlanta.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Complete Home Remodeling', description: 'Whole-home renovation management with licensed subcontractors and permit handling.' } },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    reviewCount: '47',
    bestRating: '5',
    worstRating: '1',
  },
  review: [
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Sarah M.' },
      reviewRating: { '@type': 'Rating', ratingValue: '5' },
      reviewBody: 'Bridgepointe transformed our home in Buckhead. Absolutely flawless work, meticulous attention to detail, and the whole team was professional top to bottom.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'James R.' },
      reviewRating: { '@type': 'Rating', ratingValue: '5' },
      reviewBody: 'Best painting contractor in Atlanta by far. They prepped every surface perfectly and the finish is stunning. Worth every penny.',
    },
  ],
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' },
  ],
  sameAs: [
    'https://instagram.com/Bridgepointecraft',
    'https://facebook.com/Bridgepointecraft',
  ],
  foundingDate: '2007',
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 12 },
  slogan: 'Where Craft Meets Home',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#b8956a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Agentation />
      </body>
    </html>
  );
}
