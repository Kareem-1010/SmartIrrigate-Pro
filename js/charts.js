// Historical data chart using Chart.js

let historicalChart = null;
let chartData = {
    labels: [],
    moisture: [],
    temperature: [],
    humidity: []
};

const MAX_DATA_POINTS = 50;

function initializeChart() {
    const ctx = document.getElementById('historicalChart');
    if (!ctx) return;
    
    historicalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Soil Moisture (%)',
                    data: chartData.moisture,
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0, 242, 254, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#00f2fe',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Temperature (°C)',
                    data: chartData.temperature,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#ff6b6b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Humidity (%)',
                    data: chartData.humidity,
                    borderColor: '#7b2ff7',
                    backgroundColor: 'rgba(123, 47, 247, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#7b2ff7',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#a0aec0',
                        font: {
                            family: 'Rajdhani',
                            size: 14,
                            weight: '600'
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#00f2fe',
                    bodyColor: '#fff',
                    borderColor: '#00f2fe',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return 'Time: ' + context[0].label;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(1);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            family: 'Rajdhani',
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            family: 'Rajdhani',
                            size: 12
                        },
                        callback: function(value) {
                            return value.toFixed(0);
                        }
                    },
                    min: 0,
                    max: 100
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function addDataPoint(data) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Add new data
    chartData.labels.push(timeLabel);
    chartData.moisture.push(data.moisture || 0);
    chartData.temperature.push(data.temperature || 0);
    chartData.humidity.push(data.humidity || 0);
    
    // Remove old data if exceeds max points
    if (chartData.labels.length > MAX_DATA_POINTS) {
        chartData.labels.shift();
        chartData.moisture.shift();
        chartData.temperature.shift();
        chartData.humidity.shift();
    }
    
    // Update chart
    if (historicalChart) {
        historicalChart.update('none'); // Update without animation for smoother experience
    }
}

function updateChartRange(range) {
    // This function can be expanded to filter data based on time range
    console.log('Chart range updated to:', range);
    
    // Reset chart animation
    if (historicalChart) {
        historicalChart.update();
    }
}

// Chart control buttons
function setupChartControls() {
    const chartButtons = document.querySelectorAll('.chart-btn');
    
    chartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            chartButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update chart range
            const range = this.getAttribute('data-range');
            updateChartRange(range);
        });
    });
}

// Initialize chart and controls
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeChart();
        setupChartControls();
    });
} else {
    initializeChart();
    setupChartControls();
}

// Export functions
window.addDataPoint = addDataPoint;
window.updateChartRange = updateChartRange;
