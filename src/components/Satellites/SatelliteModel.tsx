import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SatelliteModelProps {
    position: [number, number, number];
    scale?: number;
    color?: string;
    isSelected?: boolean;
    missionType?: 'civilian' | 'research' | 'military' | 'navigation' | 'station';
}

// Color mapping for mission types
const MISSION_COLORS = {
    civilian: '#00aaff',
    research: '#aa00ff',
    military: '#ff3333',
    navigation: '#00ff66',
    station: '#ffaa00',
};

export function SatelliteModel({
    position,
    scale = 1,
    color,
    isSelected = false,
    missionType = 'civilian',
}: SatelliteModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    const baseColor = color || MISSION_COLORS[missionType];
    const emissiveColor = new THREE.Color(baseColor);

    // Create satellite geometry
    const geometry = useMemo(() => {
        // Main body - hexagonal prism
        const bodyGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);

        // Solar panels
        const panelGeo = new THREE.BoxGeometry(1.2, 0.02, 0.4);

        // Antenna dish
        const dishGeo = new THREE.ConeGeometry(0.15, 0.2, 8);

        // Antenna rod
        const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3);

        return { bodyGeo, panelGeo, dishGeo, rodGeo };
    }, []);

    // Rotate based on velocity vector
    useFrame(({ clock }) => {
        if (groupRef.current) {
            // Subtle rotation animation
            groupRef.current.rotation.y = clock.elapsedTime * 0.5;

            // Glow pulse for selected
            if (glowRef.current && isSelected) {
                const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.3;
                glowRef.current.scale.setScalar(pulse);
            }
        }
    });

    const finalScale = scale * (isSelected ? 1.5 : 1);

    return (
        <group ref={groupRef} position={position} scale={[finalScale, finalScale, finalScale]}>
            {/* Main satellite body */}
            <mesh geometry={geometry.bodyGeo}>
                <meshStandardMaterial
                    color="#1a1a2e"
                    emissive={emissiveColor}
                    emissiveIntensity={0.3}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Left solar panel */}
            <mesh geometry={geometry.panelGeo} position={[-0.8, 0, 0]}>
                <meshStandardMaterial
                    color="#0a0a1a"
                    emissive={emissiveColor}
                    emissiveIntensity={0.5}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Right solar panel */}
            <mesh geometry={geometry.panelGeo} position={[0.8, 0, 0]}>
                <meshStandardMaterial
                    color="#0a0a1a"
                    emissive={emissiveColor}
                    emissiveIntensity={0.5}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Antenna dish */}
            <mesh geometry={geometry.dishGeo} position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]}>
                <meshStandardMaterial
                    color="#2a2a3e"
                    emissive={emissiveColor}
                    emissiveIntensity={0.2}
                    metalness={0.7}
                    roughness={0.3}
                />
            </mesh>

            {/* Antenna rod */}
            <mesh geometry={geometry.rodGeo} position={[0, 0.35, 0]}>
                <meshBasicMaterial color={baseColor} />
            </mesh>

            {/* Selection glow ring */}
            {isSelected && (
                <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.5, 1.8, 32]} />
                    <meshBasicMaterial
                        color={baseColor}
                        transparent
                        opacity={0.6}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* Point light for glow effect */}
            <pointLight color={baseColor} intensity={isSelected ? 2 : 0.5} distance={3} />
        </group>
    );
}

// Simplified satellite for instancing (far away satellites)
export function createSatelliteGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // Diamond/octahedron shape for distant satellites
    const vertices = new Float32Array([
        // Top point
        0, 0.5, 0,
        // Middle ring
        0.3, 0, 0.3,
        0.3, 0, -0.3,
        -0.3, 0, -0.3,
        -0.3, 0, 0.3,
        // Bottom point
        0, -0.5, 0,
    ]);

    const indices = new Uint16Array([
        // Top faces
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 1,
        // Bottom faces
        5, 2, 1,
        5, 3, 2,
        5, 4, 3,
        5, 1, 4,
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return geometry;
}
