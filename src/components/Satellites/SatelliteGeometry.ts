import * as THREE from 'three';

// Satellite type categories
export type SatelliteType = 'communication' | 'observation' | 'navigation' | 'station' | 'starlink';

// Detect satellite type from name
export function getSatelliteType(name: string): SatelliteType {
    const upper = name.toUpperCase();
    if (upper.includes('ISS') || upper.includes('TIANGONG') || upper.includes('STATION')) return 'station';
    if (upper.includes('GPS') || upper.includes('GLONASS') || upper.includes('GALILEO') || upper.includes('BEIDOU') || upper.includes('IRNSS')) return 'navigation';
    if (upper.includes('STARLINK') || upper.includes('ONEWEB')) return 'starlink';
    if (upper.includes('LANDSAT') || upper.includes('SENTINEL') || upper.includes('GOES') || upper.includes('NOAA')) return 'observation';
    return 'communication';
}

// Color by satellite type
export function getSatelliteColor(type: SatelliteType): THREE.Color {
    switch (type) {
        case 'station': return new THREE.Color('#ffaa00');
        case 'navigation': return new THREE.Color('#00ff66');
        case 'starlink': return new THREE.Color('#00aaff');
        case 'observation': return new THREE.Color('#ff6600');
        case 'communication': return new THREE.Color('#00ffff');
        default: return new THREE.Color('#00ffff');
    }
}

// Create realistic satellite geometry based on type
export function createSatelliteGeometry(type: SatelliteType): THREE.Group {
    const group = new THREE.Group();

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: '#2a2a3a',
        metalness: 0.9,
        roughness: 0.2,
    });

    const panelMaterial = new THREE.MeshStandardMaterial({
        color: '#0a0a2a',
        metalness: 0.95,
        roughness: 0.1,
        emissive: new THREE.Color('#000033'),
        emissiveIntensity: 0.3,
    });

    const antennaMaterial = new THREE.MeshStandardMaterial({
        color: '#4a4a5a',
        metalness: 0.8,
        roughness: 0.3,
    });

    const accentColor = getSatelliteColor(type);
    const accentMaterial = new THREE.MeshBasicMaterial({
        color: accentColor,
    });

    switch (type) {
        case 'station':
            // Space station - large modular structure
            createSpaceStation(group, bodyMaterial, panelMaterial, accentMaterial);
            break;
        case 'navigation':
            // Navigation satellite - cube with large solar arrays
            createNavigationSatellite(group, bodyMaterial, panelMaterial, antennaMaterial, accentMaterial);
            break;
        case 'starlink':
            // Starlink - flat panel design
            createStarlinkSatellite(group, bodyMaterial, panelMaterial, accentMaterial);
            break;
        case 'observation':
            // Earth observation - cylindrical with instruments
            createObservationSatellite(group, bodyMaterial, panelMaterial, antennaMaterial, accentMaterial);
            break;
        default:
            // Communication satellite - typical geostationary design
            createCommunicationSatellite(group, bodyMaterial, panelMaterial, antennaMaterial, accentMaterial);
    }

    return group;
}

function createSpaceStation(
    group: THREE.Group,
    bodyMat: THREE.Material,
    panelMat: THREE.Material,
    accentMat: THREE.Material
) {
    // Central module
    const coreGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
    const core = new THREE.Mesh(coreGeo, bodyMat);
    core.rotation.z = Math.PI / 2;
    group.add(core);

    // Cross module
    const crossGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
    const cross = new THREE.Mesh(crossGeo, bodyMat);
    group.add(cross);

    // Solar arrays (4 large panels)
    const panelGeo = new THREE.BoxGeometry(0.8, 0.02, 0.3);
    for (let i = 0; i < 4; i++) {
        const panel = new THREE.Mesh(panelGeo, panelMat);
        const angle = (i * Math.PI / 2) + Math.PI / 4;
        panel.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
        panel.rotation.y = angle;
        group.add(panel);
    }

    // Accent lights
    const lightGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const light1 = new THREE.Mesh(lightGeo, accentMat);
    light1.position.set(0.3, 0, 0);
    group.add(light1);
}

function createNavigationSatellite(
    group: THREE.Group,
    bodyMat: THREE.Material,
    panelMat: THREE.Material,
    antennaMat: THREE.Material,
    accentMat: THREE.Material
) {
    // Main bus (cube)
    const busGeo = new THREE.BoxGeometry(0.3, 0.25, 0.25);
    const bus = new THREE.Mesh(busGeo, bodyMat);
    group.add(bus);

    // Large solar panels on each side
    const panelGeo = new THREE.BoxGeometry(0.6, 0.02, 0.35);
    const panelLeft = new THREE.Mesh(panelGeo, panelMat);
    panelLeft.position.set(-0.45, 0, 0);
    group.add(panelLeft);

    const panelRight = new THREE.Mesh(panelGeo, panelMat);
    panelRight.position.set(0.45, 0, 0);
    group.add(panelRight);

    // Navigation antenna array
    const antennaGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.1, 6);
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(0, 0.18, 0);
    group.add(antenna);

    // Accent
    const ringGeo = new THREE.TorusGeometry(0.1, 0.01, 8, 16);
    const ring = new THREE.Mesh(ringGeo, accentMat);
    ring.position.set(0, 0.2, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
}

