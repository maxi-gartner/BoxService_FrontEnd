import { login } from "./api.js";
import { getToken, saveSession } from "./auth.js";

if (getToken()) window.location.href = "./index.html";

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const error = document.getElementById("login-error");
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  error.textContent = "";

  const result = await login({ username: form.get("username"), password: form.get("password") });
  button.disabled = false;

  if (!result.success) {
    error.textContent = result.error?.message ?? "No se pudo iniciar sesión.";
    return;
  }

  saveSession(result.data);
  window.location.href = "./index.html";
});
