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

function loadMarkers() {
    try {
        const dummyDisasters = [
            { latitude: -6.208, longitude: 106.845, name: "Banjir Bandang Jakarta", location: "Jakarta", type: "flood", severity: "high", date: "2026-05-28" },
            { latitude: -6.597, longitude: 106.797, name: "Tanah Longsor Bogor", location: "Bogor, Jawa Barat", type: "landslide", severity: "high", date: "2026-06-01" },
            { latitude: -6.917, longitude: 107.619, name: "Cuaca Ekstrem Bandung", location: "Bandung, Jawa Barat", type: "earthquake", severity: "medium", date: "2026-05-20" },
            { latitude: -6.966, longitude: 110.419, name: "Banjir Rob Semarang", location: "Semarang, Jawa Tengah", type: "flood", severity: "medium", date: "2026-05-25" },
            { latitude: -7.250, longitude: 112.768, name: "Angin Kencang Surabaya", location: "Surabaya, Jawa Timur", type: "fire", severity: "high", date: "2026-05-30" },
            { latitude: -0.949, longitude: 100.369, name: "Banjir Padang", location: "Padang, Sumatera Barat", type: "flood", severity: "high", date: "2026-06-02" },
            { latitude: 3.595, longitude: 98.672, name: "Banjir Kilat Medan", location: "Medan, Sumatera Utara", type: "flood", severity: "medium", date: "2026-05-18" },
            { latitude: 0.507, longitude: 101.447, name: "Karhutla Riau", location: "Pekanbaru, Riau", type: "fire", severity: "high", date: "2026-06-03" },
            { latitude: -2.990, longitude: 104.756, name: "Karhutla Sumsel", location: "Palembang, Sumatera Selatan", type: "fire", severity: "medium", date: "2026-05-29" },
            { latitude: -3.792, longitude: 102.260, name: "Longsor Bengkulu", location: "Bengkulu", type: "landslide", severity: "high", date: "2026-05-27" },
            { latitude: -5.147, longitude: 119.432, name: "Banjir Makassar", location: "Makassar, Sulsel", type: "flood", severity: "medium", date: "2026-05-22" },
            { latitude: -0.022, longitude: 109.342, name: "Karhutla Pontianak", location: "Pontianak, Kalbar", type: "fire", severity: "high", date: "2026-06-01" },
            { latitude: -8.670, longitude: 115.212, name: "Gempa Dangkal Bali", location: "Denpasar, Bali", type: "earthquake", severity: "low", date: "2026-05-15" }
        ];

        const dummyReports = [
            { latitude: -6.210, longitude: 106.850, location: "Tebet, Jakarta", disasterType: "flood", description: "Air naik 50cm di jalan raya", createdAt: "2026-06-04T10:00:00Z" },
            { latitude: -0.950, longitude: 100.370, location: "Koto Tangah, Padang", disasterType: "flood", description: "Hujan deras sejak malam, rumah warga terendam", createdAt: "2026-06-03T08:00:00Z" },
            { latitude: 0.510, longitude: 101.450, location: "Rumbai, Pekanbaru", disasterType: "fire", description: "Asap tebal mengganggu jarak pandang", createdAt: "2026-06-04T14:30:00Z" }
        ];

        dummyDisasters.forEach((disaster) => {
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
                        Jenis: ${typeLabel[disaster.type] || disaster.type}
                    </small>
                    <br />
                    <small>
                        Risiko: ${severityLabel[disaster.severity] || disaster.severity}
                    </small>
                    <br />
                    <small style="color:#a0917a">
                        ${disaster.date || ""}
                    </small>
                </div>
            `;
            createMarker(disaster.latitude, disaster.longitude, disaster.severity, html).addTo(map);
        });

        dummyReports.forEach((report) => {
            const html = `
                <div style="${popupStyle}">
                    <b style="font-size:13px;font-family:Playfair Display,serif">
                        Laporan Warga: ${typeLabel[report.disasterType] || report.disasterType}
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
            createMarker(report.latitude, report.longitude, "low", html, true).addTo(map);
        });

    } catch (err) {
        console.error("Map error:", err);
    }
}

loadMarkers();