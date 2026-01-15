import * as satellite from 'satellite.js';
import type { TLEData, SatellitePosition } from '../types';

const EARTH_RADIUS_KM = 6371;

// Cache for TLE data with timestamps
const TLE_CACHE_KEY = 'satellite_tle_cache';
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CachedTLEData {
    data: TLEData[];
    timestamp: number;
    source: string;
}

// Fallback dataset - essential satellites that always work
const FALLBACK_SATELLITES: TLEData[] = [
    {
        name: 'ISS (ZARYA)',
        line1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9025',
        line2: '2 25544  51.6400 208.9163 0006703  32.0000 328.1000 15.50000000000017'
    },
    {
        name: 'STARLINK-1007',
        line1: '1 44713U 19074A   24001.50000000  .00000000  00000-0  10000-4 0  9991',
        line2: '2 44713  53.0000 200.0000 0001000  90.0000 270.0000 15.05000000000010'
    },
];

export function propagateSatellite(tle: TLEData, date: Date): SatellitePosition | null {
    try {
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        // Validate satrec
        if (!satrec || satrec.error !== 0) {
            return null;
        }

        const positionAndVelocity = satellite.propagate(satrec, date);

        if (!positionAndVelocity || typeof positionAndVelocity.position === 'boolean' || !positionAndVelocity.position) {
            return null;
        }

        const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
        const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;

        if (!velocityEci) {
            return null;
        }

        const gmst = satellite.gstime(date);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const lat = satellite.degreesLat(positionGd.latitude);
        const lng = satellite.degreesLong(positionGd.longitude);
        const alt = positionGd.height;

        // Validate altitude (sanity check)
        if (alt < 100 || alt > 50000 || isNaN(alt)) {
            return null;
        }

        const velocity = Math.sqrt(
            velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
        );

        return {
            id: tle.name.replace(/\s+/g, '-').toLowerCase(),
            name: tle.name,
            lat,
            lng,
            alt,
            velocity,
            tle,
        };
    } catch {
        return null;
    }
}

export function latLngToVector3(lat: number, lng: number, altitude: number, globeRadius: number = 1): [number, number, number] {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const radius = globeRadius + (altitude / EARTH_RADIUS_KM) * globeRadius * 0.1;

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return [x, y, z];
}

export function parseTLEData(rawTle: string): TLEData[] {
    const lines = rawTle.trim().split('\n');
    const satellites: TLEData[] = [];

    for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 < lines.length) {
            const name = lines[i].trim();
            const line1 = lines[i + 1].trim();
            const line2 = lines[i + 2].trim();

            // Validate TLE format
            if (line1.startsWith('1 ') && line2.startsWith('2 ') && name.length > 0) {
                satellites.push({ name, line1, line2 });
            }
        }
    }

    return satellites;
}

// Save TLE data to localStorage cache
function cacheTLEData(data: TLEData[], source: string): void {
    try {
        const cached: CachedTLEData = {
            data,
            timestamp: Date.now(),
            source,
        };
        localStorage.setItem(TLE_CACHE_KEY, JSON.stringify(cached));
    } catch {
        // Storage might be full, ignore
    }
}

