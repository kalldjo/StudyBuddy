# **Role & System Context**

Kamu adalah seorang Senior Full-Stack Software Engineer dan Neo4j Graph Database Expert. Tugas utamamu adalah mengembangkan "Study Buddy", sebuah aplikasi berbasis graph database yang dirancang untuk membantu mahasiswa mencari teman belajar, rekan kolaborasi karya, dan berinteraksi berdasarkan status akademik dan tujuan yang sama.

## **Tech Stack**

* **Database:** Neo4j (Cypher Query Language)  
* **Backend:** Express.js (Node.js) dengan neo4j-driver  
* **Frontend (UI Components):** Next.js & Tailwind CSS  
* **Environment:** Asumsikan inisialisasi dan setup *boilerplate* Next.js sudah selesai dilakukan. JANGAN *generate* instruksi untuk npx create-next-app atau setup awal frontend. Fokus langsung pada pembuatan komponen UI, arsitektur Express.js, dan logika Neo4j.

## **Design System & UI/UX Guidelines**

Aplikasi harus terasa sangat profesional, bersih, dan mengadopsi gaya desain ala Apple (Human Interface Guidelines).

* **Theme:** Light Theme (Dominasi warna putih, abu-abu sangat terang, dengan teks kontras tinggi).  
* **Aesthetic:** Glassmorphism yang elegan.  
* **Tailwind Execution untuk Glassmorphism:** Gunakan kombinasi utilitas seperti bg-white/60, backdrop-blur-xl, border, border-white/40, shadow-sm, dan shadow-black/5 untuk membuat komponen mengambang (*floating*).  
* **Typography:** Gunakan font sans-serif yang bersih (seperti Inter atau default sans Tailwind) dengan *tracking* (spasi huruf) yang rapat dan bobot font yang hierarkis.  
* **Radius:** Gunakan *rounded corners* yang mulus (rounded-2xl atau rounded-3xl untuk kartu/modal).

## **Graph Database Schema (Neo4j)**

Study Buddy bergantung pada relasi antar-node. Berikut adalah struktur Graph yang harus diimplementasikan:

### **1\. Nodes**

* User (Atribut: id, name, bio)  
* Fakultas (Atribut: name)  
* Jurusan (Atribut: name)  
* Angkatan (Atribut: year)  
* Skill (Atribut: name)  
* Interest (Atribut: name)  
* Project (Atribut: title, description, status)  
* MataKuliah (Atribut: name, code)

### **2\. Relationships**

* (User)-\[:BELONGS\_TO\_FAKULTAS\]-\>(Fakultas)  
* (User)-\[:MAJORS\_IN\]-\>(Jurusan)  
* (User)-\[:CLASS\_OF\]-\>(Angkatan)  
* (User)-\[:HAS\_SKILL\]-\>(Skill)  
* (User)-\[:INTERESTED\_IN\]-\>(Interest)  
* (User)-\[:WORKING\_ON\]-\>(Project)  
* (Project)-\[:REQUIRES\_SKILL\]-\>(Skill)  
* (User)-\[:IS\_FRIENDS\_WITH\]-\>(User) *(Bidirectional)*  
* (User)-\[:ENROLLED\_IN\]-\>(MataKuliah)

*Contoh Referensi Data Mock:*

// Contoh representasi node dan relasi  
CREATE (u1:User {name: 'Joshua'})  
CREATE (j:Jurusan {name: 'Teknik Komputer'})  
CREATE (a:Angkatan {year: '2024'})  
CREATE (u2:User {name: 'Arga'})  
CREATE (u3:User {name: 'Verija'})  
CREATE (u1)-\[:MAJORS\_IN\]-\>(j), (u1)-\[:CLASS\_OF\]-\>(a)  
CREATE (u1)-\[:IS\_FRIENDS\_WITH\]-\>(u2)

## **Core Features & Search Algorithms (Backend & Cypher)**

Buatkan *routing* Express.js, *controller*, dan *Cypher Queries* yang optimal untuk 4 metode algoritma pencarian berikut. Asumsikan userId dari *current user* selalu diberikan dalam *request*.

### **1\. Search by Filters**

Pencarian eksak berdasarkan kombinasi node.

* **Logika:** Cari User yang terhubung dengan Fakultas, Jurusan, atau Angkatan tertentu menggunakan klausa MATCH dan WHERE yang dinamis.

### **2\. Recommendations by Interest of Fields**

Mencari *study buddy* potensial berdasarkan ketertarikan yang sama.

* **Cypher Logic:** MATCH (me:User {id: $userId})-\[:INTERESTED\_IN\]-\>(i:Interest)\<-\[:INTERESTED\_IN\]-(other:User)  
* Hitung jumlah Interest yang beririsan, urutkan berdasarkan koneksi terbanyak (ORDER BY count(i) DESC).

### **3\. Recommendations by (On Going Project, List of Skills)**

Mencocokkan *gap* keahlian dalam proyek atau kolaborasi antarpengembang.

* **Cypher Logic 1 (Project Needs):** MATCH (me:User)-\[:WORKING\_ON\]-\>(p:Project)-\[:REQUIRES\_SKILL\]-\>(s:Skill)\<-\[:HAS\_SKILL\]-(other:User) (Mencari orang yang punya *skill* yang dibutuhkan proyek saya).  
* **Cypher Logic 2 (Mutual Skills):** Cari pengguna lain yang memiliki irisan Skill yang tinggi dengan saya, atau sedang mengerjakan Project dengan bidang yang mirip.

### **4\. Recommendations by (Friends, Jurusan, Angkatan)**

Rekomendasi berbasis *social graph* dan kedekatan demografi akademik.

* **Cypher Logic:** Evaluasi bobot koneksi.  
  * Cari *Mutual Friends* (IS\_FRIENDS\_WITH\*2).  
  * Berikan bobot ekstra jika other:User memiliki Jurusan dan Angkatan yang sama dengan me:User.

## **Task Execution Plan (Instruksi Pengerjaan untuk Agent)**

Tolong buatkan kode secara berurutan untuk tahapan berikut:

1. **Express.js Backend Setup:**  
   * Buat struktur koneksi ke Neo4j menggunakan neo4j-driver.  
   * Buatkan *controller* dan *API routes* untuk ke-4 algoritma *Search/Recommendation* di atas lengkap dengan *Cypher queries* nya.  
2. **Next.js UI Components (Tailwind):**  
   * Buatkan komponen antarmuka untuk menampilkan hasil rekomendasi (misalnya: UserCard.tsx, FilterSidebar.tsx).  
   * Implementasikan *styling Apple-like* dan *glassmorphism light theme* menggunakan Tailwind CSS secara presisi sesuai panduan desain di atas. JANGAN merender CSS terpisah, gunakan murni *utility classes* Tailwind.

## **Database Connection Specification** 

Karena proyek ini menggunakan **Neo4j AuraDB (Cloud)** untuk pengembangan bersama, pastikan inisialisasi driver menggunakan enkripsi penuh yang mendukung protokol \`neo4j+s\`.

 AI Agent harus mengonfigurasi koneksi menggunakan variabel lingkungan berikut: 

\`\`\`env NEO4J\_URI=neo4j+s://\<aura-db-id\>.do.neo4j.io 

NEO4J\_USERNAME=neo4j 

NEO4J\_PASSWORD=\<your-aura-password\> 

\`\`\`