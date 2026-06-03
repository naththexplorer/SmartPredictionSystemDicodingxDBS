"""
AI Service — Smart Disaster Risk Prediction
Model: Deep Learning Tabular Binary Classification (High Alert Detection)

Jalankan:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Struktur folder:
    ai-service/
    ├── main.py
    ├── requirements.txt
    └── models/
        ├── disaster_risk_high_alert_model.keras
        └── disaster_risk_high_alert_metadata.json
"""

import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import json
import numpy as np
import pandas as pd
import tensorflow as tf
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Path ──────────────────────────────────────────────────────────────────────
MODEL_PATH    = Path('./models/disaster_risk_high_alert_model.keras')
METADATA_PATH = Path('./models/disaster_risk_high_alert_metadata.json')

# ── Load metadata ─────────────────────────────────────────────────────────────
METADATA           = json.loads(METADATA_PATH.read_text(encoding='utf-8'))
NUMERICAL_FEATURES = METADATA['features']['numerical']
CATEGORICAL_FEATURES = METADATA['features']['categorical']

# Threshold dari metadata — selected_threshold (best validation accuracy)
THRESHOLD = float(METADATA['selected_threshold'])

# ── Load model ────────────────────────────────────────────────────────────────
# compile=False: tidak perlu recompile optimizer, lebih cepat untuk inference
try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print(f'✅ Model loaded: {MODEL_PATH}')
    print(f'   Threshold      : {THRESHOLD}')
    print(f'   Fitur numerik  : {NUMERICAL_FEATURES}')
    print(f'   Fitur kategori : {CATEGORICAL_FEATURES}')
except Exception as e:
    print(f'❌ Gagal load model: {e}')
    model = None

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title='Disaster Risk Prediction API',
    description='Binary classification: Normal Risk vs High Alert',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Schema ────────────────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    # Fitur numerik
    curah_hujan_mm:        float = Field(..., ge=0,        description='Curah hujan (mm)')
    suhu_rata2_c:          float = Field(...,              description='Suhu rata-rata (°C)')
    suhu_max_c:            float = Field(...,              description='Suhu maksimum (°C)')
    suhu_min_c:            float = Field(...,              description='Suhu minimum (°C)')
    kelembaban_persen:     float = Field(..., ge=0, le=100, description='Kelembaban (%)')
    hujan_akumulasi_7d_mm: float = Field(..., ge=0,        description='Akumulasi hujan 7 hari (mm)')
    hari_kering_berturut:  float = Field(..., ge=0,        description='Hari kering berturut-turut')
    month:                 int   = Field(..., ge=1, le=12, description='Bulan (1–12)')
    freq_bencana:          float = Field(..., ge=0,        description='Frekuensi bencana historis')

    # Fitur kategorikal
    province: str = Field(..., description='Nama provinsi, cth: JAWA BARAT')
    city:     str = Field(..., description='Nama kota/kabupaten, cth: BOGOR')

    # quarter TIDAK perlu dikirim — dihitung otomatis dari month

class PredictionResponse(BaseModel):
    risk_level:      str   # 'High Alert' atau 'Normal Risk'
    risk_probability: float # probabilitas mentah dari model (0–1)
    risk_score:      float  # risk_probability × 100, untuk progress bar frontend
    threshold:       float  # threshold yang dipakai
    recommendation:  str    # teks rekomendasi
    source:          str    # 'model' atau 'fallback'

# ── Helper ────────────────────────────────────────────────────────────────────
def make_recommendation(risk_level: str) -> str:
    if risk_level == 'High Alert':
        return 'Risiko tinggi. Perlu pemantauan intensif dan kesiapan respons wilayah.'
    return 'Risiko normal. Tetap lakukan pemantauan rutin terhadap cuaca dan laporan wilayah.'

def prepare_row(payload: PredictionRequest) -> pd.DataFrame:
    """
    Konversi payload ke DataFrame satu baris,
    persis seperti prepare_single_payload() di notebook.
    Quarter dihitung otomatis dari month.
    """
    row = pd.DataFrame([payload.model_dump()])

    # Normalisasi kategorikal
    row['province'] = row['province'].astype(str).str.strip().str.upper()
    row['city']     = row['city'].astype(str).str.strip().str.upper()

    # Hitung quarter dari month — konsisten dengan notebook
    row['quarter'] = ((row['month'].astype(int) - 1) // 3 + 1).astype('int32')

    return row

def fallback_predict(payload: PredictionRequest) -> dict:
    """Rule-based sederhana jika model tidak tersedia."""
    score = (
        min(payload.curah_hujan_mm / 3, 35)
        + min(payload.kelembaban_persen / 2.8, 35)
        + min(payload.hujan_akumulasi_7d_mm / 10, 20)
        + (10 if payload.freq_bencana > 3 else 0)
    )
    score       = min(round(score, 1), 100)
    prob        = score / 100
    risk_level  = 'High Alert' if prob >= THRESHOLD else 'Normal Risk'

    return {
        'risk_level':       risk_level,
        'risk_probability': round(prob, 4),
        'risk_score':       score,
        'threshold':        THRESHOLD,
        'recommendation':   make_recommendation(risk_level),
        'source':           'fallback',
    }

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get('/')
def root():
    return {
        'status':       'running',
        'model_loaded': model is not None,
        'threshold':    THRESHOLD,
        'version':      '1.0.0',
    }

@app.get('/health')
def health():
    return {
        'status':       'ok',
        'model_loaded': model is not None,
    }

@app.get('/metadata')
def get_metadata():
    """Kembalikan metadata model lengkap."""
    return METADATA

@app.post('/predict', response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    if model is None:
        return PredictionResponse(**fallback_predict(payload))

    try:
        row = prepare_row(payload)

        inputs = {
            'numeric_features': row[NUMERICAL_FEATURES].astype('float32').to_numpy(),
            'province':         row['province'].astype(str).to_numpy(),
            'city':             row['city'].astype(str).to_numpy(),
        }

        # Output model: shape (1, 1), nilai sigmoid 0–1
        probability = float(model.predict(inputs, verbose=0).reshape(-1)[0])
        risk_level  = 'High Alert' if probability >= THRESHOLD else 'Normal Risk'

        return PredictionResponse(
            risk_level       = risk_level,
            risk_probability = round(probability, 4),
            risk_score       = round(probability * 100, 1),
            threshold        = THRESHOLD,
            recommendation   = make_recommendation(risk_level),
            source           = 'model',
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Prediction error: {str(e)}')