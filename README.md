# Smart Disaster Risk Prediction System

Capstone project — Full Stack Web App prediksi risiko bencana alam.

## Tech Stack
- Frontend: Vite + HTML/CSS/JS, Axios, Leaflet.js, Chart.js
- Backend: Express.js (ESModule), JWT Auth, JSON file storage
- AI/ML: Python FastAPI (terpisah)

## Cara Menjalankan

### Backend
cd backend && cp .env.example .env && npm install && npm run dev

### Frontend
cd frontend && npm install && npm run dev

### AI Service (opsional)
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
