// components.js — carga los componentes compartidos (sidebar, footer)
// Importar en cada página ANTES que el JS propio de la página.

import { getHealth } from "./api.js";

const ROOT = getRootPath();

function getRootPath() {
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
    link.classList.toggle("active", link.dataset.page === page);
  });
}

async function checkHealth() {
  const indicator = document.getElementById("sidebar-health");
  if (!indicator) return;

  const res = await getHealth();

  if (res.success && res.data.status === "healthy") {
    indicator.textContent = "● Online";
    indicator.style.color = "#3fb950";
  } else if (res.success) {
    indicator.textContent = "● Degradado";
    indicator.style.color = "#f59e0b";
  } else {
    indicator.textContent = "● Offline";
    indicator.style.color = "#f85149";
  }
}

// ── Sistema de tabs ──────────────────────────────────
function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  if (!tabBtns.length) return;

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `tab-${target}`);
      });
    });
  });
}

// ── Menú hamburguesa ─────────────────────────────────
function initHamburger() {
  const hamburger = document.getElementById("hamburger-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (!hamburger || !sidebar || !overlay) return;

  function openMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    hamburger.classList.add("open");
    document.body.style.overflow = "hidden"; // evita scroll del fondo
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    hamburger.classList.remove("open");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeMenu() : openMenu();
  });

  // Cerrar al tocar el overlay
  overlay.addEventListener("click", closeMenu);

  // Cerrar al tocar un link del sidebar
  sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
}

// ── Init ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("#sidebar-container", "sidebar.html");
  await loadComponent("#footer-container", "footer.html");
  setActiveLink();
  checkHealth();
  initTabs();
  initHamburger();
});
