// UI module for the flight simulator menu system

/**
 * Initialize the menu system
 */
function initMenu() {
    // The menu initialization is now handled in app.js
    // This file can be used for additional UI functionality if needed
    
    // Example: Add keyboard controls for flight
    document.addEventListener('keydown', function(event) {
        // Only process keys when flying
        if (!window.isFlying) return;
        
        switch(event.key.toLowerCase()) {
            case 'w': // Increase throttle
                if (window.plane) window.plane.setThrottle(Math.min(1, window.plane.throttle + 0.1));
                break;
            case 's': // Decrease throttle
                if (window.plane) window.plane.setThrottle(Math.max(0, window.plane.throttle - 0.1));
                break;
            case 'arrowup': // Pitch up (pull back on stick)
                if (window.plane) window.plane.setElevator(Math.min(1, window.plane.elevator + 0.1));
                break;
            case 'arrowdown': // Pitch down (push forward on stick)
                if (window.plane) window.plane.setElevator(Math.max(-1, window.plane.elevator - 0.1));
                break;
            case 'arrowleft': // Yaw left (left rudder)
                if (window.plane) window.plane.setRudder(Math.max(-1, window.plane.rudder - 0.1));
                break;
            case 'arrowright': // Yaw right (right rudder)
                if (window.plane) window.plane.setRudder(Math.min(1, window.plane.rudder + 0.1));
                break;
            case 'a': // Roll left (aileron left)
                if (window.plane) window.plane.setAileron(Math.max(-1, window.plane.aileron - 0.1));
                break;
            case 'd': // Roll right (aileron right)
                if (window.plane) window.plane.setAileron(Math.min(1, window.plane.aileron + 0.1));
                break;
            case ' ': // Spacebar - neutral controls
                if (window.plane) {
                    window.plane.setElevator(0);
                    window.plane.setRudder(0);
                    window.plane.setAileron(0);
                }
                break;
        }
    });
    
    // Optional: Add touch controls for mobile devices
    setupTouchControls();
}

/**
 * Setup touch controls for mobile devices
 */
function setupTouchControls() {
    // This would implement on-screen joysticks or buttons for mobile
    // For now, we'll leave this as a placeholder
    console.log("Touch controls placeholder - implement as needed");
}

/**
 * Show a notification message on screen
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the message in seconds (optional)
 */
function showNotification(message, duration = 3) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.background = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1001';
    notification.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(notification);
    
    // Remove after duration
    setTimeout(() => {
        notification.remove();
    }, duration * 1000);
}

/**
 * Update the HUD (Heads-Up Display) with flight information
 * @param {Object} flightData - Object containing flight data to display
 */
function updateHUD(flightData) {
    let hud = document.getElementById('hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'hud';
        hud.style.position = 'fixed';
        hud.style.top = '10px';
        hud.style.left = '10px';
        hud.style.background = 'rgba(0, 0, 0, 0.7)';
        hud.style.color = 'white';
        hud.style.padding = '10px';
        hud.style.borderRadius = '5px';
        hud.style.fontFamily = 'Courier New, monospace';
        hud.style.fontSize = '14px';
        hud.style.lineHeight = '1.4';
        hud.style.zIndex = '1000';
        document.body.appendChild(hud);
    }
    
    // Format the HUD text
    const { airspeed, altitude, heading, verticalSpeed, throttle } = flightData || {};
    const speedKnots = airspeed ? (airspeed * 1.94384).toFixed(0) : '0';
    const altitudeFeet = altitude ? (altitude * 3.28084).toFixed(0) : '0';
    const headingDeg = heading ? ((heading * 180 / Math.PI) + 360) % 360 : '0';
    const vsFeetMin = verticalSpeed ? (verticalSpeed * 196.85).toFixed(0) : '0';
    const throttlePct = throttle !== undefined ? (throttle * 100).toFixed(0) : '0';
    
    hud.innerHTML = `
        Speed: ${speedKnots} kts<br>
        Altitude: ${altitudeFeet} ft<br>
        Heading: ${headingDeg}°<br>
        V/S: ${vsFeetMin} ft/min<br>
        Throttle: ${throttlePct}%
    `;
}

/**
 * Clear the HUD from the screen
 */
function clearHUD() {
    const hud = document.getElementById('hud');
    if (hud) {
        hud.remove();
    }
}

// Initialize the menu when the script loads
// Note: In our setup, this is called from app.js after DOMContentLoaded
// but we keep this here for potential standalone use
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
} else {
    initMenu();
}
- Thought: 14ms
