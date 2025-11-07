// --- 4WD Rover using CT6B Receiver, ESP8266, and L298N ---
// Author: Kareem Un Nawaz
// Version: Stable Smooth Control (All-wheel sync)

// Motor driver pins
#define IN1 D1   // Left motor forward
#define IN2 D2   // Left motor backward
#define IN3 D3   // Right motor forward
#define IN4 D4   // Right motor backward
#define ENA D5   // Left enable (PWM)
#define ENB D6   // Right enable (PWM)

// Receiver pins
#define STEERING_PIN D7  // CH1
#define THROTTLE_PIN D8  // CH2

// Calibration
int throttleNeutral = 1500;
int steeringNeutral = 1500;
int deadzone = 50;

void setup() {
  Serial.begin(9600);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);

  pinMode(THROTTLE_PIN, INPUT);
  pinMode(STEERING_PIN, INPUT);

  stopMotors();

  Serial.println("✅ 4WD Rover Ready (Smooth Steering + Speed Control)");
}

void loop() {
  int throttleValue = pulseIn(THROTTLE_PIN, HIGH, 25000);
  int steeringValue = pulseIn(STEERING_PIN, HIGH, 25000);

  if (throttleValue == 0 || steeringValue == 0) {
    stopMotors();
    return;
  }

  // Normalize input range (1000–2000 µs)
  int throttle = throttleValue - throttleNeutral;  // forward/backward
  int steering = steeringValue - steeringNeutral;  // left/right

  // Basic deadzone
  if (abs(throttle) < deadzone) throttle = 0;
  if (abs(steering) < deadzone) steering = 0;

  // Map values to PWM range (0–255)
  int baseSpeed = map(abs(throttle), 0, 500, 0, 255);
  baseSpeed = constrain(baseSpeed, 0, 255);

  int turnAdjust = map(abs(steering), 0, 500, 0, 180);
  turnAdjust = constrain(turnAdjust, 0, 180);

  int leftSpeed = baseSpeed;
  int rightSpeed = baseSpeed;

  // Adjust for turning
  if (steering > 0) {          // Turn Right
    rightSpeed -= turnAdjust;
  } else if (steering < 0) {   // Turn Left
    leftSpeed -= turnAdjust;
  }

  // Clamp speed values
  leftSpeed = constrain(leftSpeed, 0, 255);
  rightSpeed = constrain(rightSpeed, 0, 255);

  // Movement Direction
  if (throttle > 0) {
    moveForward(leftSpeed, rightSpeed);
  } else if (throttle < 0) {
    moveBackward(leftSpeed, rightSpeed);
  } else if (steering > 0) {
    turnRightStationary(turnAdjust);
  } else if (steering < 0) {
    turnLeftStationary(turnAdjust);
  } else {
    stopMotors();
  }

  Serial.print("Throttle: "); Serial.print(throttleValue);
  Serial.print("\tSteering: "); Serial.print(steeringValue);
  Serial.print("\tL: "); Serial.print(leftSpeed);
  Serial.print("\tR: "); Serial.println(rightSpeed);
}

// ---- Motor Control ----

void moveForward(int leftPWM, int rightPWM) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, leftPWM);
  analogWrite(ENB, rightPWM);
}

void moveBackward(int leftPWM, int rightPWM) {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, leftPWM);
  analogWrite(ENB, rightPWM);
}

void turnLeftStationary(int speed) {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);   // Left backward
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);    // Right forward
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
}

void turnRightStationary(int speed) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);    // Left forward
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);   // Right backward
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
}

void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}