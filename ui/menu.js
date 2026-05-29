// UI module for the flight simulator - utility functions only

function setupTouchControls() {
    console.log("Touch controls placeholder - implement as needed");
}

function showNotification(message, duration = 3) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.background = 'rgba(0, 0, 0, 0.85)';
    notification.style.color = '#00ff00'; // Sleek green radar look
    notification.style.border = '1px solid #00ff00';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '3px';
    notification.style.zIndex = '1001';
    notification.style.fontFamily = 'monospace';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, duration * 1000);
}

function updateHUD(flightData) {
    let hud = document.getElementById('hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'hud';
        hud.style.position = 'fixed';
        hud.style.top = '20px';
        hud.style.left = '20px';
        hud.style.background = 'rgba(10, 15, 10, 0.75)';
        hud.style.color = '#33ff33'; // Crisp green cockpit HUD phosphor color
        hud.style.border = '1px solid rgba(51, 255, 51, 0.4)';
        hud.style.padding = '15px';
        hud.style.borderRadius = '4px';
        hud.style.fontFamily = 'Courier New, monospace';
        hud.style.fontSize = '14px';
        hud.style.fontWeight = 'bold';
        hud.style.lineHeight = '1.5';
        hud.style.zIndex = 1000;
        document.body.appendChild(hud);
    }
    
    const { airspeed, altitude, heading, verticalSpeed, throttle } = flightData || {};
    const speedKnots = airspeed ? (airspeed * 1.94384).toFixed(0) : '0';
    const altitudeFeet = altitude ? (altitude * 3.28084).toFixed(0) : '0';
    const headingDeg = heading ? (((heading * 180 / Math.PI) + 360) % 360).toFixed(0) : '0';
    const vsFeetMin = verticalSpeed ? (verticalSpeed * 196.85).toFixed(0) : '0';
    const throttlePct = throttle !== undefined ? (throttle * 100).toFixed(0) : '0';
    
    hud.innerHTML = `
        SYS OK // FLIGHT DATA<br>
        --------------------<br>
        SPEED:    ${speedKnots.padStart(3, ' ')} KTS<br>
        ALTITUDE: ${altitudeFeet.padStart(5, ' ')} FT<br>
        HEADING:  ${headingDeg.padStart(3, '0')}°<br>
        V/S:      ${vsFeetMin.padStart(5, ' ')} FT/MIN<br>
        THROTTLE: ${throttlePct.padStart(3, ' ')}%
    `;
}

function clearHUD() {
    const hud = document.getElementById('hud');
    if (hud) hud.remove();
}

window.ui = {
    showNotification: showNotification,
    updateHUD: updateHUD,
    clearHUD: clearHUD,
    setupTouchControls: setupTouchControls
};

// Continuous Input Tracking System
const activeKeys = {};

document.addEventListener('keydown', function(event) {
    if (!window.isFlying || !window.plane) return;
    
    const key = event.key.toLowerCase();
    activeKeys[key] = true;
    
    // Process single-toggle state inputs
    if (key === 'w') {
        window.plane.setThrottle(Math.min(1.0, window.plane.throttle + 0.05));
    }
    if (key === 's') {
        window.plane.setThrottle(Math.max(0.0, window.plane.throttle - 0.05));
    }
    
    updateFlightControlSurfaces();
});

document.addEventListener('keyup', function(event) {
    if (!window.isFlying || !window.plane) return;
    
    const key = event.key.toLowerCase();
    activeKeys[key] = false;
    
    updateFlightControlSurfaces();
});

// Map held keys continuously to flight surfaces
function updateFlightControlSurfaces() {
    if (!window.plane) return;

    // Elevators (Pitch UP / DOWN)
    if (activeKeys['arrowup']) {
        window.plane.setElevator(1.0); // Pull back on stick
    } else if (activeKeys['arrowdown']) {
        window.plane.setElevator(-1.0); // Push forward
    } else {
        window.plane.setElevator(0.0); // Center stick
    }

    // Ailerons (Roll LEFT / RIGHT)
    if (activeKeys['a'] || activeKeys['arrowleft']) {
        window.plane.setAileron(-1.0); 
    } else if (activeKeys['d'] || activeKeys['arrowright']) {
        window.plane.setAileron(1.0);
    } else {
        window.plane.setAileron(0.0);
    }

    // Rudders (Yaw LEFT / RIGHT)
    if (activeKeys['q']) {
        window.plane.setRudder(-1.0);
    } else if (activeKeys['e']) {
        window.plane.setRudder(1.0);
    } else {
        window.plane.setRudder(0.0);
    }
}
