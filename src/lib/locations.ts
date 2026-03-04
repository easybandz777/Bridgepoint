export const SERVICE_LOCATIONS = [
    { id: 'cobb', name: 'Cobb' },
    { id: 'roswell', name: 'Roswell' },
    { id: 'alpharetta', name: 'Alpharetta' },
    { id: 'sandy-springs', name: 'Sandy Springs' },
    { id: 'kennesaw', name: 'Kennesaw' },
    { id: 'buckhead', name: 'Buckhead' },
    { id: 'milton', name: 'Milton' },
    { id: 'suwanee', name: 'Suwanee' },
    { id: 'marietta', name: 'Marietta' },
] as const;

export type LocationId = (typeof SERVICE_LOCATIONS)[number]['id'];

export function getLocationName(id: string): string | undefined {
    return SERVICE_LOCATIONS.find((loc) => loc.id === id)?.name;
}
