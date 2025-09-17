# Sampahin

**Sampahin** adalah platform web kolaboratif berbasis AI yang memungkinkan pengguna untuk melakukan _grading_ kebersihan lokasi dan beraksi bersama melalui peta interaktif. Aplikasi ini bertujuan untuk mendorong partisipasi masyarakat dalam menjaga kebersihan lingkungan dengan fitur-fitur cerdas dan kolaboratif.

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

- **Leaderboard & Kompetisi**  
  Lihat peringkat pengguna berdasarkan poin yang dikumpulkan dari aktivitas membersihkan lingkungan dan berkontribusi pada komunitas.

- **AI Chatbot Asisten**  
  Chatbot cerdas yang dapat membantu menjawab pertanyaan tentang kebersihan lingkungan, cara mengelola sampah, dan tips ramah lingkungan.

---

## Struktur Path Halaman

| Path            | Deskripsi Halaman                                 |
| --------------- | ------------------------------------------------- |
| `/`             | Halaman utama / landing page                      |
| `/map`          | Peta lokasi kebersihan dan titik aksi             |
| `/grading`      | Upload foto dan grading kebersihan menggunakan AI |
| `/scan-sampah`  | Pemindaian sampah menggunakan kamera + AI         |
| `/profile`      | Profil pengguna dan riwayat aktivitas             |
| `/leaderboard`  | Peringkat pengguna berdasarkan poin aktivitas     |
| `/tukar-poin`   | Untuk menukar poin dengan hadiah                  |
| `/riwayat-poin` | Untuk melihat riwayat transaksi poin              |
| `/auth/login`   | Login pengguna                                    |
| `/auth/sign-up` | Registrasi pengguna baru                          |

---

## Tech Stack

- **Frontend:** Next.js + Tailwind CSS + React Leaflet
- **Backend:** Supabase
- **AI Model:** Google Gemini (Gemma 3)

---

## Cara Menjalankan Aplikasi

### Prerequisites

Pastikan Anda telah menginstall:

- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### 1. Clone Repository

```bash
git clone https://github.com/dindinmhs/sampahin.git
cd sampahin
```

### 2. Install Dependencies

```bash
npm install
```

atau dengan yarn:

```bash
yarn install
```

### 3. Setup Environment Variables

1. Copy file `.env.example` menjadi `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit file `.env.local` dan isi dengan nilai yang sesuai:

   **Supabase Setup:**

   - Buat akun di [Supabase](https://supabase.com/)
   - Buat project baru
   - Dapatkan URL dan Anon Key dari dashboard project
   - Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   **Google Gemini API:**

   - Kunjungi [Google AI Studio](https://aistudio.google.com/apikey)
   - Buat API key baru
   - Isi `GEMINI_API_KEY` dan `NEXT_PUBLIC_GEMINI_API_KEY`

   **Google Cloud (Opsional):**

   - Untuk fitur AI yang lebih canggih, setup Google Cloud Project
   - Isi `GOOGLE_CLOUD_PROJECT_ID` dan credential yang diperlukan

### 4. Setup Database (Supabase)

1. Login ke dashboard Supabase Anda
2. Buat tabel-tabel yang diperlukan sesuai dengan skema database aplikasi
3. Setup authentication jika belum ada
4. Enable Row Level Security (RLS) jika diperlukan

### 5. Jalankan Aplikasi

**Development Mode:**

```bash
npm run dev
```

atau dengan yarn:

```bash
yarn dev
```

Aplikasi akan berjalan di `http://localhost:3000`

**Production Build:**

```bash
npm run build
npm run start
```

### 6. Testing Fitur

Setelah aplikasi berjalan, Anda dapat:

1. **Registrasi/Login** - Buat akun baru atau login
2. **Explore Map** - Lihat peta interaktif lokasi kebersihan
3. **Grading Kebersihan** - Upload foto untuk analisis AI
4. **Scan Sampah** - Gunakan kamera untuk identifikasi sampah
5. **Join Community** - Bergabung dalam chat komunitas
6. **Leaderboard** - Lihat peringkat pengguna dan kompetisi poin
7. **AI Chatbot** - Gunakan chatbot untuk bantuan dan informasi lingkungan

### Troubleshooting

- **Error Supabase Connection**: Pastikan URL dan API key sudah benar
- **Error Gemini AI**: Pastikan API key valid dan memiliki quota
- **Error Map**: Pastikan browser mengizinkan akses lokasi
- **Error Upload**: Periksa ukuran file (max 50MB) dan koneksi internet

---

**Note:**  
Untuk mencoba fitur **Bersihkan** atau **Update Laporan**, jika tidak terdapat lokasi tempat dalam radius 100 meter dari posisi Anda:

- Anda bisa membuat **grade kebersihan baru** dengan lokasi yang dekat dengan posisi Anda saat ini.
- Atau, gunakan **fake GPS** (misalnya melalui browser developer tools atau aplikasi mock location) agar sistem mendeteksi Anda berada dekat dengan lokasi yang ingin diuji.
