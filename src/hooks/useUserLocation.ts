import { useState, useCallback, useEffect } from 'react';
import type { UserLocation } from '../utils/visibility';

interface UseUserLocationReturn {
    location: UserLocation | null;
    loading: boolean;
    error: string | null;
    detectGPS: () => void;
    setLocationByName: (name: string) => Promise<void>;
    clearLocation: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Try to load saved location on mount
    useEffect(() => {
        const saved = localStorage.getItem('userLocation');
        if (saved) {
            try {
                setLocation(JSON.parse(saved));
            } catch {
                // Ignore invalid saved location
            }
        }
    }, []);

    // Save location when it changes
    useEffect(() => {
        if (location) {
            localStorage.setItem('userLocation', JSON.stringify(location));
        }
    }, [location]);

    // Fallback to IP-based geolocation
    const detectByIP = useCallback(async () => {
        try {
            // Use ip-api.com for IP-based geolocation (free, no API key needed)
            const response = await fetch('https://ip-api.com/json/?fields=status,city,lat,lon');
            const data = await response.json();

            if (data.status === 'success') {
                setLocation({
                    lat: data.lat,
                    lng: data.lon,
                    alt: 0,
                    name: data.city || 'Your Location',
                });
                setError(null);
                return true;
            }
        } catch {
            // IP geolocation also failed
        }
        return false;
    }, []);

    const detectGPS = useCallback(async () => {
        if (!navigator.geolocation) {
            setLoading(true);
            // Try IP-based fallback
            const success = await detectByIP();
            setLoading(false);
            if (!success) {
                setError('Geolocation not supported. Try entering your city name.');
            }
            return;
        }

        setLoading(true);
        setError(null);

        // First try GPS with high accuracy
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    alt: position.coords.altitude || 0,
                    name: 'Current Location',
                });
                setLoading(false);
            },
            async (gpsError) => {
                console.log('GPS failed, trying IP-based location:', gpsError.message);

                // GPS failed, try IP-based fallback
                const success = await detectByIP();

                if (!success) {
                    // Both failed, show helpful error
                    let errorMsg = 'Could not detect location. ';
                    switch (gpsError.code) {
                        case 1: // PERMISSION_DENIED
                            errorMsg += 'Location permission denied.';
                            break;
                        case 2: // POSITION_UNAVAILABLE
                            errorMsg += 'Location unavailable.';
                            break;
                        case 3: // TIMEOUT
                            errorMsg += 'Request timed out.';
                            break;
                        default:
                            errorMsg += gpsError.message;
                    }
                    errorMsg += ' Try entering your city name instead.';
                    setError(errorMsg);
                }

                setLoading(false);
            },
            {
                enableHighAccuracy: false, // Less accurate but faster and more reliable
                timeout: 15000,
                maximumAge: 300000, // 5 minutes cache
            }
        );
    }, [detectByIP]);

    const setLocationByName = useCallback(async (name: string) => {
        setLoading(true);
        setError(null);

        try {
            // Use OpenStreetMap Nominatim for geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'SatelliteTracker/1.0',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding request failed');
            }

            const results = await response.json();

            if (results.length === 0) {
                throw new Error(`Location "${name}" not found`);
            }

            const result = results[0];
            setLocation({
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                alt: 0,
                name: result.display_name.split(',')[0],
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to find location');
        } finally {
            setLoading(false);
        }
    }, []);

    const clearLocation = useCallback(() => {
        setLocation(null);
        localStorage.removeItem('userLocation');
        setError(null);
    }, []);

    return {
        location,
        loading,
        error,
        detectGPS,
        setLocationByName,
        clearLocation,
    };
}
