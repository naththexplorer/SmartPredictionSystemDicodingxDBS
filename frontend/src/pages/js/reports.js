import { reportAPI } from "../../services/api.js";

const typeLabel = {
    flood: "Banjir",
    earthquake: "Gempa",
    fire: "Kebakaran",
    landslide: "Longsor",
};

const typeEmoji = {
    flood: "🌊",
    earthquake: "🌍",
    fire: "🔥",
    landslide: "⛰️",
};

function showToast(message, type = "") {
    const wrap = document.getElementById("toast-wrap");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    wrap.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function loadReports() {
    const container = document.getElementById("reports-container");
    try {
        const response = await reportAPI.getAll();

        const reports = response.data.data;

        if (!reports.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-emoji">📋</div>
                    <h3>Belum ada laporan</h3>
                    <p>Jadilah yang pertama melaporkan</p>
                </div>
            `;

            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Lokasi</th>
                            <th>Jenis</th>
                            <th>Deskripsi</th>
                            <th>Tanggal</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${reports
                            .map(
                                (report) => `
                                    <tr>
                                        <td style="font-weight:600;color:var(--ink)">
                                            ${report.location}
                                        </td>

                                        <td>
                                            <span class="badge badge-${report.disasterType}">
                                                ${typeEmoji[report.disasterType] || ""}
                                                ${typeLabel[report.disasterType] || report.disasterType}
                                            </span>
                                        </td>

                                        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                                            ${report.description}
                                        </td>

                                        <td>
                                            ${new Date(report.createdAt).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>

                                        <td>
                                            <button class="btn-danger" onclick="deleteReport('${report.id}')">
                                                🗑 Hapus
                                            </button>
                                        </td>
                                    </tr>
                                `
                            )
                            .join("")}
                    </tbody>
                </table>
            </div>
        `;
    } catch {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">⚠️</div>
                <h3>Gagal memuat</h3>
                <p>Pastikan backend sudah berjalan</p>
            </div>
        `;
    }
}

document.getElementById("btn-submit").addEventListener("click", async () => {
    const payload = {
        location: document.getElementById("r-location").value.trim(),
        description: document.getElementById("r-desc").value.trim(),
        disasterType: document.getElementById("r-type").value,
        latitude: parseFloat(document.getElementById("r-lat").value) || null,
        longitude: parseFloat(document.getElementById("r-lng").value) || null,
    };
    if (!payload.location || !payload.description) {
        showToast("Lokasi dan deskripsi wajib diisi", "error");
        return;
    }
    const btn = document.getElementById("btn-submit");
    const label = document.getElementById("submit-label");
    btn.disabled = true;
    label.textContent = "Mengirim...";
    try {
        await reportAPI.create(payload);

        ["r-location", "r-desc", "r-lat", "r-lng"].forEach((id) => {
            document.getElementById(id).value = "";
        });
        showToast("Laporan berhasil dikirim ✓", "success");
        loadReports();
    } catch {
        showToast("Gagal mengirim laporan", "error");
    } finally {
        btn.disabled = false;
        label.textContent = "Kirim Laporan";
    }
});

window.deleteReport = async (id) => {
    if (!confirm("Yakin ingin menghapus laporan ini?")) {
        return;
    }

    try {
        await reportAPI.delete(id);
        showToast("Laporan dihapus", "success");
        loadReports();
    } catch {
        showToast("Gagal menghapus", "error");
    }
};

loadReports();