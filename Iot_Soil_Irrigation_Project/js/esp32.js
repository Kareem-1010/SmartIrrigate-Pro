// ESP32 Communication Module
// Handles WebSocket and HTTP communication with ESP32

class ESP32Connection {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.sensorData = {
            moisture: 0,
            temperature: 0,
            humidity: 0,
            timestamp: new Date()
        };
        this.mlPrediction = {
            waterAmount: 0,
            duration: 0,
            confidence: 0
        };
        
        // Check if running on GitHub Pages (demo mode)
        if (CONFIG.DEMO_MODE) {
            console.log('🌐 Running on GitHub Pages - Demo Mode Enabled');
            console.log('📊 Displaying simulated data for showcase');
            this.startDemoMode();
        } else {
            // Use HTTP API directly for local ESP32 connection
            console.log('🌱 Connecting to ESP32 via HTTP API at', CONFIG.ESP32_IP);
            this.startHTTPPolling();
        }
    }
    
    // Demo mode for GitHub Pages deployment
    startDemoMode() {
        console.log('🎭 Demo mode active - Generating realistic simulated data');
        this.isConnected = true;
        this.updateConnectionStatus(true);
        
        // Initial values
        this.demoData = {
            moisture: 45,
            temperature: 24,
            humidity: 65,
            waterAmount: 38
        };
        
        // Generate initial data
        this.generateDemoData();
        
        // Update every 2 seconds with slight variations
        setInterval(() => {
            this.generateDemoData();
        }, 2000);
    }
    
    generateDemoData() {
        // Add realistic variations to simulate real sensor readings
        this.demoData.moisture += (Math.random() - 0.5) * 2;
        this.demoData.temperature += (Math.random() - 0.5) * 0.5;
        this.demoData.humidity += (Math.random() - 0.5) * 1;
        this.demoData.waterAmount += (Math.random() - 0.5) * 1;
        
        // Keep within realistic bounds
        this.demoData.moisture = Math.max(30, Math.min(70, this.demoData.moisture));
        this.demoData.temperature = Math.max(20, Math.min(30, this.demoData.temperature));
        this.demoData.humidity = Math.max(50, Math.min(80, this.demoData.humidity));
        this.demoData.waterAmount = Math.max(20, Math.min(60, this.demoData.waterAmount));
        
        // Simulate sensor data
        const sensorData = {
            moisture: this.demoData.moisture,
            temperature: this.demoData.temperature,
            humidity: this.demoData.humidity,
            timestamp: Date.now()
        };
        
        // Simulate ML prediction (based on moisture level)
        const mlPrediction = {
            waterAmount: this.demoData.waterAmount,
            duration: this.demoData.waterAmount / 10,
            confidence: 92 + (Math.random() * 6) // 92-98%
        };
        
        this.handleSensorData(sensorData);
        this.handleMLPrediction(mlPrediction);
    }
    
    // WebSocket connection
    connect() {
        try {
            const wsUrl = `ws://${CONFIG.ESP32_IP}:${CONFIG.WEBSOCKET_PORT}`;
            console.log('Connecting to ESP32 at:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected to ESP32');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleSensorData(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };
            
        } catch (error) {
            console.error('Failed to connect to ESP32:', error);
            this.updateConnectionStatus(false);
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), CONFIG.WEBSOCKET_RECONNECT_INTERVAL);
        } else {
            console.warn('Max WebSocket reconnection attempts reached. Switching to HTTP API polling.');
            this.startHTTPPolling();
        }
    }
    
    // Start HTTP polling as fallback when WebSocket fails
    startHTTPPolling() {
        console.log('Starting HTTP API polling mode...');
        this.isConnected = true; // Mark as connected for HTTP mode
        this.updateConnectionStatus(true);
        
        // Fetch data immediately
        this.fetchSensorData();
        this.fetchMLPrediction();
        
        // Set up periodic polling
        setInterval(() => {
            this.fetchSensorData();
        }, CONFIG.SENSOR_UPDATE_INTERVAL);
        
        setInterval(() => {
            this.fetchMLPrediction();
        }, CONFIG.SENSOR_UPDATE_INTERVAL);
    }
    
    // HTTP API methods
    async fetchSensorData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SENSOR_DATA}`);
            if (response.ok) {
                const data = await response.json();
                this.handleSensorData(data);
            }
        } catch (error) {
            console.error('Error fetching sensor data:', error);
        }
    }
    
    async fetchMLPrediction() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.ML_PREDICTION}`);
            if (response.ok) {
                const data = await response.json();
                this.handleMLPrediction(data);
            }
        } catch (error) {
            console.error('Error fetching ML prediction:', error);
        }
    }
    
    // Water control removed - Display only mode
    // Physical pump is not functional, showing recommendations only
    
    async fetchSystemStatus() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SYSTEM_STATUS}`);
            if (response.ok) {
                const data = await response.json();
                this.updateSystemStatus(data);
            }
        } catch (error) {
            console.error('Error fetching system status:', error);
        }
    }
    
    // Data handlers
    handleSensorData(data) {
        this.sensorData = {
            moisture: parseFloat(data.moisture) || 0,
            temperature: parseFloat(data.temperature) || 0,
            humidity: parseFloat(data.humidity) || 0,
            timestamp: new Date()
        };
        
        // Update UI
        updateGauges(this.sensorData);
        addDataPoint(this.sensorData);
        
        // ML prediction is fetched separately from ESP32, not calculated here
    }
    
    handleMLPrediction(data) {
        // Use the REAL TensorFlow Lite prediction from ESP32
        this.mlPrediction = {
            waterAmount: parseFloat(data.waterAmount) || 0,
            duration: parseFloat(data.duration) || 0,
            confidence: parseFloat(data.confidence) || 0
        };
        
        console.log('🧠 TensorFlow Lite Prediction:', this.mlPrediction);
        this.updateMLDisplay();
    }
    
    updateMLDisplay() {
        document.getElementById('waterAmount').textContent = 
            this.mlPrediction.waterAmount.toFixed(0);
        document.getElementById('waterDuration').textContent = 
            `${this.mlPrediction.duration.toFixed(1)}s`;
        document.getElementById('mlConfidence').textContent = 
            `${this.mlPrediction.confidence.toFixed(1)}%`;
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (connected) {
            statusDot.style.background = '#00ff88';
            statusText.textContent = 'Connected';
        } else {
            statusDot.style.background = '#ff0055';
            statusText.textContent = 'Disconnected';
        }
    }
    
    updateSystemStatus(data) {
        // Update system status indicators
        // This can be expanded based on your ESP32 response
        console.log('System status:', data);
    }
    
}

// Initialize ESP32 connection
let esp32Connection;

function initESP32() {
    esp32Connection = new ESP32Connection();
    
    // Display-only mode - No pump control
    // Just show the recommendations, no activation button needed
    console.log('💧 System initialized in display-only mode');
    console.log('📊 Water recommendations will be shown without pump activation');
    
    // Periodic status check every 10 seconds
    setInterval(() => {
        esp32Connection.fetchSystemStatus();
    }, 10000);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initESP32);
} else {
    initESP32();
}

// Export for global access
window.esp32Connection = esp32Connection;
