import { useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Earth, Atmosphere, Stars, UserMarker } from './components/Globe';
import { SatelliteLayer, OrbitPath } from './components/Satellites';
import { HUD, FilterPanel, createDefaultFilters } from './components/UI';
import type { FilterState } from './components/UI';
import { useSatelliteData, useUserLocation } from './hooks';
import { calculateVisibility } from './utils/visibility';
import { propagateSatellite, extractMetadata } from './utils/satellite';
import type { SatellitePosition } from './types';
import './App.css';

function Scene({
  tleData,
  selectedSatellite,
  onSelectSatellite,
  userLocation,
  filters,
}: {
  tleData: { name: string; line1: string; line2: string }[];
  selectedSatellite: SatellitePosition | null;
  onSelectSatellite: (sat: SatellitePosition | null) => void;
  userLocation: { lat: number; lng: number; alt: number } | null;
  filters: FilterState;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />

      {/* Simple orbit controls - works reliably */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={8}
        enableDamping={true}
        dampingFactor={0.05}
        autoRotate={false}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />

      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffee" />

      <Stars count={10000} />
      <Earth autoRotate={false} />
      <Atmosphere color="#00ffff" />

      {userLocation && <UserMarker lat={userLocation.lat} lng={userLocation.lng} />}

      <SatelliteLayer
        tleData={tleData}
        selectedId={selectedSatellite?.id ?? null}
        onSelect={onSelectSatellite}
        userLocation={userLocation}
        filters={filters}
      />

      {selectedSatellite && (
        <OrbitPath tle={selectedSatellite.tle} color="#ff00ff" segments={200} />
      )}
    </>
  );
}

// Count matching satellites
function countFiltered(tleData: { name: string; line1: string; line2: string }[], filters: FilterState): number {
  let count = 0;
  for (const tle of tleData) {
    const meta = extractMetadata(tle);
    if (filters.searchQuery) {
      const query = filters.searchQuery.toUpperCase();
      const noradId = tle.line1.substring(2, 7);
      if (!tle.name.toUpperCase().includes(query) && !noradId.includes(query)) continue;
    }
    if (filters.operators.size > 0 && !filters.operators.has(meta.operator)) continue;
    if (filters.missionTypes.size > 0 && !filters.missionTypes.has(meta.missionType)) continue;
    if (filters.orbitClasses.size > 0 && !filters.orbitClasses.has(meta.orbitClass)) continue;
    if (filters.countries.size > 0 && !filters.countries.has(meta.country)) continue;
    count++;
  }
  return count;
}

export default function App() {
  const { tleData, loading, error, dataTimestamp } = useSatelliteData('active');
  const {
    location: userLocation,
    loading: locationLoading,
    error: locationError,
    detectGPS,
    setLocationByName,
    clearLocation,
  } = useUserLocation();

  const [selectedSatellite, setSelectedSatellite] = useState<SatellitePosition | null>(null);
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredCount = useMemo(() => countFiltered(tleData, filters), [tleData, filters]);

  const visibleCount = useMemo(() => {
    if (!userLocation || tleData.length === 0) return 0;
    const now = new Date();
    let count = 0;
    for (const tle of tleData) {
      const pos = propagateSatellite(tle, now);
      if (pos) {
        const visibility = calculateVisibility(
          userLocation.lat, userLocation.lng, userLocation.alt,
          pos.lat, pos.lng, pos.alt
        );
        if (visibility.isVisible) count++;
      }
    }
    return count;
  }, [userLocation, tleData]);

  const handleSearchLocation = useCallback((query: string) => {
    setLocationByName(query);
  }, [setLocationByName]);

  const handleBackgroundClick = useCallback(() => {
    if (selectedSatellite) setSelectedSatellite(null);
  }, [selectedSatellite]);

  return (
    <div className="app">
      {loading && tleData.length === 0 && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">LOADING ORBITAL CATALOG...</div>
          </div>
        </div>
      )}

      {error && tleData.length === 0 && (
        <div className="error-overlay">
          <div className="error-text">DATA FETCH FAILED</div>
          <div className="error-subtext">{error}</div>
        </div>
      )}

      <Canvas
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000000' }}
        onPointerMissed={handleBackgroundClick}
      >
        <Scene
          tleData={tleData}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={setSelectedSatellite}
          userLocation={userLocation}
          filters={filters}
        />
      </Canvas>

      <FilterPanel
        satellites={tleData}
        filters={filters}
        onFiltersChange={setFilters}
        visibleCount={visibleCount}
        totalCount={tleData.length}
        renderedCount={filteredCount}
        dataTimestamp={dataTimestamp}
      />

      <div className="debug-overlay">
        <div>TLE: {tleData.length}</div>
        <div>Filtered: {filteredCount}</div>
        <div>Visible: {visibleCount}</div>
      </div>

      <HUD
        selectedSatellite={selectedSatellite}
        onClearSelection={() => setSelectedSatellite(null)}
        satelliteCount={tleData.length}
        visibleCount={visibleCount}
        loading={loading}
        userLocation={userLocation}
        locationLoading={locationLoading}
        locationError={locationError}
        onDetectGPS={detectGPS}
        onSearchLocation={handleSearchLocation}
        onClearLocation={clearLocation}
        showOnlyVisible={filters.showOnlyVisible}
        onToggleShowOnlyVisible={() => setFilters(f => ({ ...f, showOnlyVisible: !f.showOnlyVisible }))}
        currentTime={currentTime}
      />
    </div>
  );
}
