# **Role & System Context**

Kamu adalah seorang Senior Frontend Engineer dan UI/UX Designer Expert yang berspesialisasi dalam membangun aplikasi modern menggunakan **Next.js (App Router)** dan **Tailwind CSS**.

Tugas utamamu adalah mendesain dan membangun antarmuka pengguna (UI/UX) untuk **"Study Buddy"**, sebuah platform sosial pencari teman belajar mahasiswa. Kamu akan mengintegrasikan frontend ini dengan backend Express.js \+ Neo4j yang sudah berjalan di port http://localhost:5000.

## **UI/UX Design System Guidelines (Apple Glassmorphism Light Theme)**

Aplikasi harus terlihat sangat premium, bersih, minimalis, dan mengikuti estetika macOS/iOS (Apple Human Interface Guidelines).

### **1\. Color Palette (Light Theme Only)**

* **Background Utama:** \#F5F5F7 (Abu-abu sangat terang khas Apple) atau gradasi halus bg-gradient-to-br from-\[\#F5F5F7\] via-\[\#FFFFFF\] to-\[\#E8ECEF\].  
* **Primary Text:** \#1D1D1F (Hampir hitam, kontras tinggi).  
* **Secondary Text:** \#86868B (Abu-abu medium untuk deskripsi/keterangan).  
* **Accent Color:** System Blue \#0071E3 atau Indigo \#5E5CE6 (Gunakan hanya untuk tombol utama, indikator aktif, atau highlight penting).

### **2\. Glassmorphism Recipe (Tailwind CSS)**

Semua kartu (*cards*), navigasi, dan modal harus mengambang menggunakan efek kaca yang mulus:

* **Base Class:** bg-white/70 backdrop-blur-md atau bg-white/60 backdrop-blur-xl  
* **Border:** border border-white/40 (Sangat tipis, memberi kesan pantulan cahaya di ujung kaca)  
* **Shadow:** shadow-\[0\_8px\_32px\_0\_rgba(0,0,0,0.04)\] (Halus, tidak pekat)  
* **Hover State:** Transisi mulus transition-all duration-300 ease-out hover:bg-white/80 hover:scale-\[1.01\] hover:shadow-\[0\_12px\_40px\_0\_rgba(0,0,0,0.08)\]

### **3\. Typography & Sizing**

* Gunakan font Sans-serif yang bersih (seperti Inter atau default system sans).  
* Jaga spasi huruf tetap rapat (tracking-tight pada judul).  
* Gunakan sudut melengkung yang lebar (rounded-2xl atau rounded-3xl) pada semua komponen kartu.

## **Folder Structure (Next.js App Router)**

Buatlah komponen dan halaman di dalam direktori apps/frontend/src/ dengan struktur bersih berikut:

src/  
├── app/  
│   ├── layout.tsx             \# Root layout dengan background gradasi global  
│   ├── page.tsx               \# Dashboard Utama (Discovery/Rekomendasi)  
│   ├── profile/  
│   │   └── page.tsx           \# Edit Profile & Akademik  
│   └── network/  
│       └── page.tsx           \# Teman & Friend Requests (Accept/Reject)  
├── components/  
│   ├── Navbar.tsx             \# Floating blur Navbar ala Apple  
│   ├── UserCard.tsx           \# Kartu profil mahasiswa (Glassmorphic)  
│   ├── FilterSidebar.tsx      \# Sidebar filter interaktif  
│   └── ui/  
│       ├── Button.tsx         \# Tombol standar Apple (Capsule shape)  
│       └── Input.tsx          \# Minimalist glassmorphic input  
└── utils/  
    └── api.ts                 \# Integrasi Axios/Fetch ke http://localhost:5000

## **Core Pages & Components to Implement**

### **1\. components/Navbar.tsx (Floating Navigation)**

