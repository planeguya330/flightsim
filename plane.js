class PlaneEntity {
    constructor(viewer) {
        this.viewer = viewer;
        this.entity = null;
        this.hpr = new HeadingPitchRoll(0, 0, 0); // Heading, Pitch, Roll
        this.position = new Cartesian3(0, 0, 0);
        this.velocity = new Cartesian3(0, 0, 0);
        this.acceleration = new Cartesian3(0, 0, 0);
        
        // Flight control surfaces
        this.throttle = 0.0; // 0.0 to 1.0
        this.elevator = 0.0; // -1.0 to 1.0 (up/down)
        this.rudder = 0.0;   // -1.0 to 1.0 (left/right yaw)
        this.aileron = 0.0;  // -1.0 to 1.0 (roll left/right)
        
        // Physical properties
        this.mass = 1000; // kg
        this.maxThrust = 5000; // Newtons
        this.maxLift = 15000; // Newtons
        this.dragCoefficient = 0.03;
        this.liftCoefficient = 0.5;
        
        // Flight state
        this.airspeed = 0; // m/s
        this.altitude = 0; // meters
        this.heading = 0; // degrees
        this.pitch = 0; // degrees
        this.roll = 0; // degrees
    }
    
    createAtLocation(latitude, longitude, altitude) {
        // Remove existing entity if any
        if (this.entity) {
            this.viewer.entities.remove(this.entity);
        }
        
        // Set initial position
        this.position = Cartesian3.fromDegrees(longitude, latitude, altitude);
        this.altitude = altitude;
        
        // Create the entity with a 3D model placeholder
        // In a real implementation, you would load a glTF model
        // For now, we'll use a simple placeholder or billboard
        
        this.entity = this.viewer.entities.add({
            name: 'Aircraft',
            position: this.position,
            orientation: new VelocityOrientationProperty(this.velocity),
            // For a real 3D model, use:
            // model: {
            //     uri: 'Models/Airplane.glTF', // Your aircraft model
            //     minimumPixelSize: 50,
            //     maximumScale: 200
            // },
            // For now, using a simple billboard as placeholder:
            billboard: {
                image: 'https://via.placeholder.com/50',
                width: 50,
                height: 50
            },
            label: {
                text: 'Aircraft',
                font: '14pt sans-serif',
                fillColor: Color.YELLOW,
                style: LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -30)
            }
        });
        
        // Reset flight state
        this.resetFlightState();
    }
    
    resetFlightState() {
        this.velocity = new Cartesian3(0, 0, 0);
        this.acceleration = new Cartesian3(0, 0, 0);
        this.throttle = 0.0;
        this.elevator = 0.0;
        this.rudder = 0.0;
        this.aileron = 0.0;
        this.airspeed = 0;
        this.heading = 0;
        this.pitch = 0;
        this.roll = 0;
        
        // Reset HPR
        this.hpr = new HeadingPitchRoll(0, 0, 0);
        
        // Update entity orientation if it exists
        if (this.entity) {
            this.entity.orientation = new VelocityOrientationProperty(this.velocity);
        }
    }
    
    update(time) {
        if (!this.entity) return;
        
        // Update position based on velocity
        const seconds = time.secondsSinceStart || (this._lastTime ? (time - this._lastTime) / 1000 : 0);
        this._lastTime = time;
        
        // Apply physics
        this.applyPhysics(seconds);
        
        // Update position
        this.position = Cartesian3.add(
            this.position,
            Cartesian3.multiplyByScalar(this.velocity, seconds, new Cartesian3()),
            new Cartesian3()
        );
        
        // Update entity position
        this.entity.position = this.position;
        
        // Update orientation based on velocity and control inputs
        this.updateOrientation(seconds);
        
        // Update flight instrumentation
        this.updateInstrumentation();
    }
    
    applyPhysics(dt) {
        // Reset acceleration
        this.acceleration = new Cartesian3(0, 0, 0);
        
        // Gravity
        this.acceleration.z -= 9.81; // m/s^2 downward
        
        // Thrust (in the direction the aircraft is pointing)
        const thrustForce = this.throttle * this.maxThrust;
        const thrustDirection = this.getForwardVector();
        const thrustAcceleration = Cartesian3.multiplyByScalar(
            thrustDirection, 
            thrustForce / this.mass, 
            new Cartesian3()
        );
        this.acceleration = Cartesian3.add(this.acceleration, thrustAcceleration, new Cartesian3());
        
        // Lift (perpendicular to wings)
        const liftForce = this.calculateLift();
        const liftDirection = this.getUpVector(); // Simplified - should be relative to wing orientation
        const liftAcceleration = Cartesian3.multiplyByScalar(
            liftDirection, 
            liftForce / this.mass, 
            new Cartesian3()
        );
        this.acceleration = Cartesian3.add(this.acceleration, liftAcceleration, new Cartesian3());
        
        // Drag (opposite to velocity)
        if (Cartesian3.magnitude(this.velocity) > 0.1) {
            const dragMagnitude = 0.5 * this.dragCoefficient * 
                                  Cartesian3.magnitude(this.velocity) * 
                                  Cartesian3.magnitude(this.velocity) * 
                                  1.225 * // air density (kg/m^3) at sea level
                                  10; // reference area (m^2) - simplified
            const dragDirection = Cartesian3.negate(this.velocity, new Cartesian3());
            Cartesian3.normalize(dragDirection, dragDirection);
            const dragAcceleration = Cartesian3.multiplyByScalar(
                dragDirection, 
                dragMagnitude / this.mass, 
                new Cartesian3()
            );
            this.acceleration = Cartesian3.add(this.acceleration, dragAcceleration, new Cartesian3());
        }
        
        // Update velocity
        this.velocity = Cartesian3.add(
            this.velocity,
            Cartesian3.multiplyByScalar(this.acceleration, dt, new Cartesian3()),
            new Cartesian3()
        );
    }
    
    updateOrientation(dt) {
        if (Cartesian3.magnitude(this.velocity) < 1.0) return; // Don't update if barely moving
        
        // Calculate desired orientation based on velocity and control inputs
        // This is a simplified model - real flight dynamics are more complex
        
        // Calculate airspeed
        this.airspeed = Cartesian3.magnitude(this.velocity);
        
        // Calculate pitch from velocity vector and current orientation
        // Simplified: pitch is the angle between velocity vector and horizontal plane
        const velocityHorizontal = new Cartesian3(this.velocity.x, this.velocity.y, 0);
        if (Cartesian3.magnitude(velocityHorizontal) > 0.1) {
            const pitchAngle = -Math.atan2(
                this.velocity.z, 
                Cartesian3.magnitude(velocityHorizontal)
            );
            // Apply elevator input
            this.pitch = pitchAngle + (this.elevator * 0.5); // Scale elevator input
        }
        
        // Calculate heading from velocity vector projected on horizontal plane
        if (Cartesian3.magnitude(velocityHorizontal) > 0.1) {
            this.heading = Math.atan2(velocityHorizontal.x, velocityHorizontal.y);
            // Apply rudder input for yaw
            this.heading += this.rudder * 0.1; // Scale rudder input
        }
        
        // Calculate roll from aileron input and current turn rate
        // Simplified: roll proportional to aileron input
        this.roll = this.aileron * 0.5; // Scale aileron input
        
        // Limit angles
        this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch)); // +/- 90 degrees
        this.roll = Math.max(-Math.PI/4, Math.min(Math.PI/4, this.roll));   // +/- 45 degrees
        
        // Update HPR
        this.hpr = new HeadingPitchRoll(this.heading, this.pitch, this.roll);
        
        // Update entity orientation
        if (this.entity) {
            this.entity.orientation = this.hpr;
        }
    }
    
    getForwardVector() {
        // Get the forward vector based on current heading and pitch
        // In the local north-east-down frame:
        // x = cos(pitch) * sin(heading)
        // y = cos(pitch) * cos(heading) 
        // z = sin(pitch)
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        const cosHeading = Math.cos(this.heading);
        const sinHeading = Math.sin(this.heading);
        
        return new Cartesian3(
            cosPitch * sinHeading,
            cosPitch * cosHeading,
            sinPitch
        );
    }
    
    getUpVector() {
        // Get the up vector based on current orientation
        // Simplified: in local north-east-down frame, up is negative z
        // But adjusted for pitch and roll
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        const cosRoll = Math.cos(this.roll);
        const sinRoll = Math.sin(this.roll);
        const cosHeading = Math.cos(this.heading);
        const sinHeading = Math.sin(this.heading);
        
        // This is a simplified approximation
        return new Cartesian3(
            sinPitch * sinHeading,
            -sinPitch * cosHeading,
            cosPitch
        );
    }
    
    calculateLift() {
        // Simplified lift calculation
        // Lift = 0.5 * rho * v^2 * S * CL
        // where rho = air density, v = velocity, S = wing area, CL = lift coefficient
        
        const airSpeedSquared = Cartesian3.magnitude(this.velocity) * Cartesian3.magnitude(this.velocity);
        const airDensity = 1.225 * Math.exp(-this.altitude / 8500); // Approximate density decrease with altitude
        const wingArea = 16.2; // m^2 - typical for small aircraft
        
        const liftCoefficient = this.liftCoefficient * (1 + this.elevator * 0.5); // Adjust for elevator
        
        return 0.5 * airDensity * airSpeedSquared * wingArea * liftCoefficient;
    }
    
    updateInstrumentation() {
        // Update instrumentation display (could update HTML elements)
        // For now, just update the entity label with speed and altitude
        if (this.entity && this.entity.label) {
            const speedKnots = this.airspeed * 1.94384; // m/s to knots
            const altitudeFeet = this.altitude * 3.28084; // meters to feet
            
            this.entity.label.text = `Aircraft\n${speedKnots.toFixed(0)} kts\n${altitudeFeet.toFixed(0)} ft`;
        }
    }
    
    // Public methods for setting controls (called from input handlers)
    setThrottle(value) {
        this.throttle = Math.max(0, Math.min(1, value));
    }
    
    setElevator(value) {
        this.elevator = Math.max(-1, Math.min(1, value));
    }
    
    setRudder(value) {
        this.rudder = Math.max(-1, Math.min(1, value));
    }
    
    setAileron(value) {
        this.aileron = Math.max(-1, Math.min(1, value));
    }
}

