import { authAPI } from "../../services/api.js";

const btn = document.getElementById("btn-register");
const label = document.getElementById("reg-label");

const errEl = document.getElementById("err-msg");
const sucEl = document.getElementById("suc-msg");

btn.addEventListener("click", async () => {
    errEl.classList.remove("show");
    sucEl.classList.remove("show");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!name || !email || !password) {
        errEl.textContent = "Semua field wajib diisi.";
        errEl.classList.add("show");
        return;
    }

    if (password.length < 6) {
        errEl.textContent = "Password minimal 6 karakter.";
        errEl.classList.add("show");
        return;
    }

    btn.disabled = true;
    label.textContent = "Membuat akun...";

    try {
        await authAPI.register({
            name,
            email,
            password,
        });

        sucEl.textContent =
            "Akun berhasil dibuat! Mengarahkan ke login...";

        sucEl.classList.add("show");

        setTimeout(() => {
            window.location.href = "/src/pages/login.html";
        }, 1800);
    } catch (err) {
        errEl.textContent =
            err.response?.data?.message ||
            "Registrasi gagal.";

        errEl.classList.add("show");
    } finally {
        btn.disabled = false;
        label.textContent = "Buat Akun";
    }
});