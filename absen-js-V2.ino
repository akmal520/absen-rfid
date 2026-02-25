#include <FS.h>          // File System library
#include <LittleFS.h>    // LittleFS untuk simpan konfigurasi
#include <WiFiManager.h> // WiFiManager by tzapu/tablatronix
#include <ArduinoJson.h> // ArduinoJson by Benoit Blanchon (v6 atau v7)
#include <ESP8266WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266HTTPClient.h>

// Pin Configuration
#define RST_PIN D1
#define SDA_PIN D2
#define BUZZ_PIN D0
#define TRIGGER_PIN D8 // Pin tombol reset WiFi (hubungkan ke GND untuk reset)

MFRC522 mfrc522(SDA_PIN, RST_PIN);

// Variabel Konfigurasi
char serverUrl[100] = "http://192.168.1.10:3000/api/rfid"; // Default URL
bool shouldSaveConfig = false;

// Fungsi Buzzer
void beep(uint8_t count, uint16_t duration) {
  for (uint8_t i = 0; i < count; i++) {
    digitalWrite(BUZZ_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZ_PIN, LOW);
    delay(duration);
  }
}

// Callback untuk memberitahu bahwa config perlu disimpan
void saveConfigCallback() {
  Serial.println("Konfigurasi baru diterima, siap disimpan...");
  shouldSaveConfig = true;
}

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  pinMode(BUZZ_PIN, OUTPUT);
  pinMode(TRIGGER_PIN, INPUT);

  // WiFiManager Setup
  WiFiManager wm;
  wm.setSaveConfigCallback(saveConfigCallback);

  Serial.println("Cek reset WiFi (Hubungkan D8 ke 3V3 sekarang jika ingin reset)...");
  beep(3,1000);

  // Logika Reset WiFi Manual (Tekan tombol D3 saat booting)
  if (digitalRead(TRIGGER_PIN) == HIGH) {
    Serial.println("Tombol reset ditekan! Menghapus data WiFi...");
    beep(3, 100);
    wm.resetSettings();
    LittleFS.format();
    Serial.println("Reset Berhasil. Lepas kabel dan restart.");
    while(digitalRead(TRIGGER_PIN) == HIGH); // Tunggu sampai kabel dilepas
    ESP.restart();
  }

  // Inisialisasi LittleFS dan baca config.json jika ada
  Serial.println("Mounting file system...");
  if (LittleFS.begin()) {
    if (LittleFS.exists("/config.json")) {
      File configFile = LittleFS.open("/config.json", "r");
      if (configFile) {
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, configFile);
        if (!error) {
          strcpy(serverUrl, doc["serverUrl"]);
          Serial.println("Config lama dimuat dari memori.");
        }
      }
    }
  } else {
    Serial.println("Gagal mounting LittleFS");
  }

  // Buat input box tambahan di halaman login WiFi untuk Server URL
  WiFiManagerParameter custom_server_url("server", "API Server URL", serverUrl, 100);
  wm.addParameter(&custom_server_url);

  // Mencoba konek ke WiFi yang tersimpan, jika gagal buka Access Point "Absensi_Setup"
  if (!wm.autoConnect("Absensi_Setup")) {
    Serial.println("Gagal konek WiFi dan timeout.");
    delay(3000);
    ESP.restart();
  }

  // Ambil nilai dari portal dan simpan ke LittleFS jika berubah
  strcpy(serverUrl, custom_server_url.getValue());

  if (shouldSaveConfig) {
    StaticJsonDocument<256> doc;
    doc["serverUrl"] = serverUrl;
    File configFile = LittleFS.open("/config.json", "w");
    if (configFile) {
      serializeJson(doc, configFile);
      configFile.close();
      Serial.println("Konfigurasi berhasil disimpan ke memori permanen.");
    }
  }

  Serial.println("WiFi Connected!");
  Serial.print("Target API: ");
  Serial.println(serverUrl);
  beep(2, 80);
}

bool postWithRetry(const String& uid) {
  for (uint8_t i = 0; i < 3; i++) {
    WiFiClient client;
    HTTPClient http;
    
    if (http.begin(client, serverUrl)) {
      http.addHeader("Content-Type", "application/json");
      
      String jsonBody = "{\"uid\":\"" + uid + "\"}";
      int httpCode = http.POST(jsonBody);

      if (httpCode > 0 && httpCode < 400) {
        Serial.print("Kirim Berhasil: "); Serial.println(httpCode);
        http.end();
        return true;
      }
      Serial.print("Gagal Kirim, HTTP Code: "); Serial.println(httpCode);
      http.end();
    }
    delay(500); // Jeda antar retry
  }
  return false;
}

void loop() {
  // Cek apakah ada kartu RFID baru
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Konversi UID ke String HEX
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.println("Kartu Terdeteksi! UID: " + uid);
  beep(1, 150);

  // Kirim data ke API
  if (postWithRetry(uid)) {
    beep(2, 100); // Berhasil
  } else {
    beep(4, 50);  // Gagal total
  }

  // Stop pembacaan kartu
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}