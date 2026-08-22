// components.js — carga los componentes compartidos (sidebar, footer)
// Importar en cada página ANTES que el JS propio de la página.
// Detecta automáticamente qué página es y marca el link activo en el sidebar.

// ROOT guarda la ruta base para llegar a la carpeta "components".
// Puede valer "." o ".." dependiendo de si estamos en index.html o dentro de /pages/.
const ROOT = getRootPath();

// Esta función calcula desde dónde tiene que buscar los componentes.
// Si la URL contiene "/pages/", significa que estamos dentro de la carpeta pages,
// entonces necesitamos subir un nivel con "..".
// Si no estamos dentro de /pages/, estamos en el index y usamos ".".
function getRootPath() {
  // Ejemplo:
  // index.html              → "."
  // pages/vehiculos.html   → ".."
  return window.location.pathname.includes("/pages/") ? ".." : ".";
}

// Esta función carga un archivo HTML externo y lo mete dentro de un contenedor.
// selector: es el id/clase donde se va a insertar el componente.
// file: es el archivo que queremos cargar, por ejemplo "sidebar.html".
async function loadComponent(selector, file) {
  // Busca en el HTML el elemento donde vamos a insertar el componente.
  // Ejemplo: "#sidebar-container" o "#footer-container".
  const el = document.querySelector(selector);

  // Si no encuentra el elemento, corta la función.
  // Esto evita errores si una página no tiene ese contenedor.
  if (!el) return;

  try {
    // Hace una petición para traer el archivo HTML.
    // ROOT permite que funcione tanto desde index.html como desde /pages/.
    const res = await fetch(`${ROOT}/components/${file}`);

    // Convierte la respuesta a texto HTML y la inserta dentro del contenedor.
    // Ejemplo: mete sidebar.html dentro de <div id="sidebar-container"></div>.
    el.innerHTML = await res.text();
  } catch (e) {
    // Si falla la carga del componente, muestra una advertencia en consola.
    console.warn(`No se pudo cargar ${file}:`, e);
  }
}

// Esta función marca como activo el link correspondiente del sidebar.
function setActiveLink() {
  // Lee el data-page del body.
  // Ejemplo: <body data-page="vehiculos">
  const page = document.body.dataset.page;

  // Si el body no tiene data-page, no hace nada.
  if (!page) return;

  // Busca todos los links del sidebar que tengan la clase .sidebar-link.
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    // Compara el data-page del link con el data-page del body.
    // Si coinciden, significa que ese link corresponde a la página actual.
    if (link.dataset.page === page) {
      // Le agrega la clase active para que el CSS lo marque visualmente.
      link.classList.add("active");
    }
  });
}

// Esta función consulta el estado del backend para mostrar Online/Offline en el sidebar.
async function checkHealth() {
  // Busca el elemento del sidebar donde se muestra el estado.
  // Ejemplo: <span id="sidebar-health">● Verificando...</span>
  const indicator = document.getElementById("sidebar-health");

  // Si no existe ese elemento, corta la función.
  if (!indicator) return;

  try {
    // Llama al endpoint /health del backend.
    const res = await fetch("http://localhost:5001/health");

    // Convierte la respuesta del backend a JSON.
    const json = await res.json();

    // Si la respuesta fue correcta y el status es "healthy",
    // muestra Online en verde.
    if (json.success && json.data.status === "healthy") {
      indicator.textContent = "● Online";
      indicator.style.color = "#6EE7B7";
    } else {
      // Si el backend responde pero el estado no es healthy,
      // muestra Degraded en amarillo/naranja.
      indicator.textContent = "● Degraded";
      indicator.style.color = "#F59E0B";
    }
  } catch {
    // Si no puede conectar con el backend,
    // muestra Offline en rojo.
    indicator.textContent = "● Offline";
    indicator.style.color = "#EF4444";
  }
}

// Carga todo al arrancar la página.
// DOMContentLoaded espera a que el HTML esté cargado antes de ejecutar el código.
document.addEventListener("DOMContentLoaded", async () => {
  // Carga el sidebar dentro del contenedor #sidebar-container.
  await loadComponent("#sidebar-container", "sidebar.html");

  // Carga el footer dentro del contenedor #footer-container.
  await loadComponent("#footer-container", "footer.html");

  // Una vez cargado el sidebar, marca qué link está activo.
  setActiveLink();

  // Consulta el estado del backend y actualiza el indicador del sidebar.
  checkHealth();
});