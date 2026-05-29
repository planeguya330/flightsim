const viewer = new Cesium.Viewer('cesiumContainer', {
    // Optionally, you can disable the base layer picker and other UI elements
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
    animation: false,
    // Use terrain if needed, but for flight simulation, we might want to disable it for simplicity
    terrainProvider: Cesium.createWorldTerrain()
});

// Replace 'YOUR_CESIUM_ION_TOKEN_HERE' with your actual Cesium Ion token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MjMyYTU1ZS1jNTk1LTRmYjgtYjc4Yy02YmRkOTY4ZTYzMjciLCJpZCI6NDM3NzMyLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODAwMjMxMTV9.hNZJ2HknGtszmRZXU8nevfa9BPqvQrToTcAAA2O6PBQ';

// Set the initial view (example: over Philadelphia)
viewer.camera.setView({
    destination : Cesium.Cartesian3.fromDegrees(-75.1635, 39.9526, 5000),
    orientation : {
        heading : Cesium.Math.toRadians(0.0), // east, default value is 0.0 (north)
        pitch   : Cesium.Math.toRadians(-35.0), // default value (looking down)
        roll    : 0.0
    }
});

// Add the aircraft model (replace 'path/to/your/plane.gltf' with the actual path to your 3D model)
const planeEntity = viewer.entities.add({
    name : 'Aircraft',
    position : Cesium.Cartesian3.fromDegrees(-75.1635, 39.9526, 1000), // Initial position at 1000m altitude
    orientation : new Cesium.VelocityOrientationProperty(Cesium.Math.PI_OVER_TWO), // Face direction of movement
    model : {
        uri : 'path/to/your/plane.gltf', // Replace with your model's URI
        minimumPixelSize : 128,
        maximumScale : 200,
        // Optional: scale the model if needed
        scale : 1.0
    }
});

// Optional: Add a track to follow the plane
viewer.trackedEntity = planeEntity;

// Example: Simple animation loop to move the plane (for demonstration)
let time = 0;
viewer.clock.onTick.addEventListener(function(clock) {
    // Circular motion for demonstration purposes
    const radius = 0.1; // degrees
    const speed = 0.0001; // radians per second
    time += clock._delta * speed;

    const longitude = -75.1635 + radius * Math.cos(time);
    const latitude  = 39.9526 + radius * Math.sin(time);
    const altitude  = 1000 + 50 * Math.sin(time * 2); // slight altitude variation

    planeEntity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);

    // Optional: update orientation to face direction of movement
    const position = planeEntity.position.getValue(clock.currentTime);
    if (position) {
        const nextPosition = Cesium.Cartesian3.fromDegrees(
            longitude + 0.0001 * Math.cos(time),
            latitude  + 0.0001 * Math.sin(time),
            altitude
        );
        const orientation = Cesium.HeadingPitchRoll.fromDirection(position, nextPosition, viewer.scene.globe.ellipsoid);
        planeEntity.orientation = new Cesium.HeadingPitchRoll(orientation.heading, orientation.pitch, orientation.roll);
    }
});
