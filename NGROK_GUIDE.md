# 🌐 Panduan Publikasi MAVIS Web & API Menggunakan Ngrok (Online untuk Semua Orang)

Panduan ini menjelaskan cara membuka akses **MAVIS (Motorcycle Advanced Warning & Intelligence System) Dashboard & Stream Bridge** agar dapat diakses dari mana saja melalui internet menggunakan **Ngrok Tunneling** (HTTPS aman & WebSocket WSS), baik saat bridge berjalan di **Laptop / Windows** maupun di **Android Termux**.

---

## 🗺️ Cara Kerja Ngrok Tunneling

```
[ Pengguna / Publik di Seluruh Dunia ]
                  │
                  ▼ (HTTPS / WSS Publik)
    https://xxxx.ngrok-free.app
                  │
                  ▼ (Secure Encrypted Tunnel)
[ Ngrok Agent (di Laptop atau Termux) ]
                  │
                  ▼ (Local Port 3000)
[ MAVIS Local Bridge (Node.js Express + WebSocket) ]
```

---

## 📋 Langkah 1: Daftar Akun & Ambil Authtoken Ngrok (Gratis)

1. Buka situs [https://ngrok.com/](https://ngrok.com/) dan buat akun gratis (*Sign Up*).
2. Setelah login, masuk ke menu **Dashboard > Your Authtoken**:
   [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Salin (Copy) kode **Authtoken** Anda (contoh: `2tXXXXXXXXXXXXX_YYYYYYYYYYYYYYYY`).

---

## 💻 Opsi A: Menjalankan Ngrok di Laptop / Windows

Jika MAVIS Bridge berjalan di laptop Anda:

### 1. Unduh & Pasang Ngrok di Windows
Pilih salah satu cara termudah:
- **Cara 1 (Windows Terminal / PowerShell via winget):**
  ```powershell
  winget install ngrok.ngrok
  ```
- **Cara 2 (NPM Global):**
  ```bash
  npm install -g ngrok
  ```
- **Cara 3 (Manual Download):** Unduh file ZIP dari [https://ngrok.com/download](https://ngrok.com/download) dan ekstrak `ngrok.exe` ke folder proyek MAVIS.

### 2. Hubungkan Authtoken
Buka Terminal / PowerShell di folder MAVIS dan jalankan:
```bash
ngrok config add-authtoken KODE_AUTHTOKEN_ANDA
```

### 3. Mulai Tunneling Port 3000
Pastikan server MAVIS Bridge sudah berjalan (`npm start` atau `npm run dev`), lalu di jendela terminal baru jalankan:
```bash
ngrok http 3000
```

Terminal akan menampilkan URL publik:
```text
Forwarding   https://a1b2-xxx-xxx.ngrok-free.app -> http://localhost:3000
```
> 🔗 Bagikan tautan `https://a1b2-xxx-xxx.ngrok-free.app` tersebut ke siapa saja untuk membuka Dashboard MAVIS secara online!

---

## 📱 Opsi B: Menjalankan Ngrok Langsung di HP Android (Termux)

Jika MAVIS Bridge berjalan di Termux:

### 1. Unduh & Pasang Ngrok Linux ARM64 di Termux
Jalankan perintah ini di Termux:
```bash
# 1. Unduh binary ngrok ARM64 untuk Android/Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz

# 2. Ekstrak file binary
tar -xvzf ngrok-v3-stable-linux-arm64.tgz

# 3. Pindahkan ke direktori bin Termux agar dapat dipanggil dari mana saja
mv ngrok $PREFIX/bin/
chmod +x $PREFIX/bin/ngrok

# 4. Hapus arsip installer
rm ngrok-v3-stable-linux-arm64.tgz
```

### 2. Hubungkan Authtoken di Termux
```bash
ngrok config add-authtoken KODE_AUTHTOKEN_ANDA
```

### 3. Jalankan Tunneling
1. Buat sesi (tab) baru di Termux (*Swipe dari kiri layar > New Session*).
2. Jalankan:
   ```bash
   ngrok http 3000
   ```
3. Salin URL HTTPS yang muncul (contoh `https://c3d4-xxx.ngrok-free.app`).

---

## 🌟 Tips: Mendapatkan Domain Publik Permanen / Tetap (Gratis)

Secara default, URL Ngrok gratis berubah-ubah setiap kali Anda restart. Anda bisa mengklaim **1 Free Static Domain** dari Ngrok agar tautan tidak pernah berubah:

1. Buka [Ngrok Dashboard > Domains](https://dashboard.ngrok.com/cloud-edge/domains).
2. Klik **Claim Domain** (misal Anda mendapatkan: `mavis-iot-live.ngrok-free.app`).
3. Jalankan ngrok dengan domain tetap tersebut:
   ```bash
   ngrok http --domain=mavis-iot-live.ngrok-free.app 3000
   ```
Sekarang URL website MAVIS Anda akan selalu permanen di `https://mavis-iot-live.ngrok-free.app`! 🚀

---

## 🧭 Halaman & Fitur yang Dapat Diakses Publik

Setelah dibuka via URL Ngrok HTTPS:
- 🏠 **Live Telemetry & Leaflet Map:** `https://<domain-ngrok>/`
- 📜 **Trip History:** `https://<domain-ngrok>/history`
- 📊 **Analytics & Metrics:** `https://<domain-ngrok>/analytics`
- 📟 **Realtime MQTT/WS Terminal:** `https://<domain-ngrok>/terminal`
- ⚙️ **Remote Config Settings:** `https://<domain-ngrok>/settings` *(Dilindungi passcode `mavis-01-001-26`)*
- ⚡ **WebSocket Live Alerts:** `wss://<domain-ngrok>/api/stream/alerts` *(Otomatis aktif)*

---

## 🔧 Catatan Penting Saat Mengakses Ngrok

1. **Peringatan *Ngrok Free Interstitial*:**
   Saat pertama kali membuka link di browser, Ngrok akan menampilkan tombol persetujuan *"Visit Site"*. Cukup klik **Visit Site** sekali, dan dashboard MAVIS akan langsung terbuka normal.
2. **Koneksi WebSocket WSS:**
   Aplikasi frontend MAVIS sudah dikonfigurasi mendeteksi protokol `https:` dan otomatis mengalihkan WebSocket ke `wss://` sehingga live alert bekerja tanpa error CORS/Mixed-Content.
