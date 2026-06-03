import { reportAPI, disasterAPI } from '../../services/api.js';

function showToast(msg, type = '') {
    const wrap = document.getElementById('toast-wrap');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function animateNum(el, target) {
    const start = parseInt(el.textContent) || 0;
    if (start === target) {
        el.textContent = target;
        return;
    }
    let val = start;
    const step = target > start ? 1 : -1;
    const t = setInterval(() => {
        val += step; el.textContent = val;
        if (val === target) clearInterval(t);
    }, 40);
}

async function loadDashboard() {
    try {
        const [reportsRes, disastersRes] = await Promise.all([
            reportAPI.getAll(),
            disasterAPI.getAll(),
        ]);
        const reports   = reportsRes.data.data;
        const disasters = disastersRes.data.data;

        animateNum(document.getElementById('total-reports'),   reports.length);
        animateNum(document.getElementById('high-risk'),       disasters.filter(d => d.severity === 'high').length);
        animateNum(document.getElementById('total-disasters'), disasters.length);

        renderTable(reports.slice(0, 5));
        renderChart(disasters);
    } catch (err) {
        console.error(err);
        showToast('Loading failed! ⚠️', 'error');
        document.getElementById('reports-list').innerHTML = `
        <div class="empty-state">
            <div class="empty-emoji">⚠️</div>
            <h3>Gagal memuat data</h3>
            <p>Pastikan backend server sudah berjalan di port 3000</p>
        </div>`;
    }
}

const typeLabel = { flood:'Banjir', earthquake:'Gempa', fire:'Kebakaran', landslide:'Longsor' };

function renderTable(reports) {
    const el = document.getElementById('reports-list');
    if (!reports.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-emoji">📋</div><h3>Belum ada laporan</h3><p>Laporan akan muncul di sini</p></div>`;
        return;
    }
    el.innerHTML = `
        <div class="table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Lokasi</th>
                        <th>Jenis</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(r => `
                        <tr>
                            <td style="font-weight:600;color:var(--ink)">${r.location}</td>
                            <td><span class="badge badge-${r.disasterType}">${typeLabel[r.disasterType] || r.disasterType}</span></td>
                            <td><span class="badge badge-${r.status}">${r.status}</span></td>
                            <td>${new Date(r.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderChart(disasters) {
    const counts = {};
    disasters.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    const labelMap = { flood:'Banjir', earthquake:'Gempa', fire:'Kebakaran', landslide:'Longsor' };
    const labels = Object.keys(counts).map(k => labelMap[k] || k);
    const values = Object.values(counts);
    const colors = ['#c97d25','#c0392b','#2a8c5e','#8b6914','#5a4e3a'];

    new Chart(document.getElementById('disaster-chart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Jumlah Kejadian',
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1207',
                    padding: 12,
                    cornerRadius: 10,
                    titleFont: { family: 'Playfair Display' },
                },
            },
            scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a0917a' } },
                y: {
                    grid: { color: 'rgba(26,18,7,.06)' },
                    border: { display: false },
                    ticks: { stepSize: 1, color: '#a0917a' },
                },
            },
        }
    });
}

// Auth state
const token = localStorage.getItem('token');
if (token) {
    document.getElementById('btn-logout').style.display = 'flex';
    document.getElementById('btn-login').style.display  = 'none';
}
document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
});

loadDashboard();