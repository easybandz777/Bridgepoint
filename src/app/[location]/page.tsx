import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SERVICE_LOCATIONS, getLocationName } from '@/lib/locations';
import { SITE_CONFIG } from '@/lib/constants';
import { LocationHero } from '@/components/home/location-hero';
import { ServicesPreview } from '@/components/home/services-preview';
import { CredibilityStrip } from '@/components/home/credibility-strip';
import { LocationCTA } from '@/components/home/location-cta';

interface LocationPageProps {
    params: {
        location: string;
    };
}

export function generateStaticParams() {
    return SERVICE_LOCATIONS.map((loc) => ({
        location: loc.id,
    }));
}

export function generateMetadata({ params }: LocationPageProps): Metadata {
    const locationName = getLocationName(params.location);

    if (!locationName) {
        return { title: 'Not Found' };
    }

    return {
        title: `Premium Painting & Remodeling in ${locationName} | ${SITE_CONFIG.name}`,
        description: `Discover elite painting and exclusive remodeling services in ${locationName}. Bridgepoint delivers meticulous craftsmanship and unmatched luxury for your home.`,
        openGraph: {
            title: `Premium Painting in ${locationName} | ${SITE_CONFIG.name}`,
            description: `Elevate your ${locationName} home with our premium painting and select remodeling services.`,
            url: `${SITE_CONFIG.url}/${params.location}`,
            siteName: SITE_CONFIG.name,
            locale: 'en_US',
            type: 'website',
        },
    };
}

export default function LocationPage({ params }: LocationPageProps) {
    const locationName = getLocationName(params.location);

    if (!locationName) {
        notFound();
    }

    // Schema.org structured data for LocalBusiness SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: SITE_CONFIG.name,
        image: `${SITE_CONFIG.url}/favicon.ico`,
        '@id': `${SITE_CONFIG.url}/#localbusiness`,
        url: `${SITE_CONFIG.url}/${params.location}`,
        telephone: SITE_CONFIG.phone,
        email: SITE_CONFIG.email,
        address: {
            '@type': 'PostalAddress',
            streetAddress: SITE_CONFIG.address.street,
            addressLocality: locationName,
            addressRegion: SITE_CONFIG.address.state,
            addressCountry: 'US',
        },
        geo: {
            '@type': 'GeoCircle',
            geoMidpoint: {
                '@type': 'GeoCoordinates',
                description: `Center of ${locationName}, GA`,
            },
            geoRadius: '20000',
        },
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ],
                opens: '07:00',
                closes: '18:00'
            }
        ],
        areaServed: {
            '@type': 'City',
            name: locationName,
        },
        priceRange: '$$$$'
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LocationHero locationName={locationName} />
            <ServicesPreview />
            <CredibilityStrip />
            <LocationCTA locationName={locationName} />
        </>
    );
}
