// catalogo.js — alta, edición de precio y borrado de ítems del catálogo
import { getCatalog, createCatalogItem, updateCatalogItem, deleteCatalogItem } from "./api.js";
import { escapeHtml, showAlert, setLoading } from "./utils.js";

const alertBox = document.getElementById("alert-box");
const form = document.getElementById("catalogo-form");
const tbody = document.getElementById("catalogo-body");

const TIPO_LABELS = { labor: "Mano de obra", part: "Repuesto" };

async function cargarCatalogo() {
  tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Cargando...</td></tr>';

  const res = await getCatalog();

  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Error: ${escapeHtml(res.error?.message)}</td></tr>`;
    return;
  }

  const items = res.data ?? [];
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Todavía no hay ítems cargados.</td></tr>';
    return;
  }

  tbody.innerHTML = items
    .map(
      (item) => `
    <tr data-catalog-id="${item.catalogId}">
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(TIPO_LABELS[item.type] ?? item.type)}</td>
      <td>
        <div class="catalogo-precio-form">
          <input type="number" class="form-control item-precio" min="0" step="0.01" value="${item.price}">
          <button class="btn btn-secondary btn-sm btn-guardar-precio">Guardar</button>
        </div>
      </td>
      <td>
        <button class="btn btn-danger btn-sm btn-eliminar">Eliminar</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

tbody.addEventListener("click", async (event) => {
  const row = event.target.closest("tr[data-catalog-id]");
  if (!row) return;
  const id = row.dataset.catalogId;

  if (event.target.classList.contains("btn-guardar-precio")) {
    const btn = event.target;
    const precio = parseFloat(row.querySelector(".item-precio").value);

    if (isNaN(precio) || precio < 0) {
      showAlert(alertBox, "El precio tiene que ser un número válido.");
      return;
    }

    setLoading(btn, true, "Guardando...");
    const res = await updateCatalogItem(id, { price: precio });
    setLoading(btn, false);

    if (!res.success) {
      showAlert(alertBox, res.error?.message);
      return;
    }

    showAlert(alertBox, "Precio actualizado.", "ok");
  }

  if (event.target.classList.contains("btn-eliminar")) {
    if (!confirm("¿Eliminar este ítem del catálogo?")) return;

    const res = await deleteCatalogItem(id);
    if (!res.success) {
      showAlert(alertBox, res.error?.message);
      return;
    }

    showAlert(alertBox, "Ítem eliminado.", "ok");
    cargarCatalogo();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  const fd = new FormData(form);

  const payload = {
    name: fd.get("nombre").trim(),
    type: fd.get("tipo"),
    price: parseFloat(fd.get("precio")),
  };

  if (!payload.name) {
    showAlert(alertBox, "Ingresá un nombre.");
    return;
  }

  if (isNaN(payload.price) || payload.price < 0) {
    showAlert(alertBox, "El precio tiene que ser un número válido.");
    return;
  }

  setLoading(btn, true, "Guardando...");
  const res = await createCatalogItem(payload);
  setLoading(btn, false);

  if (!res.success) {
    showAlert(alertBox, res.error?.message);
    return;
  }

  form.reset();
  showAlert(alertBox, "Ítem agregado al catálogo.", "ok");
  cargarCatalogo();
});

document.addEventListener("DOMContentLoaded", cargarCatalogo);