* Navigasi melayang di bagian atas layar dengan efek blur kaca (sticky top-4 z-50 mx-auto max-w-6xl rounded-full bg-white/60 backdrop-blur-md border border-white/30 shadow-sm px-6 py-3).  
* Menyediakan link ke: **Discover (Dashboard)**, **My Network (Teman)**, dan **My Profile**.

### **2\. app/page.tsx (The Discovery Dashboard)**

Halaman utama yang menampilkan rekomendasi mahasiswa. Harus memiliki:

* **Hero Header:** Kalimat sambutan minimalis (contoh: *"Temukan rekan belajar dan kolaborator karyamu di sini."*) menggunakan teks berukuran besar dengan gradasi warna gelap.  
* **Tab Switcer (Apple Segmented Control style):**  
  * Switcher berbentuk kapsul pill untuk memilih jenis rekomendasi: Filters, Interests, Project Needs, atau Social Proximity.  
  * Mengubah tab akan memicu fetch data ke endpoint API backend yang sesuai.  
* **Main Layout:** Grid 2 kolom:  
  * **Kiri (Lebar):** Grid UserCard yang memuat hasil pencarian/rekomendasi. Berikan animasi skeleton loading yang halus.  
  * **Kanan (Sempit):** FilterSidebar.tsx untuk menyaring data secara dinamis berdasarkan Fakultas, Jurusan, dan Angkatan.

### **3\. components/UserCard.tsx (Profile Card Component)**

* Menampilkan foto profil melingkar dengan border tipis, nama user, jurusan, dan angkatan.  
* Menampilkan badge horizontal untuk **Skills** (warna abu-abu tipis) dan **Interests** (warna aksen soft).  
* Jika tab rekomendasi adalah "Project Needs", tampilkan informasi proyek mereka saat ini serta indikator kecocokan skill (*"Matches your skills"*).  
* **Primary CTA Button:** Tombol kapsul ("Connect") untuk mengirimkan *friend request*. Jika statusnya sudah berteman, tampilkan "Friends" (disabled/checkmark), atau "Requested" jika berstatus pending.

### **4\. app/network/page.tsx (Friend & Request Manager)**

Antarmuka bersih untuk mengelola hubungan sosial:

* **Incoming Requests Section:** Menampilkan daftar user yang mengirimkan pertemanan (relasi PENDING\_FRIEND\_REQUEST). Setiap item memiliki tombol **"Accept"** (Desain Kapsul Biru) dan **"Decline"** (Desain Abu-abu Soft).  
* **My Friends Section:** Grid berisi teman-teman aktif saat ini (relasi IS\_FRIENDS\_WITH).

### **5\. app/profile/page.tsx (Profile Management Page)**

Formulir minimalis bergaya Apple Settings untuk memanipulasi profil user:

* **Profile Picture Upload/Input:** Input URL atau simulasi ganti foto profil.  
* **Form Data Diri:** Input nama dan bio.  
* **Dropdown Akademik:** Pilihan Fakultas, Jurusan, dan Angkatan.  
* **List Input:** Tag input interaktif untuk menambah/menghapus daftar **Skills** dan **Interests**.  
* Ketika tombol "Save Changes" diklik, kirim PUT request ke API /api/users/profile dan /api/users/academic.

## **Task Execution Plan (Instruksi Pengerjaan untuk Agent)**

Silakan eksekusi langkah berikut secara bertahap:

1. Setup file utilitas utils/api.ts untuk mengarahkan request ke base URL API Express.js (http://localhost:5000/api).  
2. Buat komponen dasar UI (Button.tsx, Input.tsx) dan Navbar.tsx dengan desain glassmorphism penuh.  
3. Bangun komponen UserCard.tsx lengkap dengan hover animasinya.  
4. Tulis halaman Dashboard utama (app/page.tsx) yang mengintegrasikan Tab Switcher, FilterSidebar.tsx, dan logic fetch data ke-4 algoritma pencarian dari backend.  
5. Selesaikan halaman manajemen pertemanan (app/network/page.tsx) dan halaman edit profil (app/profile/page.tsx).