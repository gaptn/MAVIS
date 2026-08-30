# 📱 Panduan Lengkap Operasional MAVIS Local Bridge di Termux (Android Edge Gateway)

Panduan ini berisi instruksi lengkap untuk memindahkan dan menjalankan **MAVIS (Motorcycle Advanced Warning & Intelligence System) Stream Processing Bridge** secara lokal langsung di smartphone Android Anda menggunakan **Terminal Termux**.

Dengan konfigurasi ini, smartphone bertindak sebagai **Local Edge Gateway & Server** yang memproses telemetri dari ESP32-S3, menyimpan ke cloud database (InfluxDB & Firestore), serta menyajikan Web Dashboard tanpa memerlukan hosting cloud berbayar seperti Fly.io atau Heroku.

---

## 🗺️ Arsitektur Sistem (Termux Local Bridge)

```
[ ESP32-S3 (Edge MCU) ]
       │
       ▼ (1Hz MQTT TLS 8883 via Hotspot / Cellular)
[ HiveMQ Cloud Broker ]
       │
       ▼ (Subscribe: mavis/+/telemetry)
[ Smartphone Android - Termux Node.js Bridge ]
  ├── 1. Noise Filtering (Moving Average)
  ├── 2. Stream Anomaly Processing (Braking & Cornering)
  ├── 3. Simpan History TSDB ───────▶ [ InfluxDB Cloud 2.0 ]
  ├── 4. Simpan Insiden & Live State ─▶ [ Firebase Firestore ]
  ├── 5. Broadcast WebSocket Alert ──▶ [ Web Dashboard (/api/stream/alerts) ]
  └── 6. Serve Web App & REST APIs ──▶ [ http://localhost:3000 ]
                                         │
                                         ├─▶ Browser HP: http://localhost:3000
                                         └─▶ Laptop / PC (Satu Wi-Fi): http://<IP-HP>:3000
```

---

## 📋 Langkah 1: Persiapan Aplikasi Termux di Android

> [!IMPORTANT]
> **Jangan unduh Termux dari Google Play Store** karena versi Play Store sudah usang (*deprecated*) dan akan menyebabkan error repositori `404 Not Found`.

