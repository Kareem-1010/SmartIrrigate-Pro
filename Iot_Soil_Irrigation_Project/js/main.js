// Main application JavaScript
// Coordinates all modules and handles general UI interactions

class SmartIrrigateApp {
    constructor() {
        this.initialized = false;
        this.init();
    }
    
    init() {
        console.log('Initializing SmartIrrigate Pro Application...');
        
        // Wait for all modules to load
        this.waitForDependencies().then(() => {
            this.setupEventListeners();
            this.startPeriodicUpdates();
            this.initialized = true;
            console.log('SmartIrrigate Pro Application ready!');
        });
    }
    
    async waitForDependencies() {
        // Wait for all required modules to be loaded
        return new Promise((resolve) => {
            const checkDependencies = setInterval(() => {
                if (typeof Chart !== 'undefined' && 
                    typeof CONFIG !== 'undefined' &&
                    document.getElementById('moistureGauge')) {
                    clearInterval(checkDependencies);
                    resolve();
                }
            }, 100);
        });
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle visibility change (pause updates when tab is hidden)
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup tooltips (if any)
        this.setupTooltips();
    }
    
    handleResize() {
        // Handle responsive adjustments
        if (window.innerWidth < 768) {
            console.log('Mobile view active');
        } else if (window.innerWidth < 1024) {
            console.log('Tablet view active');
        } else {
            console.log('Desktop view active');
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Tab hidden - reducing update frequency');
            // Could reduce update frequency here to save resources
        } else {
            console.log('Tab visible - resuming normal updates');
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + D - Toggle demo mode
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDemoMode();
            }
            
            // Ctrl + R - Refresh data
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
        });
    }
    
    setupTooltips() {
        // Add tooltips to sensor cards
        const tooltips = {
            'moisture': 'Measures soil water content using capacitive sensor',
            'temperature': 'Ambient temperature from DHT11 sensor',
            'humidity': 'Relative humidity from DHT11 sensor',
            'ml': 'AI-powered prediction based on current conditions'
        };
        
        // This is a placeholder - you can implement a tooltip library if needed
        console.log('Tooltips configured:', tooltips);
    }
    
    refreshData() {
        console.log('🔄 Refreshing data...');
        
        if (window.esp32Connection) {
            window.esp32Connection.fetchSensorData();
            window.esp32Connection.fetchMLPrediction();
            this.showNotification('Data refreshed', 'success');
        }
    }
    
    startPeriodicUpdates() {
        // Log system status periodically
        setInterval(() => {
            const status = {
                connected: window.esp32Connection?.isConnected,
                gaugesActive: typeof moistureGauge !== 'undefined',
                chartActive: typeof historicalChart !== 'undefined',
                particlesActive: typeof particleSystem !== 'undefined'
            };
            
            console.log('📊 System status:', status);
        }, 60000); // Every minute
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    box-shadow: 0 8px 32px var(--glass-shadow);
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--text-primary);
                }
                .notification-success {
                    border-left: 4px solid var(--success);
                }
                .notification-info {
                    border-left: 4px solid var(--primary);
                }
                .notification-warning {
                    border-left: 4px solid var(--warning);
                }
                .notification-error {
                    border-left: 4px solid var(--danger);
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // Utility functions
    formatTimestamp(date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    // Export data function (for future use)
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            sensors: window.esp32Connection?.sensorData,
            prediction: window.esp32Connection?.mlPrediction
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `irrigation-data-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully', 'success');
    }
}

// Initialize application
let app;

function initApp() {
    app = new SmartIrrigateApp();
    
    // Make app globally accessible for debugging
    window.app = app;
    
    // Add export data button functionality (if you want to add this feature)
    // You can add a button in the HTML and uncomment this:
    /*
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => app.exportData());
    }
    */
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Add global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (app) {
        app.showNotification('An error occurred. Check console for details.', 'error');
    }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (app) {
        app.showNotification('A network error occurred.', 'error');
    }
});

// Performance monitoring
if ('performance' in window && 'measure' in window.performance) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load performance:', {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
        });
    });
}

console.log('%c SmartIrrigate Pro ', 'background: linear-gradient(90deg, #00f2fe, #7b2ff7); color: white; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c IoT Soil Irrigation System with ML Intelligence ', 'color: #00f2fe; font-size: 14px;');
console.log('%c Developed with ❤️ for sustainable agriculture ', 'color: #a0aec0; font-size: 12px;');