function createStarlinkSatellite(
    group: THREE.Group,
    bodyMat: THREE.Material,
    panelMat: THREE.Material,
    accentMat: THREE.Material
) {
    // Flat-pack body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.05, 0.25);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Single large solar panel
    const panelGeo = new THREE.BoxGeometry(0.7, 0.01, 0.4);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 0.04, 0);
    group.add(panel);

    // Phased array antennas (flat)
    const arrayGeo = new THREE.BoxGeometry(0.2, 0.02, 0.15);
    const array = new THREE.Mesh(arrayGeo, bodyMat);
    array.position.set(0, -0.04, 0);
    group.add(array);

    // Accent strip
    const stripGeo = new THREE.BoxGeometry(0.5, 0.01, 0.02);
    const strip = new THREE.Mesh(stripGeo, accentMat);
    strip.position.set(0, 0.03, 0.12);
    group.add(strip);
}

function createObservationSatellite(
    group: THREE.Group,
    bodyMat: THREE.Material,
    panelMat: THREE.Material,
    antennaMat: THREE.Material,
    accentMat: THREE.Material
) {
    // Cylindrical body
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 12);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Camera/telescope aperture
    const lensGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.1, 12);
    const lens = new THREE.Mesh(lensGeo, antennaMat);
    lens.position.set(0, -0.25, 0);
    group.add(lens);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(0.5, 0.02, 0.2);
    const panelLeft = new THREE.Mesh(panelGeo, panelMat);
    panelLeft.position.set(-0.35, 0.1, 0);
    group.add(panelLeft);

    const panelRight = new THREE.Mesh(panelGeo, panelMat);
    panelRight.position.set(0.35, 0.1, 0);
    group.add(panelRight);

    // Accent ring around lens
    const ringGeo = new THREE.TorusGeometry(0.11, 0.01, 8, 16);
    const ring = new THREE.Mesh(ringGeo, accentMat);
    ring.position.set(0, -0.25, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
}

function createCommunicationSatellite(
    group: THREE.Group,
    bodyMat: THREE.Material,
    panelMat: THREE.Material,
    antennaMat: THREE.Material,
    accentMat: THREE.Material
) {
    // Main bus (box)
    const busGeo = new THREE.BoxGeometry(0.25, 0.3, 0.2);
    const bus = new THREE.Mesh(busGeo, bodyMat);
    group.add(bus);

    // Large solar arrays (wings)
    const panelGeo = new THREE.BoxGeometry(0.6, 0.02, 0.25);
    const panelLeft = new THREE.Mesh(panelGeo, panelMat);
    panelLeft.position.set(-0.42, 0, 0);
    group.add(panelLeft);

    const panelRight = new THREE.Mesh(panelGeo, panelMat);
    panelRight.position.set(0.42, 0, 0);
    group.add(panelRight);

    // Large dish antenna
    const dishGeo = new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dish = new THREE.Mesh(dishGeo, antennaMat);
    dish.position.set(0, 0.2, 0.1);
    dish.rotation.x = -Math.PI / 2;
    group.add(dish);

    // Small horn antennas
    const hornGeo = new THREE.ConeGeometry(0.03, 0.08, 6);
    const horn1 = new THREE.Mesh(hornGeo, antennaMat);
    horn1.position.set(0.1, 0.18, -0.08);
    group.add(horn1);

    const horn2 = new THREE.Mesh(hornGeo, antennaMat);
    horn2.position.set(-0.1, 0.18, -0.08);
    group.add(horn2);

    // Accent light on dish
    const lightGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const light = new THREE.Mesh(lightGeo, accentMat);
    light.position.set(0, 0.2, 0.1);
    group.add(light);
}

// Create instanced geometry for efficient rendering (simplified version for many satellites)
export function createInstancedSatelliteGeometry(): THREE.BufferGeometry {
    // For instancing, we'll use a simple but recognizable shape
    // Satellite body with extended solar panels
    const combined = new THREE.BufferGeometry();

    // For instancing, we'll use a simple but recognizable shape
    // Satellite body with extended solar panels
    const vertices = new Float32Array([
        // Body (box) - front face
        -0.15, -0.1, 0.075, 0.15, -0.1, 0.075, 0.15, 0.1, 0.075,
        -0.15, -0.1, 0.075, 0.15, 0.1, 0.075, -0.15, 0.1, 0.075,
        // Body - back face
        -0.15, -0.1, -0.075, -0.15, 0.1, -0.075, 0.15, 0.1, -0.075,
        -0.15, -0.1, -0.075, 0.15, 0.1, -0.075, 0.15, -0.1, -0.075,
        // Body - top
        -0.15, 0.1, -0.075, -0.15, 0.1, 0.075, 0.15, 0.1, 0.075,
        -0.15, 0.1, -0.075, 0.15, 0.1, 0.075, 0.15, 0.1, -0.075,
        // Body - bottom
        -0.15, -0.1, -0.075, 0.15, -0.1, -0.075, 0.15, -0.1, 0.075,
        -0.15, -0.1, -0.075, 0.15, -0.1, 0.075, -0.15, -0.1, 0.075,
        // Left panel
        -0.5, -0.01, -0.1, -0.15, -0.01, -0.1, -0.15, 0.01, -0.1,
        -0.5, -0.01, -0.1, -0.15, 0.01, -0.1, -0.5, 0.01, -0.1,
        -0.5, -0.01, 0.1, -0.5, 0.01, 0.1, -0.15, 0.01, 0.1,
        -0.5, -0.01, 0.1, -0.15, 0.01, 0.1, -0.15, -0.01, 0.1,
        // Right panel
        0.15, -0.01, -0.1, 0.5, -0.01, -0.1, 0.5, 0.01, -0.1,
        0.15, -0.01, -0.1, 0.5, 0.01, -0.1, 0.15, 0.01, -0.1,
        0.15, -0.01, 0.1, 0.15, 0.01, 0.1, 0.5, 0.01, 0.1,
        0.15, -0.01, 0.1, 0.5, 0.01, 0.1, 0.5, -0.01, 0.1,
    ]);

    combined.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    combined.computeVertexNormals();

    return combined;
}
