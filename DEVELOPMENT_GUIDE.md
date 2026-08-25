# 💻 Panduan Pengembangan & Operasional Local Bridge MAVIS (Development & Local Run Guide)

Panduan ini berisi instruksi lengkap untuk menjalankan, mengembangkan, dan menghubungkan **MAVIS (Motorcycle Advanced Warning & Intelligence System) IoT Stream Processing Bridge** secara lokal di komputer / laptop Anda menggunakan **Node.js**.

---

## 🗺️ Gambaran Arsitektur Local Bridge MAVIS

```
[ ESP32-S3 (Edge MCU) ] 
       │
       ▼ (1Hz MQTT TLS 8883)
[ HiveMQ Cloud Broker ]
       │
       ▼ (Subscribe: mavis/telemetry/live)
[ Local Node.js Bridge (localhost:3000) ]
  ├── 1. Noise Filtering (Moving Average)
  ├── 2. Stream Anomaly Processing
  ├── 3. Simpan History TSDB ───────▶ [ InfluxDB Cloud 2.0 ]
  ├── 4. Simpan Insiden & Live State ─▶ [ Firebase Firestore ]
  ├── 5. Broadcast WebSocket Alert ──▶ [ Web Dashboard (/api/stream/alerts) ]
  └── 6. Serve Web App & REST APIs ──▶ [ http://localhost:3000 ]
```

---

## 📋 Tahap 1: Prasyarat Sistem (*Prerequisites*)

Pastikan perangkat lokal Anda telah terpasang:
1. **Node.js**: Versi LTS (`v18.x` atau `v20.x` ke atas). Periksa dengan `node -v`.
2. **NPM**: Bawaan Node.js. Periksa dengan `npm -v`.
3. **Koneksi Internet**: Diperlukan agar local bridge dapat berkomunikasi dengan HiveMQ Cloud, InfluxDB Cloud, dan Google Firebase.

---

## 📋 Tahap 2: Kredensial & Layanan Cloud

Pastikan Anda telah memiliki akun dan kredensial berikut:

### 2.1 HiveMQ Cloud (MQTT Broker)
- **Host**: `xxxxxxxx.s1.eu.hivemq.cloud`
- **Port**: `8883` (TLS/SSL)
- **Username & Password**: Kredensial client MQTT yang dibuat di tab *Access Management*.

### 2.2 InfluxDB Cloud 2.0 (Time-Series DB)
- **URL**: `https://europe-west1-1.gcp.cloud2.influxdata.com` (atau region Anda)
- **API Token**: Token dengan hak akses Read & Write ke bucket `mavis_telemetry`.
- **Org**: `mavis-org`
- **Bucket**: `mavis_telemetry`

### 2.3 Firebase Firestore (NoSQL Database)
- File **Service Account Key JSON** dari *Firebase Console > Project Settings > Service Accounts > Generate new private key*.

---

## 📋 Tahap 3: Konfigurasi File Lingkungan (`.env`)

