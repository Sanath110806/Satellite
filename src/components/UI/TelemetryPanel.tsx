import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Orbit, Rocket, Radio, Globe2, Cpu, Navigation, Satellite } from 'lucide-react';
import type { SatellitePosition } from '../../types';
import type { UserLocation } from '../../utils/visibility';
import { calculateVisibility } from '../../utils/visibility';
import './TelemetryPanel.css';

interface TelemetryPanelProps {
    satellite: SatellitePosition;
    userLocation: UserLocation | null;
    onClose: () => void;
}

// Get mission type from name
function getMissionType(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes('ISS') || upper.includes('STATION')) return 'SPACE STATION';
    if (upper.includes('GPS') || upper.includes('GLONASS') || upper.includes('GALILEO')) return 'NAVIGATION';
    if (upper.includes('STARLINK')) return 'COMMUNICATIONS';
    if (upper.includes('HUBBLE') || upper.includes('JAMES WEBB')) return 'OBSERVATORY';
    if (upper.includes('WEATHER') || upper.includes('NOAA')) return 'WEATHER';
    return 'SATELLITE';
}

// Get mission color
function getMissionColor(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes('ISS') || upper.includes('STATION')) return '#ffaa00';
    if (upper.includes('GPS') || upper.includes('GLONASS') || upper.includes('GALILEO')) return '#00ff66';
    if (upper.includes('STARLINK')) return '#00aaff';
    return '#00ffff';
}

export function TelemetryPanel({ satellite, userLocation, onClose }: TelemetryPanelProps) {
    const visibility = userLocation ? calculateVisibility(
        userLocation.lat, userLocation.lng, userLocation.alt,
        satellite.lat, satellite.lng, satellite.alt
    ) : null;

    const noradId = satellite.tle.line1.substring(2, 7).trim();
    const inclination = parseFloat(satellite.tle.line2.substring(8, 16));
    const meanMotion = parseFloat(satellite.tle.line2.substring(52, 63));
    const period = (1440 / meanMotion).toFixed(1);

    let orbitType = 'LEO';
    if (satellite.alt > 35000) orbitType = 'GEO';
    else if (satellite.alt > 2000) orbitType = 'MEO';

    const missionType = getMissionType(satellite.name);
    const missionColor = getMissionColor(satellite.name);

    // Animation variants
    const panelVariants = {
        hidden: { x: 400, opacity: 0, scale: 0.9 },
        visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { type: 'spring' as const, damping: 25, stiffness: 200 }
        },
        exit: { x: 400, opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.05, duration: 0.3 }
        })
    };

    const dataItems = [
        { label: 'NORAD ID', value: noradId, icon: Radio },
        { label: 'ORBIT', value: orbitType, icon: Orbit },
        { label: 'ALTITUDE', value: `${satellite.alt.toFixed(0)} km`, icon: Rocket },
        { label: 'VELOCITY', value: `${satellite.velocity.toFixed(2)} km/s`, icon: Navigation },
        { label: 'INCLINATION', value: `${inclination.toFixed(2)}°`, icon: Globe2 },
        { label: 'PERIOD', value: `${period} min`, icon: Cpu },
    ];

    return (
        <AnimatePresence>
            <motion.div
                className="telemetry-panel-holographic"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Holographic frame */}
                <div className="holo-frame">
                    <div className="holo-corner tl"></div>
                    <div className="holo-corner tr"></div>
                    <div className="holo-corner bl"></div>
                    <div className="holo-corner br"></div>
                </div>

                {/* Header */}
                <motion.div
                    className="telemetry-header-holo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="header-icon-container" style={{ borderColor: missionColor }}>
                        <Satellite className="header-icon" style={{ color: missionColor }} />
                    </div>
                    <div className="header-info">
                        <span className="mission-type" style={{ color: missionColor }}>{missionType}</span>
                        <h3 className="satellite-name-holo">{satellite.name}</h3>
                    </div>
                    <motion.button
                        className="close-btn-holo"
                        onClick={onClose}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,0,255,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <X size={18} />
                    </motion.button>
                </motion.div>

                {/* 3D Satellite Preview */}
                <motion.div
                    className="satellite-preview"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                >
                    <div className="preview-label">LIVE TRACKING</div>
                    <div className="preview-orbit-ring" style={{ borderColor: missionColor }}></div>
                    <div className="preview-satellite" style={{ backgroundColor: missionColor }}>
                        <div className="preview-panel left"></div>
                        <div className="preview-panel right"></div>
                    </div>
                    <div className="preview-glow" style={{ background: `radial-gradient(circle, ${missionColor}40 0%, transparent 70%)` }}></div>
                </motion.div>

                {/* Telemetry Grid */}
                <div className="telemetry-grid-holo">
                    {dataItems.map((item, i) => (
                        <motion.div
                            key={item.label}
                            className="telemetry-card"
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.02, borderColor: '#00ffff' }}
                        >
                            <item.icon className="card-icon" size={14} />
                            <span className="card-label">{item.label}</span>
                            <span className="card-value">{item.value}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Visibility Section */}
                {visibility && (
                    <motion.div
                        className="visibility-section-holo"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="section-title">
                            <Zap size={12} />
                            <span>VISIBILITY STATUS</span>
                        </div>
                        <div className={`visibility-indicator ${visibility.isVisible ? 'visible' : 'hidden'}`}>
                            <div className="indicator-dot"></div>
                            <span>{visibility.isVisible ? 'CURRENTLY VISIBLE' : 'BELOW HORIZON'}</span>
                        </div>
                        {visibility.isVisible && (
                            <div className="visibility-data">
                                <div className="vis-item">
                                    <span className="vis-label">AZ</span>
                                    <span className="vis-value">{visibility.azimuth.toFixed(1)}°</span>
                                </div>
                                <div className="vis-item">
                                    <span className="vis-label">EL</span>
                                    <span className="vis-value">{visibility.elevation.toFixed(1)}°</span>
                                </div>
                                <div className="vis-item">
                                    <span className="vis-label">RANGE</span>
                                    <span className="vis-value">{visibility.range.toFixed(0)} km</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Scanline overlay */}
                <div className="holo-scanlines"></div>

                {/* Moving scan beam */}
                <div className="scan-beam"></div>
            </motion.div>
        </AnimatePresence>
    );
}
