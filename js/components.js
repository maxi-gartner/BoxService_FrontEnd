// components.js — carga los componentes compartidos (sidebar, footer)
// Importar en cada página ANTES que el JS propio de la página.
// Detecta automáticamente qué página es y marca el link activo en el sidebar.

const ROOT = getRootPath();

function getRootPath() {
  // Si estamos en /pages/*.html necesitamos subir un nivel
  return window.location.pathname.includes("/pages/") ? ".." : ".";
}

async function loadComponent(selector, file) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(`${ROOT}/components/${file}`);
    el.innerHTML = await res.text();
  } catch (e) {
    console.warn(`No se pudo cargar ${file}:`, e);
  }
}

function setActiveLink() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    if (link.dataset.page === page) link.classList.add("active");
  });
}

async function checkHealth() {
  const indicator = document.getElementById("sidebar-health");
  if (!indicator) return;
  try {
    const res = await fetch("http://localhost:5001/health");
    const json = await res.json();
    if (json.success && json.data.status === "healthy") {
      indicator.textContent = "● Online";
      indicator.style.color = "#6EE7B7";
    } else {
      indicator.textContent = "● Degraded";
      indicator.style.color = "#F59E0B";
    }
  } catch {
    indicator.textContent = "● Offline";
    indicator.style.color = "#EF4444";
  }
}

// Carga todo al arrancar
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("#sidebar-container", "sidebar.html");
  await loadComponent("#footer-container", "footer.html");
  setActiveLink();
  checkHealth();
});
