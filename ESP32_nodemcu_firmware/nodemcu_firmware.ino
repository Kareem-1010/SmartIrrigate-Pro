/*******************************************************
 * NodeMCU ESP8266 - Soil Moisture → UART (% only)
 *******************************************************/

#define SOIL_PIN A0   // Analog input

// === FINAL Calibrated values ===
int dryValue = 1024;    // RAW dry
int wetValue = 690;     // RAW wet (avg of 674–700)

int mapPercent(int raw) {
  long pct = (long)(raw - dryValue) * 100L / (long)(wetValue - dryValue);

  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return (int)pct;
}

void setup() {
  Serial.begin(9600);   // UART TX to ESP32
  delay(1000);

  Serial.println("\n[NodeMCU Soil Sender]");
  Serial.println("Calibrated Mode: DRY=1024, WET=690");
}

void loop() {

  int raw = analogRead(SOIL_PIN);
  int moistPct = mapPercent(raw);

  // Debug to Serial Monitor
  Serial.print("RAW=");
  Serial.print(raw);
  Serial.print(" | %=");
  Serial.println(moistPct);

  // ✅ Send ONLY percent to ESP32
  Serial.println(moistPct);

  delay(1500);
}