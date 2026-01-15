import { useMemo } from 'react';
import * as THREE from 'three';

interface AtmosphereProps {
    color?: string;
}

export function Atmosphere({ color = '#00ffff' }: AtmosphereProps) {
    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(color) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) },
                c: { value: 0.4 },
                p: { value: 4.0 },
            },
            vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.6);
        }
      `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
        });
    }, [color]);

    return (
        <mesh scale={[1.15, 1.15, 1.15]}>
            <sphereGeometry args={[1, 64, 64]} />
            <primitive object={shaderMaterial} attach="material" />
        </mesh>
    );
}

export function Stars({ count = 5000 }) {
    const { positions, colors } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 50 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Random star colors (white to cyan to purple)
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.9) {
                colors[i * 3] = 0;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 1;
            } else {
                colors[i * 3] = 0.8;
                colors[i * 3 + 1] = 0.2;
                colors[i * 3 + 2] = 1;
            }
        }

        return { positions, colors };
    }, [count]);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    }, [positions, colors]);

    return (
        <points geometry={geometry}>
            <pointsMaterial
                size={0.2}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    );
}
