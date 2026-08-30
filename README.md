# 🏍️ MAVIS (Motorcycle Advanced Warning & Intelligence System)

Real-Time IoT Stream Processing Bridge & Telemetry Dashboard untuk sistem keselamatan dan pemantauan sepeda motor pintar.

## 🏗️ Arsitektur Sistem

- **Edge MCU**: ESP32-S3 (Sensori IMU & GPS, Komputasi Fisika Lokal, Layar TFT, MQTT Client)
- **MQTT Broker**: HiveMQ Cloud Serverless (TLS Port 8883)
- **IoT Stream Processing Bridge**: Local Node.js Bridge (`http://localhost:3000`)
- **Time-Series Database (TSDB)**: InfluxDB Cloud 2.0 (History rute & data telemetri beresolusi tinggi)
- **Document & Live State DB**: Google Firebase Firestore
- **Frontend Dashboard**: HTML5, Vanilla JS, Tailwind/Modern CSS, Leaflet.js

## 📖 Panduan Pengembangan & Penggunaan

Panduan lengkap instalasi lokal, konfigurasi `.env`, dan integrasi dengan hardware ESP32-S3:
- 🌐 [NGROK_GUIDE.md](NGROK_GUIDE.md) — **Panduan Membuka Akses Publik Online via Ngrok**.
- 📱 [TERMUX_GUIDE.md](TERMUX_GUIDE.md) — **Panduan Operasional Bridge di Android Termux (Edge Gateway)**.
- 💻 [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — Panduan instalasi dan pengembangan Local Bridge di PC/Laptop.
- 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — Panduan arsitektur dan operasional sistem end-to-end.

## 🛠️ Menjalankan Lokal

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables (.env)
cp .env.example .env

# 3. Jalankan server bridge secara lokal
npm start

# Atau mode development (live auto-reload):
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000).