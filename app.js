// Main application file for the flight simulator

// Initialize Cesium viewer
let viewer;
let plane;
let isFlying = false;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Cesium
    initializeCesium();
    
    // Initialize UI
    initMenu();
});

// Initialize Cesium viewer
function initializeCesium() {
    try {
        // IMPORTANT: Replace this with your actual Cesium Ion token
        // Get a free token at https://cesium.com/ion/
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MjMyYTU1ZS1jNTk1LTRmYjgtYjc4Yy02YmRkOTY4ZTYzMjciLCJpZCI6NDM3NzMyLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODAwMjMxMTV9.hNZJ2HknGtszmRZXU8nevfa9BPqvQrToTcAAA2O6PBQ';
        
        // Create the viewer with basic terrain
        // Try to use CesiumWorldTerrain, fallback to undefined (ellipsoid) if not available
        let terrainProvider;
        if (Cesium.CesiumWorldTerrain) {
            terrainProvider = Cesium.CesiumWorldTerrain;
        } else {
            // Fallback to no terrain provider (ellipsoid)
            terrainProvider = undefined;
            console.warn('CesiumWorldTerrain not available, using ellipsoid terrain');
        }
        viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: terrainProvider,
            // Disable unnecessary UI elements for cleaner interface
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            navigationHelpButton: false,
            animation: false
        });
        
        // Set initial camera view
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-75.1635, 39.9526, 15000),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-20.0),
                roll: 0.0
            }
        });
        
        // Create the plane entity (will be replaced when flight starts)
        plane = new PlaneEntity(viewer);
    } catch (e) {
        console.error("Error initializing Cesium:", e);
        // Even if Cesium fails to initialize, we still want the UI to work
        // so we'll create a mock viewer and plane object
        viewer = {
            camera: {
                setView: function() {}
            },
            entities: {
                add: function() { return null; },
                remove: function() {}
            }
        };
        plane = new PlaneEntity(viewer);
    }
}

// Start the flight at the selected location
function startFlight(locationKey) {
    // Define airport locations (ICAO codes with lat, lng, elevation)
    const airports = {
        kphl: { name: "Philadelphia International", lat: 39.8721, lng: -75.2408, elevation: 12 },
        kjor: { name: "Juan Santamaría International", lat: 9.9939, lng: -84.2088, elevation: 924 },
        kgcc: { name: "Gillette-Campbell County Airport", lat: 44.3489, lng: -105.5391, elevation: 436 },
        katl: { name: "Hartsfield-Jackson Atlanta International", lat: 33.6407, lng: -84.4277, elevation: 320 },
        klax: { name: "Los Angeles International", lat: 33.9416, lng: -118.4085, elevation: 39 }
    };
    
    const airport = airports[locationKey];
    if (!airport) {
        console.error("Unknown airport:", locationKey);
        return;
    }
    
    // Hide the menu
    document.getElementById('menuOverlay').style.display = 'none';
    
    // Create the plane at the selected airport
    plane.createAtLocation(airport.lat, airport.lng, airport.elevation + 50); // 50m above ground
    
    // Start the flight simulation
    isFlying = true;
    startFlightLoop();
}

// Main flight simulation loop
function flightLoop(time) {
    if (!isFlying) return;
    
    // Update plane physics
    plane.update(time);
    
    // Update camera to follow plane
    updateCamera();
    
    // Request next frame
    requestAnimationFrame(flightLoop);
}

function startFlightLoop() {
    // Start the animation loop
    requestAnimationFrame(flightLoop);
}

// Update camera to follow the plane
function updateCamera() {
    if (!plane.entity || !plane.entity.position) return;
    
    const position = plane.entity.position.getValue(viewer.clock.currentTime);
    if (!position) return;
    
    // Position camera behind and slightly above the plane
    const offset = new Cesium.Cartesian3(-50, 0, 30); // 50m behind, 30m above
    const offsetInWorld = Cesium.Matrix3.multiplyByVector(
        Cesium.Transforms.headingPitchRollToFixedFrame(position, plane.hpr),
        offset,
        new Cesium.Cartesian3()
    );
    
    const cameraPosition = Cesium.Cartesian3.add(position, offsetInWorld, new Cesium.Cartesian3());
    
    // Set camera position and orientation to look at the plane
    viewer.camera.setView({
        destination: cameraPosition,
        orientation: {
            direction: Cesium.Cartesian3.negate(offsetInWorld, new Cesium.Cartesian3()),
            up: Cesium.Cartesian3.UNIT_Z
        }
    });
}

// Initialize the menu system
function initMenu() {
    const startButton = document.getElementById('startButton');
    const spawnSelect = document.getElementById('spawnSelect');
    
    // Add error checking to see if elements are found
    if (!startButton) {
        console.error("Start button not found!");
        return;
    }
    if (!spawnSelect) {
        console.error("Spawn select not found!");
        return;
    }
    
    startButton.addEventListener('click', function() {
        const selectedLocation = spawnSelect.value;
        startFlight(selectedLocation);
    });
    
    // Also add a console log to verify the listener is attached
    console.log("Menu initialized, click listener attached to start button");
}