1. Unduh file APK Termux terbaru dari salah satu sumber resmi berikut:
   - **F-Droid:** [https://f-droid.org/en/packages/com.termux/](https://f-droid.org/en/packages/com.termux/)
   - **GitHub Releases:** [https://github.com/termux/termux-app/releases](https://github.com/termux/termux-app/releases) *(Pilih varian `termux-app_v..._arm64-v8a.apk` atau `universal`)*.
2. Pasang (Install) aplikasi Termux di HP Anda.
3. Buka aplikasi Termux, lalu jalankan perintah perizinan penyimpanan:
   ```bash
   termux-setup-storage
   ```
   *(Pilih **Izinkan/Allow** saat muncul pop-up izin akses penyimpanan)*.

---

## 📋 Langkah 2: Pengaturan Background & Daya (Agar Tidak Dimatikan OS)

Agar bridge tetap berjalan saat layar HP terkunci atau saat Anda berkendara:

1. **Aktifkan Wake Lock di Termux:**
   Ketik perintah berikut di Termux:
   ```bash
   termux-wake-lock
   ```
   *(Akan muncul notifikasi persistensi di status bar Android)*.

2. **Nonaktifkan Battery Optimization untuk Termux:**
   - Masuk ke menu **Pengaturan HP (Settings) > Aplikasi > Termux > Baterai / Penghemat Daya**.
   - Pilih opsi **Tidak Dibatasi (Unrestricted / No Restrictions)**.
   - Izinkan **Autostart / Mulai Otomatis** (khusus HP Xiaomi/MIUI, Oppo/Realme, Vivo, atau Samsung).

---

## 📋 Langkah 3: Instalasi Node.js & Git di Termux

Jalankan perintah berikut di jendela Termux:

```bash
# 1. Update paket & repositori
pkg update -y && pkg upgrade -y

# 2. Install Node.js LTS, Git, dan dependensi compiler
pkg install nodejs-lts git python make clang libuv -y

# 3. Verifikasi instalasi Node.js & NPM
node -v
npm -v
```

---

## 📋 Langkah 4: Memindahkan Kode Sumber MAVIS ke Termux

Pilih salah satu metode yang paling mudah bagi Anda:

### Opsi A: Menggunakan Git Clone (Paling Direkomendasikan)
Jika proyek MAVIS Anda sudah ada di GitHub:
```bash
git clone https://github.com/username/MAVIS.git
cd MAVIS
```

### Opsi B: Salin Folder dari Penyimpanan Internal HP
Jika Anda memindahkan folder proyek dari laptop ke memori internal HP (misal di folder `Download/MAVIS`):
```bash
cp -r ~/storage/shared/Download/MAVIS ~/MAVIS
cd ~/MAVIS
```

---

## 📋 Langkah 5: Konfigurasi Environment Variables (`.env`)

1. Periksa apakah file `.env` sudah ada di folder `MAVIS`:
   ```bash
   ls -la
   ```
2. Jika belum ada, salin dari `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Edit file `.env` menggunakan teks editor bawaan terminal (`nano`):
   ```bash
   nano .env
   ```
4. Pastikan variabel lingkungan terisi lengkap:
   ```env
   # HiveMQ Cloud MQTT Configuration
   HIVEMQ_HOST=a70aa4faf3ff4809b9c2f9348eb43474.s1.eu.hivemq.cloud
   HIVEMQ_PORT=8883
   HIVEMQ_USERNAME=mavis_bridge
   HIVEMQ_PASSWORD=bridge01

   # InfluxDB Cloud Configuration
   INFLUXDB_URL=https://europe-west1-1.gcp.cloud2.influxdata.com
   INFLUXDB_TOKEN=your_token_here
   INFLUXDB_ORG=mavis-org
   INFLUXDB_BUCKET=mavis_telemetry

   # Firebase Firestore Configuration (JSON 1 Baris)
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

   # Stream Processing Thresholds
   MA_WINDOW_SIZE=5
   THRESHOLD_ACC=3.5
   THRESHOLD_ANGLE=35
   DEVICE_PASSCODE=mavis-01-001-26

   PORT=3000
   ```
5. Simpan file di `nano` dengan menekan tombol **Ctrl + O**, lalu tekan **Enter**. Keluar dengan **Ctrl + X**.

---

## 📋 Langkah 6: Install Dependensi NPM & Menjalankan Bridge

1. Install dependensi modul:
   ```bash
   npm install
   ```
2. Jalankan skrip startup Termux:
   ```bash
   # Berikan izin eksekusi jika diperlukan
   chmod +x termux-start.sh
   
   # Jalankan bridge
   ./termux-start.sh
   ```
   *(Atau jalankan langsung dengan `npm start`)*.

3. Output sukses yang muncul di terminal Termux:
   ```text
   ========================================================
    🏍️  MAVIS Real-Time Stream Processing Bridge (Termux)
   ========================================================
    [✓] Wake Lock Diaktifkan (Background Keep-Alive)
    [✓] Akses dari HP ini:       http://localhost:3000
    [✓] Akses dari Laptop / PC:  http://192.168.43.1:3000
   ========================================================
   [App] Initializing MAVIS Bridge Services...
   [TimeseriesAdapter] Initialized InfluxDB write/query client for bucket: mavis_telemetry
   [FirestoreService] Firebase Admin SDK initialized successfully.
   [MQTTClient] Connecting to HiveMQ Cloud at mqtts://...:8883...
   [MQTTClient] Connected to HiveMQ Cloud Broker.
   [MQTTClient] Subscribed to topic: mavis/+/telemetry, mavis/+/status
   [App] Server listening on http://localhost:3000
   ```

---

## 📋 Langkah 7: Mengakses Web Dashboard MAVIS

Setelah bridge berjalan di Termux:

1. **Dari Browser HP Android yang sama:**
   - Buka Google Chrome / Brave di HP Anda.
   - Buka alamat: **[http://localhost:3000](http://localhost:3000)**

2. **Dari Laptop / PC / Tablet Lain (Satu Jaringan Wi-Fi / Hotspot HP):**
   - Hidupkan **Tethering / Hotspot Portabel** di HP Android Anda, atau sambungkan HP dan Laptop ke Wi-Fi yang sama.
   - Buka alamat IP HP Anda di browser laptop, contoh: **`http://192.168.43.1:3000`** *(Alamat IP tampil otomatis saat menjalankan `./termux-start.sh`)*.

---

## 📋 Langkah 8: Uji Coba Simulasi Data Sensor

Untuk memverifikasi bahwa bridge berfungsi sempurna tanpa harus menyalakan motor/ESP32:

1. Buka sesi baru (tab baru) di Termux (geser dari tepi kiri layar, klik *New Session*).
2. Masuk ke folder MAVIS dan jalankan simulator:
   ```bash
   cd ~/MAVIS
   npm run simulate
   ```
3. Buka halaman dashboard di browser `http://localhost:3000` dan perhatikan pergerakan motor di peta serta grafik telemetri yang terupdate setiap detik!

---

## 📋 Langkah 9: (Opsional) Menjalankan Sebagai Background Daemon dengan PM2

Agar server bridge otomatis menyala kembali jika terjadi crash:

1. Install PM2 secara global di Termux:
   ```bash
   npm install -g pm2
   ```
2. Jalankan MAVIS Bridge dengan PM2:
   ```bash
   pm2 start index.js --name "mavis-bridge"
   ```
3. Perintah pemantauan PM2:
   - Melihat log output: `pm2 logs mavis-bridge`
   - Melihat status: `pm2 status`
   - Menghentikan bridge: `pm2 stop mavis-bridge`
   - Menghidupkan ulang: `pm2 restart mavis-bridge`

---

## 🔧 Troubleshooting Masalah Khusus Termux

| Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| `EADDRINUSE: 3000` | Port 3000 masih digunakan proses lama | Matikan proses Node sebelumnya dengan `pkill node` atau `killall node`. |
| Server mati saat layar HP terkunci | OS Android mematikan proses di background | Jalankan `termux-wake-lock` dan atur baterai Termux menjadi *Unrestricted* di pengaturan HP. |
| `gyp ERR! build error` saat `npm install` | Compiler C++ belum terpasang | Jalankan `pkg install make clang python -y` lalu ulangi `npm install`. |
| Tidak bisa dibuka dari Laptop | Firewall / IP salah | Pastikan laptop dan HP terhubung ke Wi-Fi / Hotspot yang sama dan gunakan IP yang sesuai. |
