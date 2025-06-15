# Plant Monitoring System

A comprehensive IoT-based plant monitoring system that tracks environmental conditions and soil moisture levels in real-time.

## Features

- Real-time monitoring of:
  - Temperature (using AHT10 and DHT11 sensors)
  - Humidity (using AHT10 and DHT11 sensors)
  - Soil moisture levels
- Web-based dashboard for monitoring
- Data logging to Google Sheets
- WiFi configuration through WiFiManager
- WebSocket support for real-time updates

## Hardware Requirements

- ESP8266 (NodeMCU or similar)
- AHT10 Temperature & Humidity Sensor
- DHT11 Temperature & Humidity Sensor
- Soil Moisture Sensor
- Jumper wires
- Breadboard (optional)

## Pin Configuration

- Soil Moisture Sensor: A0
- DHT11 Sensor: GPIO14 (D5)
- I2C SDA: GPIO4 (D2)
- I2C SCL: GPIO5 (D1)

## Software Requirements

- Arduino IDE
- Required Libraries:
  - ESP8266WiFi
  - ESP8266WebServer
  - WebSocketsServer
  - Wire
  - Adafruit_AHTX0
  - DHT
  - WiFiClientSecure
  - ArduinoJson
  - WiFiManager

## Setup Instructions

1. Clone this repository
2. Open the project in Arduino IDE
3. Install required libraries through Arduino Library Manager
4. Configure your Google Sheets script ID in the code
5. Upload the code to your ESP8266
6. On first boot, connect to the "PlantMonitoringSystem" WiFi network
7. Configure your WiFi credentials through the captive portal
8. Access the dashboard through the ESP8266's IP address

## Web Interface

The system provides a web interface accessible through the ESP8266's IP address. The interface shows:
- Real-time temperature readings from both sensors
- Real-time humidity readings from both sensors
- Soil moisture levels
- Auto-updating data through WebSocket connection

## Data Logging

The system automatically logs data to Google Sheets. To set up:
1. Create a Google Apps Script
2. Deploy it as a web app
3. Update the `GScriptId` in the code with your deployment ID

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 