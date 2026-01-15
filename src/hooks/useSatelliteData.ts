import { useState, useEffect, useCallback, useRef } from 'react';
import type { TLEData } from '../types';
import { fetchTLEData, TLE_SOURCES } from '../utils/satellite';

interface UseSatelliteDataReturn {
    tleData: TLEData[];
    loading: boolean;
    error: string | null;
    dataTimestamp: number | null;
    refetch: () => Promise<void>;
}

export function useSatelliteData(source: keyof typeof TLE_SOURCES = 'active'): UseSatelliteDataReturn {
    const [tleData, setTleData] = useState<TLEData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataTimestamp, setDataTimestamp] = useState<number | null>(null);
    const fetchedRef = useRef(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('[Satellites] Loading data...');
            const data = await fetchTLEData(TLE_SOURCES[source]);

            if (data.length === 0) {
                throw new Error('No satellite data received');
            }

            setTleData(data);
            setDataTimestamp(Date.now());
            console.log(`[Satellites] Loaded ${data.length} satellites`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch satellite data';
            console.error('[Satellites] Error:', message);
            setError(message);
            // Don't clear existing data on error - keep showing what we have
        } finally {
            setLoading(false);
        }
    }, [source]);

    useEffect(() => {
        // Prevent double-fetch in React strict mode
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        loadData();

        // Refresh every 30 minutes
        const interval = setInterval(loadData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadData]);

    return {
        tleData,
        loading,
        error,
        dataTimestamp,
        refetch: loadData,
    };
}
