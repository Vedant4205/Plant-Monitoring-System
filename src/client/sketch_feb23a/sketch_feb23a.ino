#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <DHT.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>

// Pin Definitions for ESP8266
#define SOIL_MOISTURE_PIN A0    // Analog pin A0 for soil moisture
#define DHT_PIN 14             // GPIO14 (D5) for DHT11
#define I2C_SDA 4              // GPIO4 (D2) for I2C SDA
#define I2C_SCL 5              // GPIO5 (D1) for I2C SCL
#define DHTTYPE DHT11          // DHT11 sensor type

// Wi-Fi credentials
const char* ssid = "VEDANT";

// Google Sheets deployment ID
const char* GScriptId = "https://script.google.com/macros/s/AKfycby4GUm5EKk0iH45wZsL1Y3cu7b4ajy5aUGyyN5ovCXimMkgfLd5CsTZi4bBFkQi9AWc/exec";

// Create sensor objects
Adafruit_AHTX0 aht;
DHT dht(DHT_PIN, DHTTYPE);

// Create web server object on port 80
ESP8266WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

// Variables to store sensor readings
float aht_temperature;
float aht_humidity;
float dht_temperature;
float dht_humidity;
int soilMoisture;

// HTML webpage template
const char* html_template = R"(
<!DOCTYPE HTML>
<html>
<head>
    <title>Environmental Monitor</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; text-align: center; margin: 0px auto; padding: 20px; }
        .reading { font-size: 2.0rem; }
        .unit { font-size: 1.0rem; }
        .data-container { margin: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
        .sensor-group { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 10px; }
        h3 { color: #333; margin-top: 0; }
    </style>
    <script>
        var socket = new WebSocket('ws://' + location.hostname + ':81/');
        socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            document.getElementById("aht_temperature").innerHTML = data.aht_temperature.toFixed(1);
            document.getElementById("aht_humidity").innerHTML = data.aht_humidity.toFixed(1);
            document.getElementById("dht_temperature").innerHTML = data.dht_temperature.toFixed(1);
            document.getElementById("dht_humidity").innerHTML = data.dht_humidity.toFixed(1);
            document.getElementById("moisture").innerHTML = data.moisture;
        };
    </script>
</head>
<body>
    <h2>Environmental Monitor</h2>
    
    <div class="sensor-group">
        <h3>AHT10 Sensor</h3>
        <div class="data-container">
            <div class="reading">
                <span id="aht_temperature">0</span>
                <span class="unit">°C</span>
            </div>
            <p>Temperature</p>
        </div>
        <div class="data-container">
            <div class="reading">
                <span id="aht_humidity">0</span>
                <span class="unit">%</span>
            </div>
            <p>Humidity</p>
        </div>
    </div>

    <div class="sensor-group">
        <h3>DHT11 Sensor</h3>
        <div class="data-container">
            <div class="reading">
                <span id="dht_temperature">0</span>
                <span class="unit">°C</span>
            </div>
            <p>Temperature</p>
        </div>
        <div class="data-container">
            <div class="reading">
                <span id="dht_humidity">0</span>
                <span class="unit">%</span>
            </div>
            <p>Humidity</p>
        </div>
    </div>

    <div class="sensor-group">
        <h3>Soil Sensor</h3>
        <div class="data-container">
            <div class="reading">
                <span id="moisture">0</span>
                <span class="unit">RAW</span>
            </div>
            <p>Soil Moisture</p>
        </div>
    </div>
</body>
</html>
)";

void setup() {
    Serial.begin(115200);
    
    // Print pin configuration
    Serial.println("\nPin Configuration:");
    Serial.println("Soil Moisture Pin: A0");
    Serial.println("DHT11 Pin: D5");
    Serial.println("I2C SDA Pin: D2");
    Serial.println("I2C SCL Pin: D1");
    
    // Initialize I2C for AHT10 with specified pins
    Wire.begin(I2C_SDA, I2C_SCL);
    
    // Initialize DHT11 sensor
    dht.begin();
    Serial.println("DHT11 sensor initialized!");
    
    // Initialize AHT sensor
    if (!aht.begin()) {
        Serial.println("Could not find AHT sensor. Check wiring!");
        Serial.println("1. Check SDA connection to D2");
        Serial.println("2. Check SCL connection to D1");
        Serial.println("3. Check power (3.3V) and ground connections");
        while (1) delay(10);
    } else {
        Serial.println("AHT sensor initialized successfully!");
    }
    
    // Replace the WiFi.begin() call with WiFiManager
    WiFiManager wifiManager;
    wifiManager.autoConnect("PlantMonitoringSystem");
    
    // Set up web server routes
    server.on("/", handleRoot);
    server.on("/data", handleData);
    
    // Start web server and WebSocket server
    server.begin();
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    Serial.println("HTTP server and WebSocket server started");
}

