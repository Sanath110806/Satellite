// Visibility calculation utilities

export interface UserLocation {
    lat: number;
    lng: number;
    alt: number; // meters above sea level
    name?: string;
}

export interface SatelliteVisibility {
    isVisible: boolean;
    azimuth: number; // degrees from north
    elevation: number; // degrees above horizon
    range: number; // km
}

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate if a satellite is visible from a given location
 */
export function calculateVisibility(
    userLat: number,
    userLng: number,
    userAlt: number,
    satLat: number,
    satLng: number,
    satAlt: number
): SatelliteVisibility {
    // Convert to radians
    const lat1 = userLat * (Math.PI / 180);
    const lng1 = userLng * (Math.PI / 180);
    const lat2 = satLat * (Math.PI / 180);
    const lng2 = satLng * (Math.PI / 180);

    // User position in ECEF
    const userR = EARTH_RADIUS_KM + userAlt / 1000;
    const userX = userR * Math.cos(lat1) * Math.cos(lng1);
    const userY = userR * Math.cos(lat1) * Math.sin(lng1);
    const userZ = userR * Math.sin(lat1);

    // Satellite position in ECEF
    const satR = EARTH_RADIUS_KM + satAlt;
    const satX = satR * Math.cos(lat2) * Math.cos(lng2);
    const satY = satR * Math.cos(lat2) * Math.sin(lng2);
    const satZ = satR * Math.sin(lat2);

    // Vector from user to satellite
    const dx = satX - userX;
    const dy = satY - userY;
    const dz = satZ - userZ;

    const range = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // User's up vector (normal to Earth surface)
    const upX = userX / userR;
    const upY = userY / userR;
    const upZ = userZ / userR;

    // Dot product to get elevation angle
    const dotProduct = (dx * upX + dy * upY + dz * upZ) / range;
    const elevation = Math.asin(dotProduct) * (180 / Math.PI);

    // Calculate azimuth (simplified)
    const north = [
        -Math.sin(lat1) * Math.cos(lng1),
        -Math.sin(lat1) * Math.sin(lng1),
        Math.cos(lat1)
    ];
    const east = [-Math.sin(lng1), Math.cos(lng1), 0];

    const satDir = [dx / range, dy / range, dz / range];
    const northComponent = satDir[0] * north[0] + satDir[1] * north[1] + satDir[2] * north[2];
    const eastComponent = satDir[0] * east[0] + satDir[1] * east[1] + satDir[2] * east[2];

    let azimuth = Math.atan2(eastComponent, northComponent) * (180 / Math.PI);
    if (azimuth < 0) azimuth += 360;

    // Satellite is visible if elevation > 0 (above horizon)
    // Account for atmospheric refraction, use small negative value
    const isVisible = elevation > -0.5;

    return {
        isVisible,
        azimuth,
        elevation,
        range,
    };
}

/**
 * Calculate next pass time for a satellite over a location
 */
export function predictNextPass(
    userLat: number,
    userLng: number,
    userAlt: number,
    propagateFn: (date: Date) => { lat: number; lng: number; alt: number } | null,
    maxHours: number = 24
): { startTime: Date; maxElevation: number } | null {
    const now = new Date();
    const stepMinutes = 1;
    const maxSteps = (maxHours * 60) / stepMinutes;

    let wasVisible = false;
    let passStart: Date | null = null;
    let maxElevation = 0;

    for (let i = 0; i < maxSteps; i++) {
        const time = new Date(now.getTime() + i * stepMinutes * 60 * 1000);
        const satPos = propagateFn(time);

        if (!satPos) continue;

        const visibility = calculateVisibility(
            userLat, userLng, userAlt,
            satPos.lat, satPos.lng, satPos.alt
        );

        if (visibility.isVisible && !wasVisible) {
            // Pass starting
            passStart = time;
            maxElevation = visibility.elevation;
        } else if (visibility.isVisible && wasVisible) {
            // During pass
            maxElevation = Math.max(maxElevation, visibility.elevation);
        } else if (!visibility.isVisible && wasVisible && passStart) {
            // Pass ended
            return { startTime: passStart, maxElevation };
        }

        wasVisible = visibility.isVisible;
    }

    return null;
}