// Load TLE data from cache
function loadCachedTLE(): CachedTLEData | null {
    try {
        const cached = localStorage.getItem(TLE_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch {
        // Invalid cache, ignore
    }
    return null;
}

// Check if cache is still valid
function isCacheValid(cached: CachedTLEData): boolean {
    return Date.now() - cached.timestamp < CACHE_DURATION_MS;
}

export async function fetchTLEData(url: string): Promise<TLEData[]> {
    // Check cache first
    const cached = loadCachedTLE();
    if (cached && isCacheValid(cached) && cached.source === url) {
        console.log(`[TLE] Using cached data (${cached.data.length} satellites)`);
        return cached.data;
    }

    try {
        console.log(`[TLE] Fetching from ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'text/plain',
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        const data = parseTLEData(text);

        // Sanity check - expect at least some satellites
        if (data.length < 10) {
            throw new Error('Insufficient satellite data');
        }

        console.log(`[TLE] Loaded ${data.length} satellites`);

        // Cache the fresh data
        cacheTLEData(data, url);

        return data;
    } catch (error) {
        console.warn('[TLE] Fetch failed, trying cache...', error);

        // Try cache even if expired
        if (cached && cached.data.length > 0) {
            console.log(`[TLE] Using stale cache (${cached.data.length} satellites)`);
            return cached.data;
        }

        // Last resort: fallback dataset
        console.warn('[TLE] Using fallback dataset');
        return FALLBACK_SATELLITES;
    }
}

// Fetch from multiple sources for reliability
export async function fetchAllSatellites(): Promise<TLEData[]> {
    const sources = [
        TLE_SOURCES.active,
        TLE_SOURCES.stations,
        TLE_SOURCES.starlink,
    ];

    const allSatellites: TLEData[] = [];
    const seen = new Set<string>();

    for (const source of sources) {
        try {
            const data = await fetchTLEData(source);
            for (const sat of data) {
                const key = sat.line1.substring(2, 7); // NORAD ID
                if (!seen.has(key)) {
                    seen.add(key);
                    allSatellites.push(sat);
                }
            }
        } catch {
            // Continue with other sources
        }
    }

    return allSatellites.length > 0 ? allSatellites : FALLBACK_SATELLITES;
}

// Popular TLE sources
export const TLE_SOURCES = {
    stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    active: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    weather: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
    gps: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
    irnss: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=irnss&FORMAT=tle',
    science: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle',
};

// Satellite metadata extraction
export interface SatelliteMetadata {
    operator: string;
    country: string;
    missionType: string;
    orbitClass: 'LEO' | 'MEO' | 'GEO' | 'HEO';
}

export function extractMetadata(tle: TLEData): SatelliteMetadata {
    const name = tle.name.toUpperCase();

    // Detect operator
    let operator = 'Unknown';
    if (name.includes('STARLINK')) operator = 'SpaceX';
    else if (name.includes('ONEWEB')) operator = 'OneWeb';
    else if (name.includes('GPS')) operator = 'USSF';
    else if (name.includes('IRNSS') || name.includes('NAVIC')) operator = 'ISRO';
    else if (name.includes('GLONASS')) operator = 'Roscosmos';
    else if (name.includes('GALILEO')) operator = 'ESA';
    else if (name.includes('BEIDOU')) operator = 'CNSA';
    else if (name.includes('ISS')) operator = 'NASA/Roscosmos';
    else if (name.includes('TIANGONG')) operator = 'CNSA';
    else if (name.includes('GOES') || name.includes('NOAA')) operator = 'NOAA';
    else if (name.includes('COSMOS')) operator = 'Roscosmos';
    else if (name.includes('USA')) operator = 'USSF';
    else if (name.includes('INSAT') || name.includes('GSAT')) operator = 'ISRO';

    // Detect country
    let country = 'USA';
    if (operator === 'ISRO') country = 'India';
    else if (operator === 'Roscosmos') country = 'Russia';
    else if (operator === 'ESA') country = 'EU';
    else if (operator === 'CNSA') country = 'China';
    else if (name.includes('QZSS')) country = 'Japan';

    // Detect mission type
    let missionType = 'Communication';
    if (name.includes('GPS') || name.includes('GLONASS') || name.includes('GALILEO') || name.includes('BEIDOU') || name.includes('IRNSS')) {
        missionType = 'Navigation';
    } else if (name.includes('ISS') || name.includes('TIANGONG') || name.includes('STATION')) {
        missionType = 'Space Station';
    } else if (name.includes('GOES') || name.includes('NOAA') || name.includes('METEO')) {
        missionType = 'Weather';
    } else if (name.includes('LANDSAT') || name.includes('SENTINEL') || name.includes('TERRA') || name.includes('AQUA')) {
        missionType = 'Earth Observation';
    } else if (name.includes('STARLINK') || name.includes('ONEWEB')) {
        missionType = 'Communication';
    } else if (name.includes('HUBBLE') || name.includes('JWST') || name.includes('CHANDRA')) {
        missionType = 'Science';
    }

    // Detect orbit class from mean motion
    const meanMotion = parseFloat(tle.line2.substring(52, 63));
    let orbitClass: 'LEO' | 'MEO' | 'GEO' | 'HEO' = 'LEO';
    if (meanMotion < 2) orbitClass = 'GEO';
    else if (meanMotion < 8) orbitClass = 'MEO';
    else if (meanMotion > 16) orbitClass = 'HEO'; // Highly elliptical
    else orbitClass = 'LEO';

    return { operator, country, missionType, orbitClass };
}

// Get all unique operators from satellite list
export function getUniqueOperators(satellites: TLEData[]): string[] {
    const operators = new Set<string>();
    for (const sat of satellites) {
        const meta = extractMetadata(sat);
        operators.add(meta.operator);
    }
    return Array.from(operators).sort();
}

// Get all unique mission types
export function getUniqueMissionTypes(satellites: TLEData[]): string[] {
    const types = new Set<string>();
    for (const sat of satellites) {
        const meta = extractMetadata(sat);
        types.add(meta.missionType);
    }
    return Array.from(types).sort();
}

// Get all unique countries
export function getUniqueCountries(satellites: TLEData[]): string[] {
    const countries = new Set<string>();
    for (const sat of satellites) {
        const meta = extractMetadata(sat);
        countries.add(meta.country);
    }
    return Array.from(countries).sort();
}