void loop() {
    Serial.println(WiFi.localIP());
    server.handleClient();
    webSocket.loop();
    updateSensorReadings();
    sendDataToGoogleSheets();
    broadcastSensorData();
    delay(5000);  // Update every 5 seconds
}

void updateSensorReadings() {
    sensors_event_t humidity_event, temp_event;
    
    // Read AHT sensor
    if (aht.getEvent(&humidity_event, &temp_event)) {
        aht_temperature = temp_event.temperature;
        aht_humidity = humidity_event.relative_humidity;
    } else {
        Serial.println("Failed to read from AHT sensor!");
    }
    
    // Read DHT11 sensor
    dht_temperature = dht.readTemperature();
    dht_humidity = dht.readHumidity();
    
    // Check if DHT11 reading failed
    if (isnan(dht_humidity) || isnan(dht_temperature)) {
        Serial.println("Failed to read from DHT11 sensor!");
    }
    
    // Read soil moisture sensor
    soilMoisture = analogRead(SOIL_MOISTURE_PIN);
    
    // Print readings to Serial Monitor (for debugging)
    Serial.println("\n--- Sensor Readings ---");
    Serial.printf("AHT10 - Temperature: %.1f°C, Humidity: %.1f%%\n", 
                 aht_temperature, aht_humidity);
    Serial.printf("DHT11 - Temperature: %.1f°C, Humidity: %.1f%%\n", 
                 dht_temperature, dht_humidity);
    Serial.printf("Soil Moisture: %d\n", soilMoisture);
}

void handleRoot() {
    server.send(200, "text/html", html_template);
}

void handleData() {
    String json = getSensorDataJSON();
    server.send(200, "application/json", json);
}

void sendDataToGoogleSheets() {
    WiFiClientSecure client;
    client.setInsecure();
    const char* host = "script.google.com";
    const int httpsPort = 443;

    if (!client.connect(host, httpsPort)) {
        Serial.println("Connection to Google Sheets failed");
        return;
    }

    String url = "/macros/s/" + String(GScriptId) + "/exec?";
    url += "aTemperature=" + String(aht_temperature);
    url += "&aHumidity=" + String(aht_humidity);
    url += "&dTemperature=" + String(dht_temperature);
    url += "&dHumidity=" + String(dht_humidity);
    url += "&soilMoisture=" + String(soilMoisture);

    client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                 "Host: " + host + "\r\n" +
                 "User-Agent: ESP8266\r\n" +
                 "Connection: close\r\n\r\n");

    while (client.connected()) {
        String line = client.readStringUntil('\n');
        if (line == "\r") {
            break;
        }
    }
    String line = client.readStringUntil('\n');
    if (line.startsWith("{\"result\":\"success\"")) {
        Serial.println("Data sent to Google Sheets successfully");
    } else {
        Serial.println("Failed to send data to Google Sheets");
    }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
        case WStype_CONNECTED:
            {
                IPAddress ip = webSocket.remoteIP(num);
                Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
                broadcastSensorData();
            }
            break;
    }
}

void broadcastSensorData() {
    String json = getSensorDataJSON();
    webSocket.broadcastTXT(json);
}

String getSensorDataJSON() {
    StaticJsonDocument<200> doc;
    doc["aht_temperature"] = aht_temperature;
    doc["aht_humidity"] = aht_humidity;
    doc["dht_temperature"] = dht_temperature;
    doc["dht_humidity"] = dht_humidity;
    doc["moisture"] = soilMoisture;
    
    String json;
    serializeJson(doc, json);
    return json;
}
