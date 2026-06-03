import {
    disasterAPI,
    reportAPI,
} from "../../services/api.js";

const map = L.map("map").setView([-2.5, 118], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
}).addTo(map);

const colors = {
    high: "#c0392b",
    medium: "#c97d25",
    low: "#2a8c5e",
};

const sizes = {
    high: 16,
    medium: 12,
    low: 9,
};

function createMarker(lat, lng, severity, html, isReport = false) {
    const color = isReport
        ? "#5a4e3a"
        : colors[severity] || colors.low;

    const size = isReport
        ? 9
        : sizes[severity] || 9;

    return L.circleMarker([lat, lng], {
        radius: size,
        fillColor: color,
        color: "#fdfaf4",
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9,
    }).bindPopup(html, {
        maxWidth: 260,
    });
}

const typeLabel = {
    flood: "Banjir",
    earthquake: "Gempa",
    fire: "Kebakaran",
    landslide: "Longsor",
};

const severityLabel = {
    high: "🔴 Tinggi",
    medium: "🟡 Sedang",
    low: "🟢 Rendah",
};

const popupStyle =
    "font-family:Outfit,sans-serif;min-width:180px";

async function loadMarkers() {
    try {
        const [disasterRes, reportRes] = await Promise.all([
            disasterAPI.getAll(),
            reportAPI.getAll(),
        ]);

        disasterRes.data.data.forEach((disaster) => {
            if (!disaster.latitude || !disaster.longitude) {
                return;
            }

            const html = `
                <div style="${popupStyle}">
                    <b style="font-size:13px;font-family:Playfair Display,serif">
                        ${disaster.name}
                    </b>

                    <br />

                    <small style="color:#a0917a">
                        📍 ${disaster.location}
                    </small>

                    <br />

                    <small>
                        Jenis:
                        ${typeLabel[disaster.type] || disaster.type}
                    </small>

                    <br />

                    <small>
                        Risiko:
                        ${severityLabel[disaster.severity] || disaster.severity}
                    </small>

                    <br />

                    <small style="color:#a0917a">
                        ${disaster.date || ""}
                    </small>
                </div>
            `;

            createMarker(
                disaster.latitude,
                disaster.longitude,
                disaster.severity,
                html
            ).addTo(map);
        });

        reportRes.data.data.forEach((report) => {
            if (!report.latitude || !report.longitude) {
                return;
            }

            const html = `
                <div style="${popupStyle}">
                    <b style="font-size:13px;font-family:Playfair Display,serif">
                        Laporan:
                        ${typeLabel[report.disasterType] || report.disasterType}
                    </b>

                    <br />

                    <small style="color:#a0917a">
                        📍 ${report.location}
                    </small>

                    <br />

                    <small>
                        ${report.description}
                    </small>

                    <br />

                    <small style="color:#a0917a">
                        ${new Date(report.createdAt).toLocaleDateString("id-ID")}
                    </small>
                </div>
            `;

            createMarker(
                report.latitude,
                report.longitude,
                "low",
                html,
                true
            ).addTo(map);
        });
    } catch (err) {
        console.error("Map error:", err);
    }
}

const token = localStorage.getItem("token");

if (token) {
    document.getElementById("btn-logout").style.display = "flex";

    document.getElementById("btn-login").style.display = "none";
}

document.getElementById("btn-logout")?.addEventListener("click", () => {
    localStorage.removeItem("token");

    window.location.reload();
});

loadMarkers();