// Sun position utilities for day/night terminator

export function getSunPosition(date: Date): { lat: number; lng: number } {
    // Calculate sun position based on date/time
    const dayOfYear = getDayOfYear(date);
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60;

    // Solar declination (simplified formula)
    const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));

    // Hour angle - sun longitude based on time
    const solarNoon = 12; // UTC
    const hourAngle = (hours - solarNoon) * 15; // 15 degrees per hour

    return {
        lat: declination,
        lng: -hourAngle, // Negative because sun moves west
    };
}

function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

export function getSunDirection(date: Date): [number, number, number] {
    const { lat, lng } = getSunPosition(date);

    // Convert lat/lng to 3D direction vector
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);

    return [x, y, z];
}