// Helper classes for cleaner code (simplified versions)
class HeadingPitchRoll {
    constructor(heading, pitch, roll) {
        this.heading = heading;
        this.pitch = pitch;
        this.roll = roll;
    }
}

class Cartesian3 {
    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }
    
    static fromDegrees(longitude, latitude, height) {
        // Simplified conversion - in reality this uses ellipsoid math
        const RE = 6378137.0; // Earth radius in meters
        const latRad = latitude * Math.PI / 180;
        const lonRad = longitude * Math.PI / 180;
        
        const x = (RE + height) * Math.cos(latRad) * Math.cos(lonRad);
        const y = (RE + height) * Math.cos(latRad) * Math.sin(lonRad);
        const z = (RE + height) * Math.sin(latRad);
        
        return new Cartesian3(x, y, z);
    }
    
    static multiplyByScalar(v, scalar, result) {
        result.x = v.x * scalar;
        result.y = v.y * scalar;
        result.z = v.z * scalar;
        return result;
    }
    
    static add(left, right, result) {
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        return result;
    }
    
    static subtract(left, right, result) {
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        return result;
    }
    
    static negate(v, result) {
        result.x = -v.x;
        result.y = -v.y;
        result.z = -v.z;
        return result;
    }
    
    static normalize(v, result) {
        const magnitude = Cartesian3.magnitude(v);
        if (magnitude > 0) {
            result.x = v.x / magnitude;
            result.y = v.y / magnitude;
            result.z = v.z / magnitude;
        } else {
            result.x = 0;
            result.y = 0;
            result.z = 0;
        }
        return result;
    }
    
    static magnitude(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }
    
    static dot(left, right) {
        return left.x * right.x + left.y * right.y + left.z * right.z;
    }
    
    static cross(left, right, result) {
        result.x = left.y * right.z - left.z * right.y;
        result.y = left.z * right.x - left.x * right.z;
        result.z = left.x * right.y - left.y * right.x;
        return result;
    }
}

class VelocityOrientationProperty {
    constructor(velocity) {
        this.velocity = velocity;
    }
    
    getValue(time, result) {
        // In a real implementation, this would calculate orientation from velocity
        // For now, return identity
        if (!result) {
            return new HeadingPitchRoll(0, 0, 0);
        }
        result.heading = 0;
        result.pitch = 0;
        result.roll = 0;
        return result;
    }
}

// Mock Cesium classes for when we're not actually using Cesium
// In the real implementation, these would come from the Cesium library
if (typeof Cesium === 'undefined') {
    window.Cesium = {
        Cartesian3: Cartesian3,
        HeadingPitchRoll: HeadingPitchRoll,
        VelocityOrientationProperty: VelocityOrientationProperty,
        Color: {
            YELLOW: {r: 1, g: 1, b: 0}
        },
        LabelStyle: {
            FILL_AND_OUTLINE: 0
        },
        VerticalOrigin: {
            BOTTOM: 0
        },
        Cartesian2: function(x, y) {
            this.x = x;
            this.y = y;
        }
    };
}