1. Buka root direktori proyek MAVIS.
2. Buat / perbarui file [`.env`](file:///c:/Users/LENOVO/Documents/DATA%20EGA/OPSI26/MAVIS/.env) (dapat menduplikasi dari [`.env.example`](file:///c:/Users/LENOVO/Documents/DATA%20EGA/OPSI26/MAVIS/.env.example)):

```env
# HiveMQ Cloud MQTT Configuration
HIVEMQ_HOST=a70aa4faf3ff4809b9c2f9348eb43474.s1.eu.hivemq.cloud
HIVEMQ_PORT=8883
HIVEMQ_USERNAME=mavis_bridge
HIVEMQ_PASSWORD=bridge01

# InfluxDB Cloud Configuration
INFLUXDB_URL=https://europe-west1-1.gcp.cloud2.influxdata.com
INFLUXDB_TOKEN=your_influxdb_token_here
INFLUXDB_ORG=mavis-org
INFLUXDB_BUCKET=mavis_telemetry

# Firebase Firestore Configuration
# Masukkan isi JSON Service Account dalam 1 baris string atau format Base64
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"mavis-project","private_key_id":"...","private_key":"...","client_email":"..."}

# Stream Processing Parameters & Thresholds
MA_WINDOW_SIZE=5
THRESHOLD_ACC=3.5
THRESHOLD_ANGLE=35

# Passcode untuk Remote Parameter Configuration (Settings Web)
DEVICE_PASSCODE=mavis-01-001-26

# Local Bridge Port
PORT=3000
```

---

## 📋 Tahap 4: Menjalankan Local Bridge

Buka Terminal / PowerShell di folder MAVIS:

### 4.1 Install Dependensi
```bash
npm install
```

### 4.2 Jalankan Local Server
Pilih salah satu mode:

- **Mode Development (Hot-Reload Otomatis):**
  ```bash
  npm run dev
  ```
  *(Server akan otomatis restart setiap kali ada perubahan pada file `.js`)*

- **Mode Standar:**
  ```bash
  npm start
  ```

### 4.3 Output Terminal yang Diharapkan
Saat berhasil berjalan, terminal akan menampilkan:
```
[App] Initializing MAVIS Bridge Services...
[TimeseriesAdapter] Initialized InfluxDB write/query client for bucket: mavis_telemetry
[FirestoreService] Firebase Admin SDK initialized successfully.
[MQTTClient] Connecting to HiveMQ Cloud at mqtts://...:8883...
[MQTTClient] Connected to HiveMQ Cloud Broker.
[MQTTClient] Subscribed to topic: mavis/telemetry/#
[MQTTClient] Subscribed to topic: mavis/config/update
[App] Server listening on http://localhost:3000
```

---

## 📋 Tahap 5: Mengakses Dashboard Telemetri

Buka browser Anda dan akses tautan berikut:

- 🏠 **Beranda (Live Tracking & Map Leaflet):** [http://localhost:3000/](http://localhost:3000/)
- 📜 **Riwayat Perjalanan (History):** [http://localhost:3000/history](http://localhost:3000/history)
- 📊 **Analitik & Metrik (Analytics):** [http://localhost:3000/analytics](http://localhost:3000/analytics)
- 📟 **Terminal Telemetri Real-Time:** [http://localhost:3000/terminal](http://localhost:3000/terminal)
- ⚙️ **Pengaturan Perangkat (Remote Config):** [http://localhost:3000/settings](http://localhost:3000/settings)
- 👤 **Profil Akun:** [http://localhost:3000/account](http://localhost:3000/account)

> [!TIP]
> **Akses dari Smartphone / Perangkat Lain (Satu Wi-Fi/LAN):**
> Anda dapat membuka dashboard dari HP dengan mencari IP lokal komputer Anda (misal `ipconfig` di Windows, temukan `IPv4 Address` contoh `192.168.1.15`), lalu buka `http://192.168.1.15:3000` di browser HP.
>
> **Akses Online untuk Semua Orang via Internet (Ngrok):**
> Untuk membagikan website secara publik ke siapa saja di internet tanpa batas jaringan Wi-Fi, jalankan `ngrok http 3000`. Panduan lengkap tersedia di [NGROK_GUIDE.md](NGROK_GUIDE.md).

---

## 📋 Tahap 6: Format Komunikasi ESP32-S3

Pastikan ESP32-S3 terhubung ke HiveMQ Cloud dengan format data berikut:

### 6.1 Upstream: ESP32-S3 ke Local Bridge (1 Hz)
- **Topik:** `mavis/telemetry/live`
- **Format JSON Payload:**
```json
{
  "device_id": "MAVIS-001",
  "timestamp": "2026-08-24T12:30:00.000Z",
  "gps_lat": -7.9666,
  "gps_long": 112.6326,
  "speed": 45.2,
  "accel_x": 0.12,
  "accel_y": -0.05,
  "accel_z": 9.81,
  "kategori": "aman"
}
```

### 6.2 Downstream: Local Bridge ke ESP32-S3 (Remote Config)
Ketika user mengubah threshold di halaman *Pengaturan* dengan passcode `mavis-01-001-26`:
- **Topik:** `mavis/config/update`
- **Format JSON Payload:**
```json
{
  "device_id": "MAVIS-001",
  "vibration_rms_multiplier": 1.25,
  "max_safe_lean_angle": 38.0,
  "updated_at": "2026-08-24T12:35:00.000Z"
}
```

---

## 📋 Tahap 7: Endpoint API & Pengujian

Uji endpoint bridge menggunakan browser atau Postman:

1. **Cek Health Check:**
   - URL: `http://localhost:3000/health`
   - Respon: `{"status":"ok","service":"MAVIS Real-Time Stream Processing Bridge", ...}`

2. **Cek Status Layanan (MQTT, DB, Active Trips):**
   - URL: `http://localhost:3000/api/status`
   - Respon: Menampilkan status `"mqtt_connected": true`, jumlah WebSocket client aktif, dan trip aktif.

3. **Cek Query Rute Perjalanan (InfluxDB):**
   - URL: `http://localhost:3000/api/trip-route`
   - Respon: Array koordinat GPS (`lat`, `lng`, `speed`, `timestamp`) untuk penggambaran garis rute polyline di Leaflet Map.

4. **Uji WebSocket Alerts:**
   - Endpoint: `ws://localhost:3000/api/stream/alerts`
   - Menerima broadcast JSON realtime setiap kali terdeteksi kondisi `waspada` atau `bahaya`.

---

## 🔧 Troubleshooting Umum

| Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| `EADDRINUSE: address already in use :::3000` | Port 3000 sedang dipakai aplikasi lain | Ubah `PORT=3001` di `.env` atau hentikan proses yang memakai port 3000 (`npx kill-port 3000`). |
| `[MQTTClient] HIVEMQ_HOST missing` | Variabel environment di `.env` belum terisi | Periksa file `.env` dan pastikan `HIVEMQ_HOST` terisi dengan benar. |
| `Firebase Admin SDK init failed` | Format JSON service account salah | Pastikan seluruh isi JSON diletakkan dalam satu baris string tanpa line-break pada `FIREBASE_SERVICE_ACCOUNT_JSON`. |
| Peta Leaflet tidak muncul rute | InfluxDB belum memiliki riwayat GPS | Kirimkan data telemetri dari ESP32-S3 atau jalankan skrip simulasi data. |
