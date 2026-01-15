**Orbital Command**  
Real-Time Space Situational Awareness Platform

Orbital Command is a professional real-time orbital intelligence and satellite visualization platform. It displays Earth together with all active satellites in their accurate orbital positions, utilizing live public space-tracking data.

Designed as a modern mission control interface with a cyberpunk aesthetic, the system delivers location-aware satellite visibility, precise orbital mechanics, sophisticated filtering capabilities, and immersive 3D visualization. This is not a simple satellite tracker—it is a comprehensive space operations console.

**Key Features**

- Full 3D Earth visualization with realistic day/night terminator, atmospheric glow, starfield background, and orbital context  
- Real-time rendering of thousands of satellites in their true orbital positions using SGP4 propagation and current Two-Line Element (TLE) data  
- Location-aware visibility: input any city or use device GPS to display only satellites currently above the local horizon  
- Satellite focus mode: lock the camera onto any satellite for detailed orbital inspection  
- Orbital telemetry panel displaying real-time information including altitude, velocity, inclination, orbit class, operator, mission type, and time of next visible pass  
- Advanced filtering system allowing users to filter satellites by:  
  - Operator (e.g., SpaceX, ISRO, OneWeb, NASA)  
  - Mission type (Communications, Navigation, Earth Observation, Weather, Military)  
  - Orbit class (LEO, MEO, GEO)  
  - Country of origin  
  - Active/inactive status  

- Cyberpunk-inspired mission control interface featuring neon HUD elements, holographic panels, scanline effects, glow aesthetics, and cinematic animations  
- High-performance GPU-accelerated rendering using instanced meshes, level-of-detail (LOD) systems, spatial filtering, and WebGL optimizations  

**Data Sources**  
- CelesTrak TLE catalog  
- Space-Track public satellite database  
- Open space telemetry datasets  
- Orbital propagation performed using the industry-standard SGP4 model  

**Technology Stack**  
- Frontend: Next.js + TypeScript, Three.js / React Three Fiber, WebGL instancing, Framer Motion animations, Tailwind CSS  
- Backend: Node.js, custom SGP4 orbit propagation engine, WebSocket-based real-time updates, TLE ingestion and caching service  

**Intended Users**  
Orbital Command serves as a professional space situational awareness tool for:  
- Aerospace engineers  
- Satellite operators  
- Space domain researchers  
- Space enthusiasts  
- Defense and security visualization professionals  

**Disclaimer**  
Orbital Command exclusively utilizes publicly available satellite tracking data and does not provide access to classified or restricted information.

**Purpose**  
In an increasingly congested orbital environment, comprehensive situational awareness is essential. Orbital Command exists to provide that capability.
