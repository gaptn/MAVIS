# MAVIS Telemetry - Pusat Bantuan & Panduan Penggunaan

Selamat datang di Pusat Bantuan **MAVIS (Motorcycle Advanced Warning & Intelligence System)**. Dokumen ini menyajikan panduan pengoperasian sistem, batas parameter fisika keselamatan berkendara, serta acuan peraturan hukum lalu lintas yang relevan.

---

## 1. Panduan Penggunaan WebApp MAVIS

Sistem MAVIS dirancang sebagai antarmuka pemantauan telemetri real-time 2-arah antara perangkat *Edge Computing* (ESP32-S3) dan Web Application.

*   **Beranda (Dashboard Utama)**:
    Menampilkan status telemetri secara real-time termasuk pengukur Kecepatan (Speedometer), Sudut Kemiringan (*Roll Angle*), Sudut Pitch, Percepatan G-Force, lokasi peta live, dan indikator status koneksi MQTT Broker/Firebase.
*   **Log Kejadian (History)**:
    Menyajikan daftar catatan insiden dan peringatan keselamatan berkendara. Halaman ini hanya memuat log saat terjadi kondisi *Waspada* atau *Bahaya*, dilengkapi fitur penyaringan ganda (Filter Level & Jenis Peringatan) serta fitur **Export CSV** (data terfilter atau raw 1Hz).
*   **Analisis Data (Analytics)**:
    Visualisasi skor keselamatan berkendara (*Riding Safety Score* 0-100), grafik korelasi Kecepatan vs Sudut Kemiringan, *Heatmap* gaya berkendara, serta filter dinamis berdasarkan **Sesi** (Per Hari / Per Trip) dan **Rentang Waktu** (Today, Weekly, Monthly).
*   **Terminal Live**:
    Konsol pemantauan aliran data *raw stream* JSON MQTT untuk keperluan pengujian dan debugging teknis langsung dari perangkat ESP32-S3.
*   **Pengaturan Perangkat (Settings)**:
    Fitur kontrol parameter ambang batas keselamatan sistem. Perubahan nilai sensitivitas getaran (*Vibration RMS Multiplier*) dan Sudut Kemiringan Maksimum (*Max Safe Lean Angle*) dilindungi oleh kode verifikasi keamanan khusus (`mavis-01-001-26`).

---

## 2. Batas Aman Berkendara (Parameter Fisika MAVIS)

Pengukuran telemetri MAVIS dihitung secara lokal oleh unit ESP32-S3 dan dikelompokkan ke dalam ambang batas keselamatan berikut:

| Parameter | Ambang Aman (Normal) | Ambang Waspada (Warning) | Ambang Bahaya (Danger) |
| :--- | :--- | :--- | :--- |
| **Sudut Kemiringan (*Roll*)** | $0^\circ \text{ s/d } 35^\circ$ | $35^\circ \text{ s/d } 45^\circ$ | $> 45^\circ$ (Terjatuh / Crash) |
| **Kecepatan Berkendara** | $0 \text{ s/d } 60 \text{ km/jam}$ | $60 \text{ s/d } 80 \text{ km/jam}$ | $> 80 \text{ km/jam}$ (Overspeed) |
| **Percepatan / Getaran G-Force** | $< 1.5 \text{ G}$ | $1.5 \text{ G s/d } 2.5 \text{ G}$ | $> 2.5 \text{ G}$ (Tumbukan / Impact) |

*Catatan: Apabila sepeda motor mempertahankan sudut kemiringan di atas $45^\circ$ selama lebih dari 3 detik saat kecepatan nol, sistem secara otomatis mendeteksi kondisi sepeda motor roboh/terjatuh (*Tipping Event*) dan mencatat alert Bahaya.*

---

## 3. Peraturan Undang-Undang Berkendara

Guna mewujudkan keselamatan berkendara (*Safety Riding*), operasional MAVIS mengacu pada regulasi Republik Indonesia:

1.  **UU No. 22 Tahun 2009 tentang Lalu Lintas dan Angkutan Jalan (LLAJ)**:
    *   **Pasal 105**: Setiap orang yang menggunakan jalan wajib berperilaku tertib dan mencegah hal-hal yang dapat menghambat, membahayakan keselamatan, atau merusak jalan.
    *   **Pasal 106 Ayat 1**: Setiap orang yang mengemudikan Kendaraan Bermotor di Jalan wajib mengemudikan kendaraannya dengan wajar dan penuh konsentrasi.
    *   **Pasal 107 Ayat 2**: Pengemudi Sepeda Motor wajib menyalakan lampu utama pada siang hari.
2.  **Permenhub No. 111 Tahun 2015 tentang Tata Cara Penetapan Batas Kecepatan**:
    *   Batas kecepatan paling tinggi di kawasan pemukiman: **30 km/jam**.
    *   Batas kecepatan paling tinggi di kawasan perkotaan: **50 km/jam**.
    *   Batas kecepatan paling tinggi di jalan antarkota: **80 km/jam**.

---

## 4. Kontak Pengembang & Dukungan Teknis

Aplikasi MAVIS dikembangkan sebagai bagian dari proyek inovasi teknologi keselamatan transportasi roda dua **SIAP MAS / OPSI 26**.

*   **Peneliti / Pengembang Utama**: Ega Aptana Habibun Nazar
*   **Tim Proyek**: SIAP MAS Team (OPSI 26)
*   **Email Dukungan**: `fulanbinfulan@gmail.com`
*   **Repositori**: MAVIS Telemetry IoT System
