import { authAPI } from "../../services/api.js";

const btn = document.getElementById("btn-login");
const label = document.getElementById("login-label");
const errEl = document.getElementById("err-msg");

function showErr(message) {
    errEl.textContent = message;
    errEl.classList.add("show");
}

async function doLogin() {
    errEl.classList.remove("show");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showErr("Email dan password wajib diisi.");
        return;
    }

    btn.disabled = true;
    label.textContent = "Masuk...";

    try {
        const res = await authAPI.login({
            email,
            password,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        window.location.href = "/index.html";
    } catch (err) {
        showErr(
            err.response?.data?.message ||
            "Login gagal. Periksa kembali email dan password."
        );
    } finally {
        btn.disabled = false;
        label.textContent = "Masuk";
    }
}

btn.addEventListener("click", doLogin);

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        doLogin();
    }
});