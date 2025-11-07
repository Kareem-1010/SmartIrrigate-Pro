/********************************************************************************
 * Smart Irrigation System - ESP32
 * UART moisture + DHT11 + TensorFlow Lite + Web Dashboard
 ********************************************************************************/

#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include "tflite_handler.h"

// ================== WiFi ==================
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ================== DHT ==================
#define DHTPIN  4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ================== UART ==================
#define RX_PIN 16   // NodeMCU TX → ESP32 RX
#define TX_PIN 17
HardwareSerial soilUART(2);

// ================== Variables ==================
float humidity = 0;
float temperature = 0;
float moisturePercent = 0;
float predictedWater = 0;

unsigned long lastDHT = 0;
unsigned long lastML  = 0;
unsigned long lastUART = 0;

WebServer server(80);

// ================== HTML ==================
const char* htmlPage = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SmartIrrigate Pro - Redirecting...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      background: linear-gradient(135deg, #0a0e27 0%, #1a1e3f 100%);
      color: #fff; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      overflow: hidden;
    }
    .container {
      text-align: center;
      max-width: 600px;
      padding: 40px;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      border: 1px solid rgba(0,242,254,0.3);
      box-shadow: 0 8px 32px rgba(0,242,254,0.2);
      backdrop-filter: blur(10px);
    }
    .logo {
      font-size: 80px;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }
    h1 { 
      color: #00f2fe; 
      text-shadow: 0 0 20px rgba(0,242,254,0.5);
      margin: 20px 0;
      font-size: 2em;
    }
    .status {
      color: #4ade80;
      font-size: 1.2em;
      margin: 20px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #00f2fe;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
    }
    .info {
      background: rgba(0,242,254,0.1);
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      border-left: 4px solid #00f2fe;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .data-row:last-child { border-bottom: none; }
    .label { color: rgba(255,255,255,0.6); }
    .value { color: #00f2fe; font-weight: bold; }
    .btn {
      display: inline-block;
      margin-top: 30px;
      padding: 15px 40px;
      background: linear-gradient(135deg, #00f2fe 0%, #4ade80 100%);
      color: #0a0e27;
      text-decoration: none;
      border-radius: 50px;
      font-weight: bold;
      font-size: 1.1em;
      box-shadow: 0 4px 15px rgba(0,242,254,0.4);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,242,254,0.6);
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🌱</div>
    <h1>SmartIrrigate Pro</h1>
    <div class="status">
      <div class="spinner"></div>
      <span>ESP32 Connected & Running</span>
    </div>
    
    <div class="info">
      <div class="data-row">
        <span class="label">Soil Moisture:</span>
        <span class="value" id="moisture">Loading...</span>
      </div>
      <div class="data-row">
        <span class="label">Temperature:</span>
        <span class="value" id="temperature">Loading...</span>
      </div>
      <div class="data-row">
        <span class="label">Humidity:</span>
        <span class="value" id="humidity">Loading...</span>
      </div>
      <div class="data-row">
        <span class="label">ML Water Prediction:</span>
        <span class="value" id="waterAmount">Loading...</span>
      </div>
    </div>

    <p style="color: rgba(255,255,255,0.7); margin: 20px 0;">
      Open the full dashboard from your project folder:
    </p>
    <code style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; display: block; margin: 10px 0; color: #4ade80;">
      C:\Users\Kareem\Desktop\Iot_Soil_Irrigation_Project\index.html
    </code>
    
    <a href="#" class="btn" onclick="alert('Please open index.html from your project folder:\\n\\nC:\\\\Users\\\\Kareem\\\\Desktop\\\\Iot_Soil_Irrigation_Project\\\\index.html\\n\\nThe ESP32 is providing the data API. The full UI is in the index.html file.'); return false;">
      How to Access Full Dashboard
    </a>
  </div>

  <script>
    async function update() {
      try {
        const s = await fetch('/api/sensors');
        const sensor = await s.json();
        document.getElementById('moisture').textContent = sensor.moisture.toFixed(1) + '%';
        document.getElementById('temperature').textContent = sensor.temperature.toFixed(1) + '°C';
        document.getElementById('humidity').textContent = sensor.humidity.toFixed(1) + '%';

        const k = await fetch('/api/prediction');
        const pred = await k.json();
        document.getElementById('waterAmount').textContent = pred.waterAmount.toFixed(1) + ' units';
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }
    setInterval(update, 2000);
    update();
  </script>
</body>
</html>
)rawliteral";

// ================== NON-BLOCKING UART ==================
void readSoilUART() {
  while (soilUART.available()) {
    String line = soilUART.readStringUntil('\n');
    float m = line.toFloat();
    if (m >= 0 && m <= 100) {
      moisturePercent = m;
      Serial.printf("UART Moisture: %.1f\n", moisturePercent);
    }
  }
}

// ================== DHT ==================
void readDHT() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h)) humidity = h;
  if (!isnan(t)) temperature = t;

  Serial.printf("DHT → T=%.1f°C  H=%.1f%%\n", temperature, humidity);
}

// ================== ML ==================
void updateML() {
  predictedWater = run_inference(
    moisturePercent,
    humidity,
    temperature
  );

  Serial.printf("ML Predicted Water = %.3f\n", predictedWater);
}

// ================== API ==================
void handleSensors() {
  // CORS headers - allow any origin to access the API
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  StaticJsonDocument<200> doc;
  doc["moisture"] = moisturePercent;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["timestamp"] = millis();

  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handlePrediction() {
  // CORS headers - allow any origin to access the API
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  StaticJsonDocument<200> doc;
  doc["waterAmount"] = predictedWater;
  doc["duration"] = predictedWater / 10.0;  // Example: divide by 10 for duration
  doc["confidence"] = 95.0;  // You can calculate this from your model if available

  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleStatus() {
  // CORS headers
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  StaticJsonDocument<200> doc;
  doc["wifi_connected"] = (WiFi.status() == WL_CONNECTED);
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["ip_address"] = WiFi.localIP().toString();
  doc["uptime"] = millis();
  doc["free_heap"] = ESP.getFreeHeap();

  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleCORS() {
  // Handle preflight OPTIONS request
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "text/plain", "");
}

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);

  dht.begin();
  delay(1500);

  setup_tflite();

  soilUART.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);

  WiFi.begin(ssid, password);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(300); Serial.print("."); }
  Serial.println("\n✅ WiFi Connected");
  Serial.println(WiFi.localIP());

  server.on("/", []( ){ 
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/html", htmlPage); 
  });
  
  server.on("/api/sensors", HTTP_GET, handleSensors);
  server.on("/api/sensors", HTTP_OPTIONS, handleCORS);
  
  server.on("/api/prediction", HTTP_GET, handlePrediction);
  server.on("/api/prediction", HTTP_OPTIONS, handleCORS);
  
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/status", HTTP_OPTIONS, handleCORS);
  
  server.onNotFound([](){
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "text/plain", "404: Not Found");
  });
  
  server.begin();
  Serial.println("✅ Web server started with CORS enabled");
}

// ================== LOOP ==================
void loop() {

  readSoilUART();

  if (millis() - lastDHT >= 2000) {
    lastDHT = millis();
    readDHT();
  }

  if (millis() - lastML >= 3000) {
    lastML = millis();
    updateML();
  }

  server.handleClient();
}