# Smart Disaster Risk Prediction System

Dokumentasi lengkap untuk sistem prediksi risiko bencana berbasis web dengan dukungan AI/ML. Sistem ini dirancang untuk memprediksi dan memantau risiko bencana alam di Indonesia berdasarkan parameter lingkungan.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Teknologi yang Digunakan](#2-teknologi-yang-digunakan)
3. [Struktur Proyek](#3-struktur-proyek)
4. [Instalasi dan Menjalankan](#4-instalasi-dan-menjalankan)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [API Documentation](#6-api-documentation)
7. [Frontend Pages](#7-frontend-pages)
8. [Model AI/ML](#8-model-aiml)
9. [Penyimpanan Data](#9-penyimpanan-data)
10. [Panduan Pengembangan](#10-panduan-pengembangan)

---

## 1. Gambaran Umum

**Smart Disaster Risk Prediction System** adalah aplikasi full-stak untuk membantu masyarakat, pemerintah, dan instansi terkait dalam memprediksi risiko bencana alam di Indonesia. Sistem ini menggunakan model deep learning (TensorFlow/Keras) yang dilatih dengan data historis bencana dan iklim Indonesia untuk menghasilkan prediksi risiko secara real-time.

### Fitur Utama

- **Dashboard Interaktif**: Menampilkan statistik real-time, grafik jenis bencana, dan laporan terbaru.
- **Prediksi Risiko Bencana**: Input parameter lingkungan (curah hujan, suhu, kelembaban, lokasi, dll.) untuk mendapatkan penilaian risiko (Normal Risk / High Alert).
- **Peta Risiko Interaktif**: Visualisasi lokasi bencana dan laporan pengguna di seluruh Indonesia menggunakan Leaflet.js.
- **Laporan Bencana**: Sistem CRUD untuk melaporkan dan mengelola kejadian bencana.
- **Autentikasi Pengguna**: Registrasi dan login dengan JWT.

---

## 2. Teknologi yang Digunakan

| Layer | Teknologi | Versi | Keterangan |
|-------|-----------|-------|------------|
| **Frontend** | Vanilla JavaScript (ES Modules) | - | Tanpa framework |
| **Frontend Build** | Vite | 8.x | Dev server dan bundling |
| **HTTP Client** | Axios | 1.x | Interceptor JWT |
| **Peta Interaktif** | Leaflet | 1.9.4 | OpenStreetMap |
| **Grafik** | Chart.js | 4.x | Bar chart dashboard |
| **Styling** | CSS Kustom | - | 960+ baris, tidak ada CSS framework |
| **Backend** | Node.js + Express | 5.x | REST API server |
| **Autentikasi** | JWT + bcryptjs | - | Token-based auth |
| **Database** | JSON File System | - | Penyimpanan file datar di `data/` |
| **AI/ML** | Python + TensorFlow | 2.20 | Keras Sequential model |
| **AI API** | FastAPI + Uvicorn | 0.136 | REST inference service |
| **Data Processing** | Pandas, NumPy | - | Persiapan data numerik |

---

## 3. Struktur Proyek

```
smart-disaster-risk-prediction-system/
├── README.md                           # Panduan singkat
├── documentation.md                    # Dokumentasi lengkap (file ini)
├── gitignore                           # Pola git ignore
├── package-lock.json                   # Root-level lock (tidak digunakan)
│
├── backend/                            # Express.js REST API server
│   ├── .env                            # Variabel lingkungan
│   ├── package.json                    # Dependensi & script backend
│   ├── data/                           # JSON file storage (database)
│   │   ├── users.json                  # Data pengguna terdaftar
│   │   ├── disasters.json              # Data bencana
│   │   ├── reports.json                # Laporan bencana dari pengguna
│   │   └── predictions.json            # Riwayat prediksi
│   ├── src/
│   │   ├── server.js                   # Entry point utama
│   │   ├── models/
│   │   │   └── db.js                   # Abstraksi database JSON
│   │   ├── controllers/
│   │   │   ├── auth.controller.js      # Registrasi, login, profil
│   │   │   ├── report.controller.js    # CRUD laporan
│   │   │   ├── prediction.controller.js# Prediksi & riwayat
│   │   │   └── disaster.controller.js  # Data bencana
│   │   ├── routes/
│   │   │   ├── auth.routes.js          # /api/auth/*
│   │   │   ├── report.routes.js        # /api/reports/*
│   │   │   ├── prediction.routes.js    # /api/predictions/*
│   │   │   └── disaster.routes.js      # /api/disasters/*
│   │   ├── middleware/
│   │   │   └── auth.middleware.js      # Verifikasi JWT & admin
│   │   └── utils/
│   │       └── response.js             # Helper sendSuccess/sendError
│
├── frontend/                           # Vite + vanilla JS SPA
│   ├── index.html                      # Halaman dashboard utama
│   ├── package.json                    # Dependensi frontend
│   ├── vite.config.js                  # Konfigurasi Vite (proxy ke backend)
│   └── src/
│       ├── assets/                     # Gambar (favicon, logo, ilustrasi)
│       ├── styles/
│       │   └── main.css                # Stylesheet utama
│       ├── services/
│       │   └── api.js                  # Axios API client
│       ├── utils/
│       │   ├── auth.js                 # Helper autentikasi
│       │   └── format.js               # Formatter tanggal/risiko
│       └── pages/                      # Halaman HTML
│           ├── prediction.html         # Form prediksi
│           ├── map.html                # Peta risiko
│           ├── reports.html            # Laporan bencana
│           ├── login.html              # Login
│           ├── register.html           # Registrasi
│           └── js/                     # Script per halaman
│               ├── dashboard.js
│               ├── prediction.js
│               ├── map.js
│               ├── reports.js
│               ├── login.js
│               └── register.js
│
└── ai-service/                         # Python FastAPI ML service
    ├── main.py                         # FastAPI app dengan endpoint /predict
    ├── requirements.txt                # Dependensi Python
    ├── dataset_final_modelling_clean.csv  # Dataset pelatihan (20.925 baris)
    ├── notebook.ipynb                  # Jupyter notebook training
    ├── models/
    │   ├── disaster_risk_high_alert_model.keras    # Model TensorFlow
    │   └── disaster_risk_high_alert_metadata.json  # Metadata model
    └── logs/                           # TensorBoard training logs
        └── risk_high_alert/
            ├── train/
            └── validation/
```

---

## 4. Instalasi dan Menjalankan

### Prasyarat

- **Node.js** (v18 atau lebih baru)
- **Python** (3.10 atau lebih baru)
- **npm** atau **yarn**

### 4.1 Backend

```bash
cd backend
npm install
npm run dev        # Development (nodemon, hot-reload)
# atau
npm start          # Production (node langsung)
```

Backend berjalan di `http://localhost:3000`.

### 4.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Semua request `/api/*` diproksi ke backend `localhost:3000`.

### 4.3 AI Service (Opsional)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

AI Service berjalan di `http://localhost:8000`. Jika tidak dijalankan, backend akan menggunakan algoritma _rule-based fallback_.

### 4.4 Konfigurasi Environment

File `backend/.env`:

```
PORT=3000
JWT_SECRET=prediksibencana
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

---

## 5. Arsitektur Sistem

### Diagram Alur

```
Browser (port 5173)
  │
  └─> Vite Dev Server (proksi /api/*)
        │
        └─> Backend Express (port 3000)
              │
              ├─> JSON File Storage (data/*.json)
              │
              └─> AI Service FastAPI (port 8000)
                    │
                    └─> TensorFlow Model (inference)
```

### Alur Prediksi

1. User mengisi form prediksi di frontend (12 parameter lingkungan)
2. Frontend mengirim POST request ke `/api/predictions`
3. Backend meneruskan data ke AI Service (`/predict`) dengan timeout 8 detik
4. AI Service menyiapkan DataFrame, menjalankan model TensorFlow
5. Hasil prediksi (`risk_level`, `risk_probability`, `risk_score`, `recommendation`) dikembalikan
6. Jika AI Service gagal atau timeout, backend menggunakan algoritma fallback berbasis aturan
7. Hasil prediksi disimpan ke `predictions.json` dan ditampilkan ke user

### Alur Autentikasi

1. User register/login → backend membuat JWT (24 jam expiry)
2. JWT disimpan di `localStorage` frontend
3. Axios interceptor menyisipkan token di header `Authorization: Bearer <token>`
4. Middleware `authenticate` memverifikasi token di setiap request terproteksi
5. Middleware `authorizeAdmin` memeriksa role admin untuk endpoint tertentu

---

## 6. API Documentation

### 6.1 Autentikasi

Base path: `/api/auth`

#### `POST /api/auth/register`

Mendaftarkan pengguna baru.

**Request Body:**
```json
{
  "name": "string (required, min 3 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "user",
    "createdAt": "ISO date string"
  },
  "message": "Registrasi berhasil"
}
```

#### `POST /api/auth/login`

Login pengguna.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "string"
    }
  },
  "message": "Login berhasil"
}
```

#### `GET /api/auth/profile`

Mendapatkan profil pengguna (memerlukan autentikasi).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "string",
    "createdAt": "ISO date string"
  }
}
```

### 6.2 Laporan (Reports)

Base path: `/api/reports`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/reports` | - | Mendapatkan semua laporan |
| `GET` | `/api/reports/:id` | - | Mendapatkan laporan by ID |
| `POST` | `/api/reports` | Required | Membuat laporan baru |
| `PUT` | `/api/reports/:id` | Required | Mengupdate laporan |
| `DELETE` | `/api/reports/:id` | Required | Menghapus laporan |

**Request Body (POST/PUT):**
```json
{
  "location": "string (required)",
  "description": "string (required)",
  "disasterType": "string (required - flood/earthquake/fire/landslide)",
  "latitude": "number (optional)",
  "longitude": "number (optional)",
  "status": "string (optional, default: pending)"
}
```

### 6.3 Prediksi

Base path: `/api/predictions`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/predictions` | Required | Membuat prediksi baru |
| `GET` | `/api/predictions` | Required | Mendapatkan riwayat prediksi |

**Request Body (POST):**
```json
{
  "curah_hujan_mm": "number",
  "suhu_rata2_c": "number",
  "suhu_max_c": "number",
  "suhu_min_c": "number",
  "kelembaban_persen": "number",
  "hujan_akumulasi_7d_mm": "number",
  "hari_kering_berturut": "number",
  "month": "number (1-12)",
  "freq_bencana": "number",
  "province": "string",
  "city": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "riskLevel": "Normal Risk | High Alert",
    "riskScore": "number (0-100)",
    "riskProbability": "number (0-1)",
    "source": "model | fallback",
    "recommendation": "string",
    "inputData": { ... },
    "createdAt": "ISO date string"
  }
}
```

### 6.4 Bencana (Disasters)

Base path: `/api/disasters`

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/disasters` | - | Mendapatkan semua data bencana |
| `GET` | `/api/disasters/:id` | - | Mendapatkan data bencana by ID |

### 6.5 Health Check

```
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "Server is running",
    "time": "ISO date string"
  }
}
```

### 6.6 Kode Status

| Kode | Deskripsi |
|------|-----------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validasi gagal) |
| 401 | Unauthorized (token tidak valid/kadaluarsa) |
| 403 | Forbidden (bukan admin) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 7. Frontend Pages

| Halaman | File HTML | File JS | Deskripsi |
|---------|-----------|---------|-----------|
| **Dashboard** | `index.html` | `dashboard.js` | Statistik real-time, grafik Chart.js, tabel laporan terbaru |
| **Prediksi** | `prediction.html` | `prediction.js` | Form 12 parameter, hasil prediksi dengan animasi skor |
| **Peta** | `map.html` | `map.js` | Leaflet map Indonesia, marker warna berdasarkan risiko |
| **Laporan** | `reports.html` | `reports.js` | CRUD laporan bencana, tabel daftar laporan |
| **Login** | `login.html` | `login.js` | Form login dengan validasi |
| **Register** | `register.html` | `register.js` | Form registrasi dengan validasi |

### Navigasi

- Navbar dengan logo dan menu: Dashboard, Prediksi, Peta, Laporan
- Tombol Login/Register atau user menu (setelah login)
- Semua navigasi ada di setiap halaman HTML

### Tampilan Dashboard

- **4 Kartu Statistik**: Total Laporan, Zona Risiko Tinggi, Total Bencana, Status Sistem (dengan animasi counter)
- **Grafik Batang**: Distribusi jenis bencana menggunakan Chart.js
- **Tabel**: 5 laporan terbaru

### Tampilan Prediksi

- Form dengan 12 input field (province, city, lokasi, curah hujan, 3 parameter suhu, kelembaban, akumulasi 7 hari, hari kering, bulan, frekuensi bencana)
- Validasi client-side untuk semua field
- Kartu hasil dengan animasi skor, progress bar probabilitas, indikator sumber (model/fallback), dan rekomendasi bahasa Indonesia

### Tampilan Peta

- Map Leaflet berpusat di Indonesia (-2.5, 118)
- Circle markers:
  - **Merah**: Risiko tinggi (High Alert / major disaster)
  - **Amber**: Risiko sedang
  - **Hijau**: Risiko rendah / Normal Risk
- Popup dengan informasi detail saat marker diklik

---

## 8. Model AI/ML

### 8.1 Informasi Model

- **Framework**: TensorFlow 2.20 (Keras Sequential)
- **Tipe**: Binary Classification
- **Target**: `risk_alert` (0 = Normal Risk, 1 = High Alert)
- **Label Definition**: High Alert jika `risk_score > 0.35`
- **Arsitektur**: Sequential model (detail arsitektur di notebook.ipynb)

### 8.2 Dataset

- **Sumber**: `dataset_final_modelling_clean.csv`
- **Total Baris**: 20.925
- **Split**: 14.645 train / 3.138 validation / 3.141 test
- **Features (12)**:
  - **Numerik (10)**: `curah_hujan_mm`, `suhu_rata2_c`, `suhu_max_c`, `suhu_min_c`, `kelembaban_persen`, `hujan_akumulasi_7d_mm`, `hari_kering_berturut`, `month`, `quarter`, `freq_bencana`
  - **Kategorikal (2)**: `province`, `city`

### 8.3 Performa Model

| Metrik | Validation | Test |
|--------|-----------|------|
| **Accuracy** | 84.93% | 84.37% |
| **Precision** (High Alert) | - | 56.76% |
| **Recall** (High Alert) | - | 12.45% |
| **Selected Threshold** | ~0.485 | - |
| **Baseline Majority** | 83.9% | - |

> **Catatan**: Model memiliki class imbalance signifikan (83.9% Normal Risk vs 16.1% High Alert). Recall untuk kelas High Alert masih rendah (12.45%), yang berarti banyak kejadian berisiko tinggi tidak terdeteksi. Algoritma fallback berbasis aturan dapat menjadi alternatif yang lebih sensitif.

### 8.4 Algoritma Fallback

Jika AI Service tidak tersedia (timeout/error), backend menggunakan algoritma rule-based:

```javascript
score = (curah_hujan / 100) * 30 +
        (kelembaban / 100) * 20 +
        (hujan_akumulasi / 200) * 20 +
        (freq_bencana / 10) * 15 +
        (hari_kering > 30 ? 15 : 0)
```

Skor > 50 → "High Alert", sisanya "Normal Risk".

### 8.5 Endpoint AI Service

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Status service, model loaded, threshold, version |
| `GET` | `/health` | Health check |
| `GET` | `/metadata` | Metadata model lengkap |
| `POST` | `/predict` | Prediksi risiko (request sama dengan backend) |

---

## 9. Penyimpanan Data

Sistem menggunakan **flat JSON files** sebagai database, terletak di `backend/data/`.

| File | Isi |
|------|-----|
| `users.json` | Array objek user: `id, name, email, password (hashed), role, createdAt` |
| `reports.json` | Array objek laporan: `id, location, description, disasterType, lat, lng, status, userId, createdAt` |
| `disasters.json` | Array objek bencana: `id, type, location, lat, lng, severity, description, createdAt` |
| `predictions.json` | Array objek prediksi: `id, riskLevel, riskScore, riskProbability, source, recommendation, inputData, userId, createdAt` |

### Abstraksi Database (`src/models/db.js`)

- `db.collection.getAll()` → membaca dan mengembalikan semua data dari file JSON
- `db.collection.save(data)` → menulis data ke file JSON (seluruh array)
- `db.collection.findById(id)` → mencari item berdasarkan UUID
- `db.users.findByEmail(email)` → mencari user berdasarkan email

---

## 10. Panduan Pengembangan

### 10.1 Menambahkan Endpoint Baru

1. Buat controller di `backend/src/controllers/`
2. Buat route di `backend/src/routes/` dan hubungkan ke controller
3. Daftarkan route di `backend/src/server.js` dengan `app.use('/api/new-path', router)`
4. (Opsional) Tambahkan middleware auth jika perlu proteksi

### 10.2 Menambahkan Halaman Frontend Baru

1. Buat file HTML di `frontend/src/pages/`
2. Buat file JS di `frontend/src/pages/js/`
3. Tambahkan link di navbar (copy dari halaman existing)
4. Jika perlu endpoint API baru, tambahkan di `frontend/src/services/api.js`

### 10.3 Melatih Ulang Model

1. Buka `ai-service/notebook.ipynb` di Jupyter
2. Siapkan dataset baru dengan format yang sama
3. Jalankan notebook untuk training
4. Simpan model `.keras` dan metadata `.json` ke `ai-service/models/`
5. Update threshold di metadata jika perlu

### 10.4 Production Build

```bash
cd frontend && npm run build
# Hasil build di frontend/dist/
# bisa di-serve oleh web server statis apa pun
```

### 10.5 Variabel Environment

| Variabel | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `3000` | Port backend |
| `JWT_SECRET` | `prediksibencana` | Secret key JWT |
| `AI_SERVICE_URL` | `http://localhost:8000` | URL AI Service |
| `NODE_ENV` | `development` | Environment mode |
| `VITE_API_URL` | `http://localhost:3000/api` | API URL frontend |

### 10.6 Catatan Penting

- **Tidak ada database SQL/NoSQL** — semua data disimpan di file JSON. Tidak cocok untuk production skala besar.
- **Express 5.x** — gunakan API Express 5 (relatif baru, berbeda dari Express 4 di beberapa aspek).
- **Bahasa Indonesia** — seluruh UI menggunakan Bahasa Indonesia.
- **Tidak ada test** — proyek belum memiliki unit test atau integration test.
- **CSS Kustom** — tidak menggunakan CSS framework; semua styling manual di `main.css`.
