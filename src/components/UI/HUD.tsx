import { Satellite, Radio, Eye, EyeOff, Globe2, Clock } from 'lucide-react';
import type { SatellitePosition } from '../../types';
import type { UserLocation } from '../../utils/visibility';
import { LocationPanel } from './LocationPanel';
import { TelemetryPanel } from './TelemetryPanel';
import './HUD.css';

interface HUDProps {
    // Satellite state
    selectedSatellite: SatellitePosition | null;
    onClearSelection: () => void;
    satelliteCount: number;
    visibleCount: number;
    loading: boolean;

    // Location state
    userLocation: UserLocation | null;
    locationLoading: boolean;
    locationError: string | null;
    onDetectGPS: () => void;
    onSearchLocation: (query: string) => void;
    onClearLocation: () => void;

    // Filter state
    showOnlyVisible: boolean;
    onToggleShowOnlyVisible: () => void;

    // Time
    currentTime: Date;
}

export function HUD({
    selectedSatellite,
    onClearSelection,
    satelliteCount,
    visibleCount,
    loading,
    userLocation,
    locationLoading,
    locationError,
    onDetectGPS,
    onSearchLocation,
    onClearLocation,
    showOnlyVisible,
    onToggleShowOnlyVisible,
    currentTime,
}: HUDProps) {
    return (
        <div className="hud">
            {/* Top Bar - Command Header */}
            <header className="hud-header">
                <div className="hud-logo">
                    <Satellite className="hud-icon pulse" />
                    <div className="hud-title-group">
                        <span className="hud-title">ORBITAL COMMAND</span>
                        <span className="hud-subtitle">SPACE SITUATIONAL AWARENESS</span>
                    </div>
                </div>

                <div className="hud-time">
                    <Clock className="time-icon" />
                    <span className="time-value">
                        {currentTime.toUTCString().replace('GMT', 'UTC')}
                    </span>
                </div>

                <div className="hud-stats">
                    <div className="stat">
                        <Radio className="stat-icon" />
                        <span className="stat-value">{loading ? '...' : satelliteCount.toLocaleString()}</span>
                        <span className="stat-label">TRACKING</span>
                    </div>
                    {userLocation && (
                        <div className="stat visible-stat">
                            <Eye className="stat-icon" />
                            <span className="stat-value">{visibleCount}</span>
                            <span className="stat-label">VISIBLE</span>
                        </div>
                    )}
                    <div className="stat status-stat">
                        <Globe2 className="stat-icon" />
                        <span className="stat-value live-indicator">● LIVE</span>
                        <span className="stat-label">STATUS</span>
                    </div>
                </div>
            </header>

            {/* Left Panel - Location & Controls */}
            <div className="hud-left-panel">
                <LocationPanel
                    location={userLocation}
                    loading={locationLoading}
                    error={locationError}
                    onDetectGPS={onDetectGPS}
                    onSearchLocation={onSearchLocation}
                    onClear={onClearLocation}
                />

                {/* Visibility Toggle */}
                {userLocation && (
                    <button
                        className={`visibility-toggle ${showOnlyVisible ? 'active' : ''}`}
                        onClick={onToggleShowOnlyVisible}
                    >
                        {showOnlyVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                        <span>{showOnlyVisible ? 'Showing visible only' : 'Show satellites above me'}</span>
                    </button>
                )}
            </div>

            {/* Selected Satellite Panel */}
            {selectedSatellite && (
                <TelemetryPanel
                    satellite={selectedSatellite}
                    userLocation={userLocation}
                    onClose={onClearSelection}
                />
            )}

            {/* Corner Decorations */}
            <div className="corner-decoration top-left"></div>
            <div className="corner-decoration top-right"></div>
            <div className="corner-decoration bottom-left"></div>
            <div className="corner-decoration bottom-right"></div>

            {/* Grid Overlay */}
            <div className="grid-overlay"></div>

            {/* Scan Line Effect */}
            <div className="scanline"></div>
        </div>
    );
}
