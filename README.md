# Smart Disaster Risk Prediction System

Capstone project — Full Stack Web App prediksi risiko bencana alam.

## Tech Stack
- Frontend: Vite + HTML/CSS/JS, Axios, Leaflet.js, Chart.js
- Backend: Express.js (ESModule), JWT Auth, JSON file storage
- AI/ML: Python FastAPI (terpisah)

## Cara Menjalankan

### 1. AI Service (Dijalankan Terpisah)
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

### 2. Folder Root (Frontend & Backend dijalankan bersamaan)
npm install
npm run install:all
npm run dev
