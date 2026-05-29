class PlaneEntity {
    constructor(viewer) {
        this.viewer = viewer;
        this.entity = null;
        
        // Flight control surfaces
        this.throttle = 0.0;  // 0.0 to 1.0
        this.elevator = 0.0;  // -1.0 to 1.0 (up/down)
        this.rudder = 0.0;    // -1.0 to 1.0 (left/right yaw)
        this.aileron = 0.0;   // -1.0 to 1.0 (roll left/right)
        
        // Physical properties
        this.mass = 1000;              // kg
        this.maxThrust = 7000;         // Newtons (boosted slightly for takeoff ease)
        this.dragCoefficient = 0.04;
        this.liftCoefficient = 0.6;
        
        // Flight state (Stored in radians/metric internally, metrics for UI)
        this.airspeed = 0;   // m/s
        this.altitude = 0;   // meters
        this.heading = 0;    // radians
        this.pitch = 0;      // radians
        this.roll = 0;       // radians
        
        this.velocity = new Cesium.Cartesian3(0, 0, 0); // m/s in local East-North-Up frame
    }
    
    createAtLocation(latitude, longitude, altitude) {
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
        }
        
        // Set initial position
        const startPos = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
        this.altitude = altitude;
        
        // Default orientation: Facing North (Heading = 0), level pitch/roll
        this.heading = 0;
        this.pitch = 0;
        this.roll = 0;
        
        // Set initial velocity tracking forward at a baseline speed (e.g., 40 m/s to avoid instant stall)
        this.airspeed = 40;
        this.velocity = new Cesium.Cartesian3(0, this.airspeed, 0); // Moving North initially
        
        this.entity = this.viewer.entities.add({
            name: 'Aircraft',
            position: startPos,
            orientation: new Cesium.CallbackProperty(() => {
                const hpr = new Cesium.HeadingPitchRoll(this.heading, this.pitch, this.roll);
                return Cesium.Transforms.headingPitchRollQuaternion(this.entity.position.getValue(this.viewer.clock.currentTime), hpr);
            }, false),
            model: {
                uri: 'assets/plane.glb',
                minimumPixelSize: 50,
                maximumScale: 200
            },
            label: {
                text: 'Aircraft',
                font: '14pt monospace',
                fillColor: Cesium.Color.YELLOW,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -30)
            }
        });
        
        // Snap camera right behind immediately
        this.viewer.trackedEntity = undefined; 
    }
    
    update(dt) {
        if (!this.entity || dt <= 0) return;
        
        // 1. Process Control Inputs to alter orientation rates
        this.roll += this.aileron * 1.5 * dt;
        this.pitch += this.elevator * 1.0 * dt;
        this.heading -= this.rudder * 0.5 * dt; // Rudder yaw
        
        // Bank-to-turn effect: rolling automatically causes a heading change
        if (Math.abs(this.roll) > 0.05) {
            this.heading -= Math.sin(this.roll) * 0.5 * dt;
        }
        
        // Bounds limiting
        this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
        this.roll = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.roll));
        
        // 2. Physics & Forces
        // Calculate forward air vector based on orientation
        const cosPitch = Math.cos(this.pitch);
        const forwardDir = new Cesium.Cartesian3(
            Math.sin(this.heading) * cosPitch,
            Math.cos(this.heading) * cosPitch,
            Math.sin(this.pitch)
        );
        
        // Calculate Thrust
        const thrustForce = this.throttle * this.maxThrust;
        
        // Calculate Drag (D = 0.5 * rho * v^2 * Cd * S)
        const airDensity = 1.225 * Math.exp(-this.altitude / 8500);
        const dragForce = 0.5 * airDensity * (this.airspeed * this.airspeed) * this.dragCoefficient * 16.2;
        
        // Calculate Lift
        const liftForce = 0.5 * airDensity * (this.airspeed * this.airspeed) * this.liftCoefficient * 16.2;
        
        // Net Acceleration along the flight path
        const netForwardForce = thrustForce - dragForce;
        const forwardAcc = netForwardForce / this.mass;
        
        // Adjust airspeed
        this.airspeed += forwardAcc * dt;
        if (this.airspeed < 0) this.airspeed = 0;
        
        // 3. Translate Local Movement into Earth-Centered Earth-Fixed (ECEF) coordinates
        const currentECEF = this.entity.position.getValue(this.viewer.clock.currentTime);
        
        // Create an East-North-Up local coordinate matrix framework for where the plane currently is
        const localToWorldMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(currentECEF);
        
        // Calculate moving vector relative to our orientation frame
        const localVelocity = Cesium.Cartesian3.multiplyByScalar(forwardDir, this.airspeed, new Cesium.Cartesian3());
        
        // Account for lift opposing gravity in local framework
        const gravityEffect = 9.81 * dt;
        const liftEffect = (liftForce / this.mass) * dt;
        localVelocity.z += (liftEffect - gravityEffect);
        
        // Transform local movement step to world steps
        const worldMovement = Cesium.Matrix4.multiplyByPointAsVector(
            localToWorldMatrix, 
            Cesium.Cartesian3.multiplyByScalar(localVelocity, dt, new Cesium.Cartesian3()), 
            new Cesium.Cartesian3()
        );
        
        // Apply final position update
        const newECEF = Cesium.Cartesian3.add(currentECEF, worldMovement, new Cesium.Cartesian3());
        this.entity.position.setValue(newECEF);
        
        // Update altitude tracking state variable
        const cartographic = Cesium.Cartographic.fromCartesian(newECEF);
        this.altitude = cartographic.height;
        
        // 4. Update HUD Text
        this.updateInstrumentation();
    }
    
    updateInstrumentation() {
        if (this.entity && this.entity.label) {
            const speedKnots = this.airspeed * 1.94384;
            const altitudeFeet = this.altitude * 3.28084;
            this.entity.label.text = `AIRCRAFT\nSPD: ${speedKnots.toFixed(0)} KTS\nALT: ${altitudeFeet.toFixed(0)} FT\nTHR: ${(this.throttle * 100).toFixed(0)}%`;
        }
    }
    
    setThrottle(value)  { this.throttle = Math.max(0, Math.min(1, value)); }
    setElevator(value)  { this.elevator = Math.max(-1, Math.min(1, value)); }
    setRudder(value)    { this.rudder = Math.max(-1, Math.min(1, value)); }
    setAileron(value)   { this.aileron = Math.max(-1, Math.min(1, value)); }
}
