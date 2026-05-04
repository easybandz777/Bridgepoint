/**
 * Shared SEO helpers — JSON-LD generators for schemas that recur across pages.
 * Call from server components and inject via <script type="application/ld+json">.
 */

const BASE_URL = 'https://bridgepointepainting.com';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}

export interface ServiceSchemaInput {
  name: string;
  description: string;
  serviceType: string;
  areaName?: string;
  priceRange?: string;
  image?: string;
}

export function serviceSchema(input: ServiceSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Bridgepointe',
      url: BASE_URL,
      telephone: '+18624218973',
    },
    areaServed: {
      '@type': 'State',
      name: input.areaName ?? 'Metro Atlanta, Georgia',
    },
    ...(input.priceRange && { offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', priceRange: input.priceRange } }),
    ...(input.image && { image: input.image.startsWith('http') ? input.image : `${BASE_URL}${input.image}` }),
  };
}

export function jsonLd(schema: object) {
  return { __html: JSON.stringify(schema) };
}
