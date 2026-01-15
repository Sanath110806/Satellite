import { useState, type KeyboardEvent } from 'react';
import { MapPin, Navigation, X, Loader2, Search } from 'lucide-react';
import type { UserLocation } from '../../utils/visibility';
import './LocationPanel.css';

interface LocationPanelProps {
    location: UserLocation | null;
    loading: boolean;
    error: string | null;
    onDetectGPS: () => void;
    onSearchLocation: (query: string) => void;
    onClear: () => void;
}

export function LocationPanel({
    location,
    loading,
    error,
    onDetectGPS,
    onSearchLocation,
    onClear,
}: LocationPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            onSearchLocation(searchQuery.trim());
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="location-panel">
            <div className="location-header">
                <MapPin className="location-icon" />
                <span className="location-title">OBSERVER LOCATION</span>
            </div>

            {location ? (
                <div className="location-active">
                    <div className="location-name">{location.name || 'Unknown'}</div>
                    <div className="location-coords">
                        <span>{location.lat.toFixed(4)}° N</span>
                        <span>{location.lng.toFixed(4)}° E</span>
                    </div>
                    <button className="location-clear-btn" onClick={onClear}>
                        <X size={14} />
                        Clear
                    </button>
                </div>
            ) : (
                <>
                    <div className="location-input-group">
                        <input
                            type="text"
                            placeholder="Enter city name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="location-input"
                            disabled={loading}
                        />
                        <button
                            className="location-search-btn"
                            onClick={handleSearch}
                            disabled={loading || !searchQuery.trim()}
                            title="Search location"
                        >
                            {loading ? <Loader2 className="spinner" size={18} /> : <Search size={18} />}
                        </button>
                    </div>
                    <button
                        className="location-gps-btn-full"
                        onClick={onDetectGPS}
                        disabled={loading}
                    >
                        <Navigation size={16} />
                        <span>Detect my location</span>
                    </button>
                </>
            )}

            {error && <div className="location-error">{error}</div>}
        </div>
    );
}
