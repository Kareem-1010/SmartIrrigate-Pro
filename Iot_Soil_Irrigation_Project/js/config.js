// Configuration for ESP32 connection
const CONFIG = {
    // Auto-detect GitHub Pages deployment
    IS_GITHUB_PAGES: window.location.hostname.includes('github.io'),
    
    // Demo mode for GitHub Pages (simulated data for showcase)
    DEMO_MODE: window.location.hostname.includes('github.io'),
    
    // Update this with your ESP32 IP address (for local network use)
    ESP32_IP: '10.147.31.163', // Your ESP32's IP
    
    // WebSocket configuration
    WEBSOCKET_PORT: 81,
    WEBSOCKET_RECONNECT_INTERVAL: 3000, // 3 seconds
    
    // HTTP endpoints (auto-switches to demo mode on GitHub Pages)
    API_BASE_URL: window.location.hostname.includes('github.io') ? '' : 'http://10.147.31.163',
    ENDPOINTS: {
        SENSOR_DATA: '/api/sensors',
        ML_PREDICTION: '/api/prediction',
        CONTROL_WATER: '/api/water',
        SYSTEM_STATUS: '/api/status'
    },
    
    // Update intervals (milliseconds)
    SENSOR_UPDATE_INTERVAL: 2000, // 2 seconds
    CHART_UPDATE_INTERVAL: 5000, // 5 seconds
    
    // Sensor thresholds
    THRESHOLDS: {
        MOISTURE: {
            LOW: 30,
            OPTIMAL_MIN: 40,
            OPTIMAL_MAX: 70,
            HIGH: 80
        },
        TEMPERATURE: {
            LOW: 15,
            OPTIMAL_MIN: 20,
            OPTIMAL_MAX: 30,
            HIGH: 35
        },
        HUMIDITY: {
            LOW: 30,
            OPTIMAL_MIN: 40,
            OPTIMAL_MAX: 70,
            HIGH: 80
        }
    }
};

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
