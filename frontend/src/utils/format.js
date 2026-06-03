// Format tanggal ke format Indonesia
export const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

// Format label risiko
export const getRiskLabel = (level) => {
  const labels = { Low: 'Rendah', Medium: 'Sedang', High: 'Tinggi' };
  return labels[level] || level;
};

// Format jenis bencana ke Bahasa Indonesia
export const getDisasterLabel = (type) => {
  const labels = {
    flood: 'Banjir',
    earthquake: 'Gempa Bumi',
    fire: 'Kebakaran',
    landslide: 'Tanah Longsor',
  };
  return labels[type] || type;
};