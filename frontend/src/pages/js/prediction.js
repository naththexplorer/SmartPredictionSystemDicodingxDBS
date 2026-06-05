import { predictionAPI } from '../../services/api.js';
import locations from '../../utils/locations.json';

// ── Inisialisasi Dropdown Lokasi ──────────────────────────────────────────────
const provinceSelect = document.getElementById('province');
const citySelect = document.getElementById('city');

if (provinceSelect && citySelect) {
    const provinces = Object.keys(locations).sort();
    provinces.forEach(prov => {
        const option = document.createElement('option');
        option.value = prov;
        option.textContent = prov;
        provinceSelect.appendChild(option);
    });

    provinceSelect.addEventListener('change', (e) => {
        citySelect.innerHTML = '<option value="">Pilih kota/kabupaten</option>';
        const selectedProv = e.target.value;
        if (selectedProv && locations[selectedProv]) {
            const cities = [...locations[selectedProv]].sort();
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
    const wrap = document.getElementById('toast-wrap');
    const el   = document.createElement('div');
    el.className   = `toast ${type}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ── Animasi skor ──────────────────────────────────────────────────────────────
function animateScore(el, target) {
    let val = 0;
    const inc = target / 45;
    const t = setInterval(() => {
        val = Math.min(val + inc, target);
        el.textContent = Math.round(val);
        if (val >= target) clearInterval(t);
    }, 22);
}

// ── Kumpulkan nilai form ──────────────────────────────────────────────────────
function getFormValues() {
    return {
        province:              document.getElementById('province').value.trim().toUpperCase(),
        city:                  document.getElementById('city').value.trim().toUpperCase(),
        curah_hujan_mm:        parseFloat(document.getElementById('curah_hujan_mm').value),
        suhu_rata2_c:          parseFloat(document.getElementById('suhu_rata2_c').value),
        suhu_max_c:            parseFloat(document.getElementById('suhu_max_c').value),
        suhu_min_c:            parseFloat(document.getElementById('suhu_min_c').value),
        kelembaban_persen:     parseFloat(document.getElementById('kelembaban_persen').value),
        hujan_akumulasi_7d_mm: parseFloat(document.getElementById('hujan_akumulasi_7d_mm').value),
        hari_kering_berturut:  parseFloat(document.getElementById('hari_kering_berturut').value),
        month:                 parseInt(document.getElementById('month').value),
        freq_bencana:          parseFloat(document.getElementById('freq_bencana').value),
        // quarter tidak dikirim — dihitung otomatis di AI service
    };
}

// ── Validasi form ─────────────────────────────────────────────────────────────
function validateForm(p) {
    if (!p.province) return 'Provinsi wajib diisi';
    if (!p.city)     return 'Kota / Kabupaten wajib diisi';
    if (isNaN(p.month)) return 'Bulan wajib dipilih';

    const numericFields = [
        'curah_hujan_mm', 'suhu_rata2_c', 'suhu_max_c', 'suhu_min_c',
        'kelembaban_persen', 'hujan_akumulasi_7d_mm', 'hari_kering_berturut', 'freq_bencana',
    ];
    for (const f of numericFields) {
        if (isNaN(p[f])) return `"${f.replace(/_/g, ' ')}" wajib diisi`;
    }
    if (p.suhu_min_c > p.suhu_max_c) return 'Suhu minimum tidak boleh lebih besar dari suhu maksimum';

    return null;
}

// ── Cek nilai ekstrim ─────────────────────────────────────────────────────────
function checkExtremeValues(p) {
    const limits = {
        curah_hujan_mm: { min: 0, max: 1000, label: 'Curah Hujan (0-1000 mm)' },
        hujan_akumulasi_7d_mm: { min: 0, max: 3000, label: 'Akumulasi Hujan (0-3000 mm)' },
        suhu_rata2_c: { min: 10, max: 45, label: 'Suhu Rata-rata (10-45 °C)' },
        suhu_max_c: { min: 10, max: 50, label: 'Suhu Maksimum (10-50 °C)' },
        suhu_min_c: { min: 0, max: 40, label: 'Suhu Minimum (0-40 °C)' },
        kelembaban_persen: { min: 0, max: 100, label: 'Kelembaban (0-100 %)' },
        hari_kering_berturut: { min: 0, max: 365, label: 'Hari Kering (0-365 hari)' },
        freq_bencana: { min: 0, max: 3000, label: 'Frekuensi Bencana (0-3000)' }
    };

    let warnings = [];
    for (const [key, limit] of Object.entries(limits)) {
        if (p[key] < limit.min || p[key] > limit.max) {
            warnings.push(`- ${limit.label}, input Anda: ${p[key]}`);
        }
    }

    if (warnings.length > 0) {
        return "⚠️ PERINGATAN:\nAngka yang Anda masukkan berada di luar rentang normal dan dapat merusak kalkulasi AI (menghasilkan probabilitas 0%).\n\nRentang Normal:\n" + warnings.join("\n") + "\n\nApakah Anda yakin ingin melanjutkan prediksi dengan angka ekstrim ini?";
    }
    return null;
}

// ── Render hasil prediksi ─────────────────────────────────────────────────────
function renderResult(result, location) {
    const { riskLevel, riskProbability, riskScore, recommendation, source } = result;

    const isHigh     = riskLevel === 'High Alert';
    const colorClass = isHigh ? 'high' : 'low';
    const fillColor  = isHigh ? 'var(--red)' : 'var(--emerald)';
    const emoji      = isHigh ? '🔴' : '🟢';

    document.getElementById('result-area').innerHTML = `
        <div class="risk-result-card">
            <div class="card-eyebrow" style="justify-content:center">
                <span class="card-eyebrow-dot"></span>Hasil Prediksi AI
            </div>

            <div class="risk-level-badge ${colorClass}">${emoji} ${riskLevel}</div>

            <div class="risk-score-label">Skor Risiko</div>
            <div class="risk-score-num ${colorClass}" id="score-num">0</div>
            <div style="font-size:.78rem;color:var(--ink3);margin-bottom:1.1rem">dari 100</div>

            <div class="risk-bar-wrap">
                <div class="risk-bar-fill" id="risk-bar"
                     style="width:0%;background:${fillColor}"></div>
            </div>

            <div style="display:flex;gap:1rem;margin-bottom:1.5rem">
                <div style="flex:1;background:var(--paper2);border:1px solid var(--border);border-radius:8px;padding:.75rem;text-align:center">
                    <div style="font-size:.65rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:.3rem">Probabilitas</div>
                    <div style="font-family:var(--serif);font-size:1.2rem;font-weight:700;color:var(--ink)">${(riskProbability * 100).toFixed(1)}%</div>
                </div>
                <div style="flex:1;background:var(--paper2);border:1px solid var(--border);border-radius:8px;padding:.75rem;text-align:center">
                    <div style="font-size:.65rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:.3rem">Sumber</div>
                    <div style="font-family:var(--serif);font-size:1.2rem;font-weight:700;color:var(--ink)">${source === 'model' ? '🤖 Model' : '📐 Fallback'}</div>
                </div>
            </div>

            ${location ? `<div style="font-size:.78rem;color:var(--ink3);margin-bottom:1rem;text-align:left">📍 ${location}</div>` : ''}

            <div class="risk-recs">
                <h4>Rekomendasi</h4>
                <ul><li>${recommendation}</li></ul>
            </div>
        </div>`;

    requestAnimationFrame(() => {
        animateScore(document.getElementById('score-num'), riskScore);
        setTimeout(() => {
            const bar = document.getElementById('risk-bar');
            if (bar) bar.style.width = riskScore + '%';
        }, 80);
    });
}

// ── Event: tombol prediksi ────────────────────────────────────────────────────
document.getElementById('btn-predict').addEventListener('click', async () => {
    const btn   = document.getElementById('btn-predict');
    const label = document.getElementById('predict-label');

    const payload = getFormValues();
    const errMsg  = validateForm(payload);
    if (errMsg) { showToast(errMsg, 'error'); return; }

    const extremeWarning = checkExtremeValues(payload);
    if (extremeWarning) {
        if (!confirm(extremeWarning)) {
            return;
        }
    }

    btn.disabled      = true;
    label.textContent = 'Menganalisis...';

    try {
        const res    = await predictionAPI.predict(payload);
        const result = res.data.data.result;
        renderResult(result, `${payload.city}, ${payload.province}`);
        showToast('Prediksi berhasil ✓', 'success');
    } catch (err) {
        const msg = err.response?.data?.message || 'Gagal memproses prediksi';
        showToast(msg, 'error');
    } finally {
        btn.disabled      = false;
        label.textContent = 'Prediksi Sekarang';
    }
});

// ── Fitur Draft (Lokal) ───────────────────────────────────────────────────────
let localDrafts = [];
const draftContainer = document.getElementById('draft-container');
const draftList = document.getElementById('draft-list');

document.getElementById('btn-save-draft')?.addEventListener('click', () => {
    const p = getFormValues();
    if (!p.province || !p.city) {
        showToast('Pilih lokasi terlebih dahulu sebelum menyimpan draft', 'error');
        return;
    }
    
    // Save to memory
    const draftName = `${p.city} - ${new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`;
    localDrafts.push({ name: draftName, data: p });
    
    renderDrafts();
    showToast('Draft disimpan sementara (hilang saat refresh)', 'success');
});

function renderDrafts() {
    if (localDrafts.length === 0) {
        draftContainer.style.display = 'none';
        return;
    }
    draftContainer.style.display = 'block';
    draftList.innerHTML = '';
    
    localDrafts.forEach((draft, idx) => {
        const el = document.createElement('div');
        el.className = 'draft-item';
        el.textContent = `📝 ${draft.name}`;
        el.addEventListener('click', () => loadDraft(idx));
        draftList.appendChild(el);
    });
}

function loadDraft(idx) {
    const data = localDrafts[idx].data;
    if (!data) return;

    // Load Province
    const provSelect = document.getElementById('province');
    provSelect.value = data.province;
    provSelect.dispatchEvent(new Event('change'));

    // Wait for city list to populate then load City
    setTimeout(() => {
        document.getElementById('city').value = data.city;
    }, 50);

    // Load numerics
    const fields = [
        'curah_hujan_mm', 'suhu_rata2_c', 'suhu_max_c', 'suhu_min_c',
        'kelembaban_persen', 'hujan_akumulasi_7d_mm', 'hari_kering_berturut', 'freq_bencana'
    ];
    fields.forEach(f => {
        document.getElementById(f).value = isNaN(data[f]) ? '' : data[f];
    });

    document.getElementById('month').value = isNaN(data.month) ? '' : data.month;
    showToast(`Draft ${localDrafts[idx].name} dimuat`, 'success');
}