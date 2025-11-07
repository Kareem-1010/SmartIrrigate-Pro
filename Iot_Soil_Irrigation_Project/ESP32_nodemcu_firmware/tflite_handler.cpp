#include <Arduino.h>
#include "tflite_handler.h"

// --- Core TensorFlow Lite Libraries ---
// This is the header for the library from the Library Manager
#include <TensorFlowLite_ESP32.h>

#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"

// --- Custom Model File ---
#include "irrigation_model.h"

// ==============================================================================
//  VERY IMPORTANT! UPDATE THESE MODEL SCALING VALUES
// ==============================================================================
float SCALER_MEANS[] = {51.04, 57.34, 27.91};   // REPLACE THESE
float SCALER_SCALES[] = {25.13, 14.88, 7.35}; // REPLACE THESE

// --- TensorFlow Lite Globals ---
namespace {
  tflite::ErrorReporter* error_reporter = nullptr;
  const tflite::Model* model = nullptr;
  tflite::MicroInterpreter* interpreter = nullptr;
  TfLiteTensor* input = nullptr;
  TfLiteTensor* output = nullptr;

  const int kTensorArenaSize = 4 * 1024;
  uint8_t tensor_arena[kTensorArenaSize];

  tflite::AllOpsResolver resolver;
}

// --- Function Implementations ---
void setup_tflite() {
  static tflite::MicroErrorReporter micro_error_reporter;
  error_reporter = &micro_error_reporter;

  model = tflite::GetModel(irrigation_model_tflite);
  if (model->version() != TFLITE_SCHEMA_VERSION) {
    error_reporter->Report("Model schema version mismatch!");
    return;
  }

  static tflite::MicroInterpreter static_interpreter(model, resolver, tensor_arena, kTensorArenaSize, error_reporter);
  interpreter = &static_interpreter;

  if (interpreter->AllocateTensors() != kTfLiteOk) {
    error_reporter->Report("AllocateTensors() failed");
    return;
  }

  input = interpreter->input(0);
  output = interpreter->output(0);

  error_reporter->Report("TensorFlow Lite model loaded successfully.");
}

float run_inference(float moisture, float humidity, float temp) {
  float scaled_moisture = (moisture - SCALER_MEANS[0]) / SCALER_SCALES[0];
  float scaled_humidity = (humidity - SCALER_MEANS[1]) / SCALER_SCALES[1];
  float scaled_temperature = (temp - SCALER_MEANS[2]) / SCALER_SCALES[2];

  input->data.f[0] = scaled_moisture;
  input->data.f[1] = scaled_humidity;
  input->data.f[2] = scaled_temperature;

  if (interpreter->Invoke() != kTfLiteOk) {
    error_reporter->Report("Invoke failed.");
    return -1.0;
  }

  float prediction = output->data.f[0];

  if (prediction < 0) {
    prediction = 0;
  }
  return prediction;
}