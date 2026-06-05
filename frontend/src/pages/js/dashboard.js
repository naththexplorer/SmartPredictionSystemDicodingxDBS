function renderStaticChart() {
    // Static data matching the 1015 total, mainly hydrometeorological as per BNPB
    const labels = ['Banjir', 'Cuaca Ekstrem', 'Karhutla', 'Longsor', 'Lainnya'];
    const values = [508, 305, 120, 52, 30]; // sums to 1015
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
                    ticks: { stepSize: 100, color: '#a0917a' },
                },
            },
        }
    });
}

renderStaticChart();