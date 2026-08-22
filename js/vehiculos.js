// vehiculos.js — lógica de presentación
// Solo fetch y mostrar. Sin lógica de negocio.

import { getVehiculos, createVehiculo } from "./api.js";

const tablaBody = document.getElementById("vehiculos-body");
const formVehiculo = document.getElementById("vehiculo-form");
const alertBox = document.getElementById("page-alert");

// ── Helpers ────────────────────────────────────────────
function showAlert(msg, type = "error") {
  if (!alertBox) {
    console.error(msg);
    return;
  }

  alertBox.textContent = msg;
  alertBox.className = `alert show alert-${type}`;
  setTimeout(() => (alertBox.className = "alert"), 4000);
}

function setLoading(btn, loading) {
  if (!btn) return;

  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.textContent;
    btn.textContent = "Guardando...";
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.original || "Guardar";
    btn.style.opacity = "1";
  }
}

function getKilometrajeActual(v) {
  return v.currentMileage ?? "-";
}

// ── Render ─────────────────────────────────────────────
function crearFila(v) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="text-accent">${v.plate ?? "-"}</td>
    <td>${v.brand ?? "-"}</td>
    <td>${v.model ?? "-"}</td>
    <td>${v.year ?? "-"}</td>
    <td>${v.clientId ?? "-"}</td>
    <td>${getKilometrajeActual(v)}</td>
  `;

  return tr;
}

function renderVehiculos(lista) {
  tablaBody.innerHTML = "";

  if (!lista.length) {
    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">No hay vehículos registrados.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((v) => {
    tablaBody.appendChild(crearFila(v));
  });
}

// ── Cargar vehículos ───────────────────────────────────
async function cargarVehiculos() {
  if (!tablaBody) {
    console.error("No se encontró el tbody con id vehiculos-body");
    return;
  }

  tablaBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-muted">Cargando...</td>
    </tr>
  `;

  try {
    const res = await getVehiculos();

    console.log("Respuesta vehículos:", res);

    if (!res.success) {
      showAlert(res.error?.message || "Error al cargar vehículos.");
      tablaBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted">Error al cargar.</td>
        </tr>
      `;
      return;
    }

    renderVehiculos(res.data ?? []);
  } catch (error) {
    console.error("Error cargando vehículos:", error);

    tablaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted">Error al conectar con el backend.</td>
      </tr>
    `;

    showAlert("Error al conectar con el backend.");
  }
}

// ── Formulario ─────────────────────────────────────────
if (formVehiculo) {
  formVehiculo.addEventListener("submit", async (event) => {
    event.preventDefault();

    const btn = formVehiculo.querySelector('button[type="submit"]');
    const fd = new FormData(formVehiculo);

    const kilometrajeActual = fd.get("kilometrajeActual");

    const payload = {
      clientId: parseInt(fd.get("cliente")) || 0,
      brand: fd.get("marca")?.trim() || "",
      model: fd.get("modelo")?.trim() || "",
      year: fd.get("anio") ? parseInt(fd.get("anio")) : null,
      plate: fd.get("patente")?.trim() || "",
      currentMileage:
        kilometrajeActual !== null && kilometrajeActual !== ""
          ? parseInt(kilometrajeActual)
          : 0
    };

    if (payload.currentMileage < 0) {
      showAlert("El kilometraje actual no puede ser negativo.");
      return;
    }

    setLoading(btn, true);

    try {
      const res = await createVehiculo(payload);

      if (!res.success) {
        showAlert(res.error?.message || "No se pudo crear el vehículo.");
        return;
      }

      formVehiculo.reset();
      showAlert("Vehículo creado correctamente.", "ok");
      cargarVehiculos();
    } catch (error) {
      console.error("Error creando vehículo:", error);
      showAlert("Error al conectar con el backend.");
    } finally {
      setLoading(btn, false);
    }
  });
}

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarVehiculos);