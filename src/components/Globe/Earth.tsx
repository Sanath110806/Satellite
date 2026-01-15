import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { getSunDirection } from '../../utils/sun';

interface EarthProps {
    autoRotate?: boolean;
    rotationSpeed?: number;
}

// Use high-quality Earth textures from a CDN
const EARTH_DAY_TEXTURE = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg';
const EARTH_NIGHT_TEXTURE = 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg';

export function Earth({ autoRotate = false, rotationSpeed = 0.0001 }: EarthProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);
    const sunLightRef = useRef<THREE.DirectionalLight>(null);

    // Load Earth textures
    const [dayTexture, nightTexture] = useLoader(TextureLoader, [
        EARTH_DAY_TEXTURE,
        EARTH_NIGHT_TEXTURE,
    ]);

    // Create Earth shader material with day/night transition
    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                sunDirection: { value: new THREE.Vector3(1, 0, 0) },
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 sunDir = normalize(sunDirection);
          float intensity = dot(vNormal, sunDir);
          
          // Smooth transition at terminator
          float dayFactor = smoothstep(-0.2, 0.3, intensity);
          
          // Sample textures
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          
          // Blend based on sun illumination
          vec4 finalColor = mix(nightColor, dayColor, dayFactor);
          
          // Boost night lights
          finalColor.rgb += nightColor.rgb * (1.0 - dayFactor) * 1.5;
          
          // Add slight atmosphere tint on lit side
          finalColor.rgb += vec3(0.1, 0.2, 0.4) * max(0.0, intensity) * 0.2;
          
          gl_FragColor = finalColor;
        }
      `,
        });
    }, [dayTexture, nightTexture]);

    useFrame(() => {
        // Update sun direction based on current time
        const now = new Date();
        const sunDir = getSunDirection(now);
        earthMaterial.uniforms.sunDirection.value.set(sunDir[0], sunDir[1], sunDir[2]);

        // Update directional light to match sun
        if (sunLightRef.current) {
            sunLightRef.current.position.set(sunDir[0] * 10, sunDir[1] * 10, sunDir[2] * 10);
        }

        if (autoRotate) {
            if (meshRef.current) {
                meshRef.current.rotation.y += rotationSpeed;
            }
            if (cloudsRef.current) {
                cloudsRef.current.rotation.y += rotationSpeed * 1.1;
            }
        }
    });

    return (
        <group>
            {/* Sun light */}
            <directionalLight ref={sunLightRef} intensity={1.5} color="#ffffff" />

            {/* Main Earth sphere with textured day/night shader */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <primitive object={earthMaterial} attach="material" />
            </mesh>

            {/* Subtle grid overlay for cyberpunk effect */}
            <mesh>
                <sphereGeometry args={[1.003, 72, 72]} />
                <meshBasicMaterial
                    color="#00ffff"
                    wireframe
                    transparent
                    opacity={0.03}
                />
            </mesh>
        </group>
    );
}
