#include <ESP8266WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266HTTPClient.h>

#define RST_PIN D1
#define SDA_PIN D2
#define BUZZ_PIN D0

MFRC522 mfrc522(SDA_PIN, RST_PIN);

const char* ssid = "KAMAR"; 
const char* password = "JuraganEmpang";
const char* serverUrl = "http://15.15.15.253:3000/api/rfid";

unsigned long lastScanTime = 0;
String lastUID = "";
const unsigned long antiDoubleDelay = 3000; // 3 detik

// ================= BUZZER =================
void beep(uint8_t count, uint16_t duration) {
  for (uint8_t i = 0; i < count; i++) {
    digitalWrite(BUZZ_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZ_PIN, LOW);
    delay(duration);
  }
}

// ================= WIFI =================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.begin(ssid, password);
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected");
    beep(2, 80);
  } else {
    Serial.println("WiFi Failed");
  }
}

// ================= HTTP RETRY =================
bool postWithRetry(const String& uid) {
  const uint8_t maxRetry = 3;

  for (uint8_t i = 0; i < maxRetry; i++) {
    WiFiClient client;
    HTTPClient http;
    http.setTimeout(3000);

    if (!http.begin(client, serverUrl)) {
      http.end();
      delay(300);
      continue;
    }

    http.addHeader("Content-Type", "application/json");

    String jsonBody = "{\"uid\":\"" + uid + "\"}";

    int httpCode = http.POST(jsonBody);

    if (httpCode > 0 && httpCode < 400) {
      Serial.print("HTTP Success (try ");
      Serial.print(i + 1);
      Serial.println(")");
      http.end();
      return true;
    }

    Serial.print("HTTP Failed (try ");
    Serial.print(i + 1);
    Serial.print(") Code: ");
    Serial.println(httpCode);

    http.end();
    delay(500);
  }

  return false;
}

// bool postWithRetry(const String& data) {
//   const uint8_t maxRetry = 3;

//   for (uint8_t i = 0; i < maxRetry; i++) {
//     WiFiClient client;
//     HTTPClient http;
//     http.setTimeout(3000);

//     if (!http.begin(client, serverUrl)) {
//       http.end();
//       delay(300);
//       continue;
//     }

//     http.addHeader("Content-Type", "application/json");
//     int httpCode = http.POST(data);

//     if (httpCode > 0 && httpCode < 400) {
//       Serial.print("HTTP Success (try ");
//       Serial.print(i + 1);
//       Serial.println(")");
//       http.end();
//       return true;
//     }

//     Serial.print("HTTP Failed (try ");
//     Serial.print(i + 1);
//     Serial.println(")");

//     http.end();
//     delay(500);
//   }

//   return false;
// }

// ================= SETUP =================
void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();

  pinMode(BUZZ_PIN, OUTPUT);
  digitalWrite(BUZZ_PIN, LOW);

  WiFi.mode(WIFI_STA);
  connectWiFi();

  Serial.println("System Ready");
}

// ================= LOOP =================
void loop() {

  connectWiFi();

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Ambil UID
  char uidChar[20] = {0};
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    sprintf(&uidChar[i * 2], "%02X", mfrc522.uid.uidByte[i]);
  }
  String uid = String(uidChar);

  unsigned long now = millis();

  // ===== ANTI DOUBLE SCAN =====
  if (uid == lastUID && (now - lastScanTime) < antiDoubleDelay) {
    Serial.println("Duplicate scan ignored");
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    return;
  }

  lastUID = uid;
  lastScanTime = now;

  Serial.print("UID: ");
  Serial.println(uid);

  beep(1, 200);

  // String postData = "uid=" + uid;

  // ===== HTTP + RETRY =====
  if (postWithRetry(uid)) {
    beep(2, 80);   // sukses
  } else {
    beep(4, 60);   // gagal total
  }

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
