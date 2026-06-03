// Cek apakah user sudah login
export const isLoggedIn = () => !!localStorage.getItem('token');

// Ambil data user dari localStorage
export const getUser = () => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/src/pages/login.html';
};

// Protect halaman — redirect ke login kalau belum auth
export const requireAuth = () => {
  if (!isLoggedIn()) {
    window.location.href = '/src/pages/login.html';
  }
};