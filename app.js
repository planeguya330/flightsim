let viewer;
let plane;
let isFlying = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeCesium();
    initMenu();
});

function initializeCesium() {
    try {
        // Shared community key setup fallback
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MjMyYTU1ZS1jNTk1LTRmYjgtYjc4Yy02YmRkOTY4ZTYzMjciLCJpZCI6NDM3NzMyLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODAwMjMxMTV9.hNZJ2HknGtszmRZXU8nevfa9BPqvQrToTcAAA2O6PBQ';
        
        viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: Cesium.createWorldTerrain ? Cesium.createWorldTerrain() : undefined,
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
        
        // Enable atmospheric lighting elements for sleek immersion look
        viewer.scene.globe.enableLighting = true;
        
        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-75.1635, 39.9526, 15000),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-20.0),
                roll: 0.0
            }
        });
        
        plane = new PlaneEntity(viewer);
    } catch (e) {
        console.error("Error initializing Cesium:", e);
    }
}

function startFlight(locationKey) {
    const airports = {
        kphl: { name: "Philadelphia International", lat: 39.8721, lng: -75.2408, elevation: 12 },
        kjor: { name: "Juan Santamaría International", lat: 9.9939, lng: -84.2088, elevation: 924 },
        kgcc: { name: "Gillette-Campbell County Airport", lat: 44.3489, lng: -105.5391, elevation: 436 },
        katl: { name: "Hartsfield-Jackson Atlanta International", lat: 33.6407, lng: -84.4277, elevation: 320 },
        klax: { name: "Los Angeles International", lat: 33.9416, lng: -118.4085, elevation: 39 }
    };
    
    const airport = airports[locationKey];
    if (!airport) return;
    
    document.getElementById('menuOverlay').style.display = 'none';
    
    // Spawn 150 meters up so we have plenty of gliding room right off the bat!
    plane.createAtLocation(airport.lat, airport.lng, airport.elevation + 150); 
    
    isFlying = true;
    
    // Hook straight into Cesium's internal render frame tick clock cycle
    viewer.scene.preUpdate.addEventListener(function(scene, time) {
        if (isFlying) {
            // Cesium ticks run ideally at 60 FPS (~0.016 seconds per frame step)
            const dt = scene.deltaTime; 
            if(dt > 0) {
                plane.update(dt);
                updateCamera();
            }
        }
    });
}

function updateCamera() {
    if (!plane.entity) return;
    
    const currentPosition = plane.entity.position.getValue(viewer.clock.currentTime);
    if (!currentPosition) return;
    
    // Smooth camera tracking using an offset relative to aircraft heading
    // Distance behind: 50m, height above: 15m
    const relativeOffset = new Cesium.Cartesian3(-50, 0, 15); 
    
    const hpr = new Cesium.HeadingPitchRoll(plane.heading, plane.pitch, 0); // Omit roll for standard flight cam stability
    const transformMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(currentPosition, hpr);
    
    const targetCamLocation = Cesium.Matrix4.multiplyByPoint(transformMatrix, relativeOffset, new Cesium.Cartesian3());
    
    viewer.camera.setView({
        destination: targetCamLocation,
        orientation: {
            direction: Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.subtract(currentPosition, targetCamLocation, new Cesium.Cartesian3()), 
                new Cesium.Cartesian3()
            ),
            up: Cesium.Matrix4.multiplyByPointAsVector(transformMatrix, new Cesium.Cartesian3(0, 0, 1), new Cesium.Cartesian3())
        }
    });
}
    
    const currentPosition = plane.entity.position.getValue(viewer.clock.currentTime);
    if (!currentPosition) return;
    
    // Position camera 60 meters back, 18 meters above local craft assignment positioning
    const localOffset = new Cesium.Cartesian3(-60, 0, 18); 
    
    const hpr = new Cesium.HeadingPitchRoll(plane.heading, plane.pitch, plane.roll);
    const localToWorldMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(currentPosition, hpr);
    
    const targetCameraPosition = Cesium.Matrix4.multiplyByPoint(localToWorldMatrix, localOffset, new Cesium.Cartesian3());
    
    viewer.camera.setView({
        destination: targetCameraPosition,
        orientation: {
            direction: Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.subtract(currentPosition, targetCameraPosition, new Cesium.Cartesian3()), 
                new Cesium.Cartesian3()
            ),
            up: Cesium.Matrix4.multiplyByPointAsVector(localToWorldMatrix, new Cesium.Cartesian3(0, 0, 1), new Cesium.Cartesian3())
        }
    });
}

function initMenu() {
    const startButton = document.getElementById('startButton');
    const spawnSelect = document.getElementById('spawnSelect');
    
    if (startButton && spawnSelect) {
        startButton.addEventListener('click', function() {
            startFlight(spawnSelect.value);
        });
    }
}
