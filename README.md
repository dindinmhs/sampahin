# Sampahin

**Sampahin** adalah platform web kolaboratif berbasis AI yang memungkinkan pengguna untuk melakukan *grading* kebersihan lokasi dan beraksi bersama melalui peta interaktif. Aplikasi ini bertujuan untuk mendorong partisipasi masyarakat dalam menjaga kebersihan lingkungan dengan fitur-fitur cerdas dan kolaboratif.

---

## Fitur Utama

- **Peta Interaktif Lokasi**  
  Menampilkan titik-titik lokasi yang telah dinilai dan memungkinkan pengguna menavigasi ke lokasi tersebut.

- **Grading Kebersihan dengan AI**  
  Upload atau foto lokasi sekitar, lalu gunakan AI untuk menganalisis dan memberikan nilai kebersihan (A–D).

- **Aksi Bersih dan Pelaporan**  
  Pengguna dapat mendatangi lokasi kotor dan melakukan aksi bersih bersama, lalu melaporkannya.

- **Komunitas dan Chat**  
  Bergabung dalam percakapan komunitas untuk berkolaborasi, berbagi info, dan saling memotivasi.

- **Pemindaian Sampah AI**  
  Gunakan kamera untuk mengenali jenis sampah dan dapatkan panduan daur ulang dan reuse.

- **Misi Harian & Gamifikasi**  
  Selesaikan misi seperti upload foto tempat kotor, bersihkan lokasi, atau kirim pesan di komunitas untuk mendapatkan poin.

---

## Struktur Path Halaman

| Path                         | Deskripsi Halaman                                      |
|-----------------------------|---------------------------------------------------------|
| `/`                         | Halaman utama / landing page                            |
| `/map`                      | Peta lokasi kebersihan dan titik aksi                   |
| `/grading`                  | Upload foto dan grading kebersihan menggunakan AI       |
| `/scan-sampah`              | Pemindaian sampah menggunakan kamera + AI               |
| `/profile`                  | Profil pengguna dan riwayat aktivitas                   |
| `/tukar-poin`               | Untuk menukar poin dengan hadiah                        |
| `/riwayat-poin`             | Untuk melihat riwayat transaksi poin                    |
| `/auth/login`               | Login pengguna                                          |
| `/auth/sign-up`             | Registrasi pengguna baru                                |

---

## Tech Stack

- **Frontend:** Next.js + Tailwind CSS + React Leaflet
- **Backend:** Supabase  
- **AI Model:** Google Gemini (Gemma 3)

---

**Note:**  
Untuk mencoba fitur **Bersihkan** atau **Update Laporan**, jika tidak terdapat lokasi tempat dalam radius 100 meter dari posisi Anda:  
- Anda bisa membuat **grade kebersihan baru** dengan lokasi yang dekat dengan posisi Anda saat ini.  
- Atau, gunakan **fake GPS** (misalnya melalui browser developer tools atau aplikasi mock location) agar sistem mendeteksi Anda berada dekat dengan lokasi yang ingin diuji.
