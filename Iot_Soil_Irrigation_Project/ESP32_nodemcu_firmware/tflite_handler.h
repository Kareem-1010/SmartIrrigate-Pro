#ifndef TFLITE_HANDLER_H
#define TFLITE_HANDLER_H

void setup_tflite();
float run_inference(float moisture, float humidity, float temp);

#endif // TFLITE_HANDLER_H