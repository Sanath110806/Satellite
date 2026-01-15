import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { TLEData, SatellitePosition } from '../../types';
import { propagateSatellite, latLngToVector3, extractMetadata } from '../../utils/satellite';
import { calculateVisibility } from '../../utils/visibility';
import type { UserLocation } from '../../utils/visibility';
import { getSatelliteColor } from './SatelliteGeometry';
import type { FilterState } from '../UI/FilterPanel';

interface SatelliteLayerProps {
    tleData: TLEData[];
    selectedId: string | null;
    onSelect: (satellite: SatellitePosition | null) => void;
    userLocation: UserLocation | null;
    filters: FilterState;
}

// Check if satellite matches filter criteria
function matchesFilters(tle: TLEData, filters: FilterState): boolean {
    const meta = extractMetadata(tle);

    // Search query
    if (filters.searchQuery) {
        const query = filters.searchQuery.toUpperCase();
        const noradId = tle.line1.substring(2, 7);
        if (!tle.name.toUpperCase().includes(query) && !noradId.includes(query)) {
            return false;
        }
    }

    // Operator filter (empty = all pass)
    if (filters.operators.size > 0 && !filters.operators.has(meta.operator)) {
        return false;
    }

    // Mission type filter
    if (filters.missionTypes.size > 0 && !filters.missionTypes.has(meta.missionType)) {
        return false;
    }

    // Orbit class filter
    if (filters.orbitClasses.size > 0 && !filters.orbitClasses.has(meta.orbitClass)) {
        return false;
    }

    // Country filter
    if (filters.countries.size > 0 && !filters.countries.has(meta.country)) {
        return false;
    }

    return true;
}

export function SatelliteLayer({
    tleData,
    selectedId,
    onSelect,
    userLocation,
    filters,
}: SatelliteLayerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const [satellites, setSatellites] = useState<SatellitePosition[]>([]);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Use simple sphere geometry - guaranteed to render
    const satelliteGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);

    // Simple emissive material
    const satelliteMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: '#00ffff',
        });
    }, []);

    // Initialize instance matrices
    useEffect(() => {
        if (meshRef.current && tleData.length > 0) {
            // Initialize all instances to origin with zero scale
            const matrix = new THREE.Matrix4();
            matrix.makeScale(0, 0, 0);
            for (let i = 0; i < tleData.length; i++) {
                meshRef.current.setMatrixAt(i, matrix);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
            console.log('[SatelliteLayer] Initialized', tleData.length, 'instances');
        }
    }, [tleData.length]);

    // Main render loop
    useFrame(() => {
        if (!meshRef.current || tleData.length === 0) return;

        const now = new Date();
        const newSatellites: SatellitePosition[] = [];

        let rendered = 0;

        for (let i = 0; i < tleData.length; i++) {
            const tle = tleData[i];
            const pos = propagateSatellite(tle, now);

            if (pos) {
                newSatellites.push(pos);
                const [x, y, z] = latLngToVector3(pos.lat, pos.lng, pos.alt);

                // Check filter match
                const matchesFilter = matchesFilters(tle, filters);

                // Check visibility from location
                let isVisibleFromLocation = true;
                if (userLocation && filters.showOnlyVisible) {
                    const visibility = calculateVisibility(
                        userLocation.lat, userLocation.lng, userLocation.alt,
                        pos.lat, pos.lng, pos.alt
                    );
                    isVisibleFromLocation = visibility.isVisible;
                }

                const shouldRender = matchesFilter && isVisibleFromLocation;
                const isSelected = pos.id === selectedId;

                // Position
                dummy.position.set(x, y, z);
                dummy.rotation.set(0, 0, 0);

                // Scale - satellites should be tiny dots, not big blobs
                const baseScale = 0.002;  // Much smaller!
                const selectionScale = isSelected ? 2 : 1;
                const filterScale = shouldRender ? 1 : 0.3;
                const finalScale = baseScale * selectionScale * filterScale;

                dummy.scale.set(finalScale, finalScale, finalScale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);

                rendered++;

                // Color per instance
                const meta = extractMetadata(tle);
                let color: THREE.Color;

                if (isSelected) {
                    color = new THREE.Color('#ff00ff');
                } else if (!shouldRender) {
                    color = new THREE.Color('#222244');
                } else {
                    color = getSatelliteColor(
                        meta.missionType === 'Space Station' ? 'station' :
                            meta.missionType === 'Navigation' ? 'navigation' :
                                meta.operator === 'SpaceX' ? 'starlink' :
                                    meta.missionType === 'Earth Observation' ? 'observation' :
                                        'communication'
                    );
                }

                meshRef.current.setColorAt(i, color);
            } else {
                // Invalid propagation - hide instance
                dummy.position.set(0, 0, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }

        // Update satellites state periodically
        if (Math.random() < 0.02) {
            setSatellites(newSatellites);
            console.log('[SatelliteLayer] Rendered:', rendered, '/', tleData.length);
        }
    });

    const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (event.instanceId !== undefined && satellites[event.instanceId]) {
            onSelect(satellites[event.instanceId]);
        }
    }, [satellites, onSelect]);

    if (tleData.length === 0) {
        console.log('[SatelliteLayer] No TLE data');
        return null;
    }

    console.log('[SatelliteLayer] Rendering mesh with', tleData.length, 'satellites');

    return (
        <instancedMesh
            ref={meshRef}
            args={[satelliteGeo, satelliteMaterial, tleData.length]}
            onClick={handleClick}
            frustumCulled={false}
        />
    );
}

interface OrbitPathProps {
    tle: TLEData;
    color?: string;
    segments?: number;
}

export function OrbitPath({ tle, color = '#ff00ff', segments = 200 }: OrbitPathProps) {
    const lineObject = useMemo(() => {
        const points: THREE.Vector3[] = [];
        const now = new Date();

        const meanMotion = parseFloat(tle.line2.substring(52, 63));
        if (isNaN(meanMotion) || meanMotion <= 0) return null;

        const periodMinutes = 1440 / meanMotion;
        const stepMinutes = periodMinutes / segments;

        for (let i = 0; i <= segments; i++) {
            const time = new Date(now.getTime() + i * stepMinutes * 60 * 1000);
            const pos = propagateSatellite(tle, time);
            if (pos) {
                const [x, y, z] = latLngToVector3(pos.lat, pos.lng, pos.alt);
                points.push(new THREE.Vector3(x, y, z));
            }
        }

        if (points.length < 2) return null;

        const geometry = new THREE.BufferGeometry();
        const positionArray = new Float32Array(points.flatMap(p => [p.x, p.y, p.z]));
        geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
        });

        return new THREE.Line(geometry, material);
    }, [tle, color, segments]);

    if (!lineObject) return null;

    return <primitive object={lineObject} />;
}
