#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# MAVIS Local Bridge - Termux Startup Script
# ==============================================================================

# Kunci CPU agar server tetap berjalan saat layar HP dimatikan
termux-wake-lock 2>/dev/null || true

# Tampilkan informasi alamat IP lokal
IP_LOCAL=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
PORT_VAL=${PORT:-3000}

echo "========================================================"
echo " 🏍️  MAVIS Real-Time Stream Processing Bridge (Termux)"
echo "========================================================"
echo " [✓] Wake Lock Diaktifkan (Background Keep-Alive)"
echo " [✓] Akses dari HP ini:       http://localhost:${PORT_VAL}"
if [ -n "$IP_LOCAL" ]; then
  echo " [✓] Akses dari Laptop / PC:  http://${IP_LOCAL}:${PORT_VAL}"
fi
echo "========================================================"
echo ""

# Jalankan node server
node index.js
