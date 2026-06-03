import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/db.js';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Fallback jika AI service tidak berjalan ───────────────────────────────────
const fallbackPredict = ({ curah_hujan_mm, kelembaban_persen, hujan_akumulasi_7d_mm, freq_bencana }) => {
    const score = Math.min(
        Math.min(curah_hujan_mm / 3, 35)
        + Math.min(kelembaban_persen / 2.8, 35)
        + Math.min(hujan_akumulasi_7d_mm / 10, 20)
        + (freq_bencana > 3 ? 10 : 0),
        100
    );
    const riskLevel = score >= 50 ? 'High Alert' : 'Normal Risk';
    return {
        riskLevel,
        riskProbability: +(score / 100).toFixed(4),
        riskScore:       Math.round(score),
        recommendation:  riskLevel === 'High Alert'
            ? 'Risiko tinggi. Perlu pemantauan intensif dan kesiapan respons wilayah.'
            : 'Risiko normal. Tetap lakukan pemantauan rutin terhadap cuaca dan laporan wilayah.',
        source: 'fallback',
    };
};

// ── POST /api/predictions ─────────────────────────────────────────────────────
export const predict = async (req, res) => {
    try {
        const {
            location,                  // hanya untuk log, tidak masuk model
            curah_hujan_mm,
            suhu_rata2_c,
            suhu_max_c,
            suhu_min_c,
            kelembaban_persen,
            hujan_akumulasi_7d_mm,
            hari_kering_berturut,
            month,
            freq_bencana,
            province,
            city,
            // quarter TIDAK diterima — dihitung otomatis di AI service
        } = req.body;

        // Validasi field wajib
        const required = {
            curah_hujan_mm,
            suhu_rata2_c,
            suhu_max_c,
            suhu_min_c,
            kelembaban_persen,
            hujan_akumulasi_7d_mm,
            hari_kering_berturut,
            month,
            freq_bencana,
            province,
            city,
        };

        const missing = Object.entries(required)
            .filter(([, v]) => v === undefined || v === null || v === '')
            .map(([k]) => k);

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Field wajib tidak boleh kosong: ${missing.join(', ')}`,
            });
        }

        // Kirim ke AI service
        let predictionResult;
        try {
            const aiResponse = await fetch(`${AI_URL}/predict`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    curah_hujan_mm:        Number(curah_hujan_mm),
                    suhu_rata2_c:          Number(suhu_rata2_c),
                    suhu_max_c:            Number(suhu_max_c),
                    suhu_min_c:            Number(suhu_min_c),
                    kelembaban_persen:     Number(kelembaban_persen),
                    hujan_akumulasi_7d_mm: Number(hujan_akumulasi_7d_mm),
                    hari_kering_berturut:  Number(hari_kering_berturut),
                    month:                 Number(month),
                    freq_bencana:          Number(freq_bencana),
                    province:              String(province).trim().toUpperCase(),
                    city:                  String(city).trim().toUpperCase(),
                    // quarter tidak dikirim — AI service hitung sendiri
                }),
                signal: AbortSignal.timeout(8000),
            });

            if (!aiResponse.ok) {
                const errText = await aiResponse.text();
                throw new Error(`AI service error ${aiResponse.status}: ${errText}`);
            }

            const aiData = await aiResponse.json();

            // Normalisasi snake_case → camelCase untuk frontend
            predictionResult = {
                riskLevel:       aiData.risk_level,
                riskProbability: aiData.risk_probability,
                riskScore:       aiData.risk_score,
                threshold:       aiData.threshold,
                recommendation:  aiData.recommendation,
                source:          aiData.source,
            };
        } catch (aiError) {
            console.warn('⚠️  AI service tidak tersedia, pakai fallback:', aiError.message);
            predictionResult = fallbackPredict({
                curah_hujan_mm,
                kelembaban_persen,
                hujan_akumulasi_7d_mm,
                freq_bencana,
            });
        }

        // Simpan ke history
        const predictions = db.predictions.getAll();
        const newPrediction = {
            id:     uuidv4(),
            userId: req.user?.id || null,
            input: {
                location,
                curah_hujan_mm, suhu_rata2_c, suhu_max_c, suhu_min_c,
                kelembaban_persen, hujan_akumulasi_7d_mm, hari_kering_berturut,
                month, freq_bencana, province, city,
            },
            result:    predictionResult,
            createdAt: new Date().toISOString(),
        };
        predictions.push(newPrediction);
        db.predictions.save(predictions);

        res.status(201).json({ success: true, data: newPrediction });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/predictions ──────────────────────────────────────────────────────
export const getPredictions = (req, res) => {
    const predictions = db.predictions.getAll();
    res.json({ success: true, data: predictions, total: predictions.length });
};