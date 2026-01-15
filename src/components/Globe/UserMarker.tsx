import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLngToVector3 } from '../../utils/satellite';

interface UserMarkerProps {
    lat: number;
    lng: number;
    color?: string;
}

export function UserMarker({ lat, lng, color = '#ff00ff' }: UserMarkerProps) {
    const markerRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const beamRef = useRef<THREE.Mesh>(null);

    const position = useMemo(() => {
        const [x, y, z] = latLngToVector3(lat, lng, 0);
        return new THREE.Vector3(x, y, z);
    }, [lat, lng]);

    // Calculate rotation to face outward from Earth center
    const quaternion = useMemo(() => {
        const up = new THREE.Vector3(0, 1, 0);
        const normal = position.clone().normalize();
        const q = new THREE.Quaternion();
        q.setFromUnitVectors(up, normal);
        return q;
    }, [position]);

    useFrame(({ clock }) => {
        if (ringRef.current) {
            // Pulsing animation
            const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.3;
            ringRef.current.scale.set(scale, scale, scale);
        }
        if (beamRef.current) {
            // Beam pulsing
            const opacity = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.2;
            (beamRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <group ref={markerRef} position={position} quaternion={quaternion}>
            {/* Center glow dot */}
            <mesh>
                <sphereGeometry args={[0.015, 16, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Inner pulsing ring */}
            <mesh ref={ringRef}>
                <ringGeometry args={[0.025, 0.032, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Outer ring */}
            <mesh>
                <ringGeometry args={[0.045, 0.05, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Location beam extending upward */}
            <mesh ref={beamRef} position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.003, 0.003, 0.3, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
            </mesh>

            {/* Diamond marker at top of beam */}
            <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 4]}>
                <octahedronGeometry args={[0.02]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
}
