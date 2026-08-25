#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MAVIS Local Bridge - Termux Automated Setup Script
# ==============================================================================

echo "========================================================"
echo " 🏍️  MAVIS Local Bridge - Setup Lingkungan Termux"
echo "========================================================"

# 1. Update paket Termux
echo "[1/5] Memperbarui repositori paket Termux..."
pkg update -y && pkg upgrade -y

# 2. Install Node.js LTS, Git, dan dependensi build
echo "[2/5] Menginstal Node.js LTS, Git, dan build tools..."
pkg install nodejs-lts git python make clang libuv -y

# 3. Setup Wake Lock agar Termux tidak tertidur saat layar mati
echo "[3/5] Mengaktifkan Termux Wake Lock..."
termux-wake-lock 2>/dev/null || true

# 4. Install npm dependencies
echo "[4/5] Menginstal dependensi NPM MAVIS Bridge..."
npm install

# 5. Cek file .env
echo "[5/5] Memeriksa konfigurasi environment (.env)..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "⚠️  File .env baru saja dibuat dari .env.example."
    echo "   Silakan edit .env dengan kredensial Anda (misal: nano .env)"
  else
    echo "⚠️  File .env belum ada. Pastikan membuat file .env sebelum menjalankan bridge."
  fi
else
  echo "✅ File .env ditemukan."
fi

# Berikan izin eksekusi untuk skrip start
chmod +x termux-start.sh 2>/dev/null || true

echo ""
echo "========================================================"
echo "🎉 Instalasi Selesai!"
echo "Untuk menjalankan MAVIS Bridge di Termux:"
echo "   ./termux-start.sh"
echo "   atau: npm start"
echo "========================================================"
