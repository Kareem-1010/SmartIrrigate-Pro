// Gauge rendering for sensor cards

class Gauge {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.value = 0;
        this.targetValue = 0;
        
        // Options
        this.minValue = options.minValue || 0;
        this.maxValue = options.maxValue || 100;
        this.unit = options.unit || '%';
        this.color = options.color || '#00f2fe';
        this.label = options.label || '';
        
        // Set canvas size
        this.canvas.width = 200;
        this.canvas.height = 200;
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = 70;
        
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background arc
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0.75 * Math.PI, 2.25 * Math.PI);
        ctx.lineWidth = 15;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Value arc
        const percentage = (this.value - this.minValue) / (this.maxValue - this.minValue);
        const endAngle = 0.75 * Math.PI + (percentage * 1.5 * Math.PI);
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.getSecondaryColor());
        
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0.75 * Math.PI, endAngle);
        ctx.lineWidth = 15;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw tick marks
        this.drawTickMarks();
    }
    
    drawTickMarks() {
        const ctx = this.ctx;
        const tickCount = 10;
        
        for (let i = 0; i <= tickCount; i++) {
            const angle = 0.75 * Math.PI + (i / tickCount) * 1.5 * Math.PI;
            const innerRadius = this.radius - 20;
            const outerRadius = this.radius - 10;
            
            const x1 = this.centerX + innerRadius * Math.cos(angle);
            const y1 = this.centerY + innerRadius * Math.sin(angle);
            const x2 = this.centerX + outerRadius * Math.cos(angle);
            const y2 = this.centerY + outerRadius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();
        }
    }
    
    getSecondaryColor() {
        const colors = {
            '#00f2fe': '#7b2ff7',
            '#ff6b6b': '#ff0055',
            '#7b2ff7': '#f72585',
            '#00ff88': '#00f2fe'
        };
        return colors[this.color] || '#7b2ff7';
    }
    
    setValue(value) {
        this.targetValue = Math.max(this.minValue, Math.min(this.maxValue, value));
        this.animateToValue();
    }
    
    animateToValue() {
        const diff = this.targetValue - this.value;
        const step = diff / 20;
        
        const animate = () => {
            if (Math.abs(this.targetValue - this.value) > 0.5) {
                this.value += step;
                this.draw();
                requestAnimationFrame(animate);
            } else {
                this.value = this.targetValue;
                this.draw();
            }
        };
        
        animate();
    }
}

// Initialize gauges
let moistureGauge, tempGauge, humidityGauge;

function initializeGauges() {
    moistureGauge = new Gauge('moistureGauge', {
        minValue: 0,
        maxValue: 100,
        color: '#00f2fe',
        label: 'Moisture'
    });
    
    tempGauge = new Gauge('tempGauge', {
        minValue: 0,
        maxValue: 50,
        color: '#ff6b6b',
        label: 'Temperature'
    });
    
    humidityGauge = new Gauge('humidityGauge', {
        minValue: 0,
        maxValue: 100,
        color: '#7b2ff7',
        label: 'Humidity'
    });
}

// Update gauge values
function updateGauges(data) {
    if (moistureGauge && data.moisture !== undefined) {
        moistureGauge.setValue(data.moisture);
        document.getElementById('moistureValue').textContent = data.moisture.toFixed(1);
        updateMoistureStatus(data.moisture);
    }
    
    if (tempGauge && data.temperature !== undefined) {
        tempGauge.setValue(data.temperature);
        document.getElementById('tempValue').textContent = data.temperature.toFixed(1);
        updateTempStatus(data.temperature);
    }
    
    if (humidityGauge && data.humidity !== undefined) {
        humidityGauge.setValue(data.humidity);
        document.getElementById('humidityValue').textContent = data.humidity.toFixed(1);
        updateHumidityStatus(data.humidity);
    }
    
    // Update timestamps
    const now = new Date().toLocaleTimeString();
    document.getElementById('moistureTime').textContent = now;
    document.getElementById('tempTime').textContent = now;
    document.getElementById('humidityTime').textContent = now;
}

function updateMoistureStatus(value) {
    const statusEl = document.getElementById('moistureStatus');
    const thresholds = CONFIG.THRESHOLDS.MOISTURE;
    
    if (value < thresholds.LOW) {
        statusEl.textContent = 'Very Dry';
        statusEl.style.color = '#ff0055';
    } else if (value < thresholds.OPTIMAL_MIN) {
        statusEl.textContent = 'Dry';
        statusEl.style.color = '#ffb600';
    } else if (value <= thresholds.OPTIMAL_MAX) {
        statusEl.textContent = 'Optimal';
        statusEl.style.color = '#00ff88';
    } else if (value <= thresholds.HIGH) {
        statusEl.textContent = 'Wet';
        statusEl.style.color = '#00f2fe';
    } else {
        statusEl.textContent = 'Very Wet';
        statusEl.style.color = '#7b2ff7';
    }
}

function updateTempStatus(value) {
    const statusEl = document.getElementById('tempStatus');
    const thresholds = CONFIG.THRESHOLDS.TEMPERATURE;
    
    if (value < thresholds.LOW) {
        statusEl.textContent = 'Cold';
        statusEl.style.color = '#00f2fe';
    } else if (value < thresholds.OPTIMAL_MIN) {
        statusEl.textContent = 'Cool';
        statusEl.style.color = '#7b2ff7';
    } else if (value <= thresholds.OPTIMAL_MAX) {
        statusEl.textContent = 'Normal';
        statusEl.style.color = '#00ff88';
    } else if (value <= thresholds.HIGH) {
        statusEl.textContent = 'Warm';
        statusEl.style.color = '#ffb600';
    } else {
        statusEl.textContent = 'Hot';
        statusEl.style.color = '#ff0055';
    }
}

function updateHumidityStatus(value) {
    const statusEl = document.getElementById('humidityStatus');
    const thresholds = CONFIG.THRESHOLDS.HUMIDITY;
    
    if (value < thresholds.LOW) {
        statusEl.textContent = 'Very Low';
        statusEl.style.color = '#ff0055';
    } else if (value < thresholds.OPTIMAL_MIN) {
        statusEl.textContent = 'Low';
        statusEl.style.color = '#ffb600';
    } else if (value <= thresholds.OPTIMAL_MAX) {
        statusEl.textContent = 'Good';
        statusEl.style.color = '#00ff88';
    } else if (value <= thresholds.HIGH) {
        statusEl.textContent = 'High';
        statusEl.style.color = '#00f2fe';
    } else {
        statusEl.textContent = 'Very High';
        statusEl.style.color = '#7b2ff7';
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGauges);
} else {
    initializeGauges();
}
