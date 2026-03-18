<h1 align="center">🚗 BoxService</h1>
<p align="center">
Sistema de gestión para lubricentros y talleres mecánicos
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-8-blue" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue" />
  <img src="https://img.shields.io/badge/Status-En desarrollo-yellow" />
</p>

# BoxService — Frontend

> Interfaz web del sistema de gestión de lubricentro.
> Construida en HTML, CSS y JavaScript vanilla, sin frameworks.

---

## Descripción

Este repositorio contiene el frontend de **BoxService**, un sistema de gestión para lubricentros y centros de service vehicular.

El frontend se comunica con el backend mediante `fetch()` y muestra los datos al operario del taller. Toda la lógica de negocio vive en el backend — el frontend solo presenta datos y envía requests.

---

## Integrantes

| Nombre               | Legajo | Módulo                               |
| -------------------- | ------ | ------------------------------------ |
| Gartner, Maximiliano | 18396  | Arquitecto + Presupuestos y Facturas |
| Carrasco, Cristhian  | 18403  | Clientes                             |
| Busch, Leonardo      | 18404  | Vehículos                            |
| Quesada, Oscar       | 18382  | Services + Dashboard                 |

---

## Tecnologías

|            |                                      |
| ---------- | ------------------------------------ |
| Lenguaje   | HTML5 + CSS3 + JavaScript ES6        |
| Módulos JS | ES Modules nativos (`import/export`) |
| Fuente     | IBM Plex Mono (Google Fonts)         |
| Frameworks | Ninguno                              |

---

## Estructura del proyecto

```
BoxService-FrontEnd/
├── css/
│   ├── main.css          ← variables de diseño y componentes base (NO TOCAR sin avisar)
│   ├── clientes.css      ← estilos exclusivos de la página clientes
│   ├── vehiculos.css     ← estilos exclusivos de la página vehículos
│   ├── services.css      ← estilos exclusivos de la página services
│   ├── presupuestos.css  ← estilos exclusivos de la página presupuestos
│   └── facturas.css      ← estilos exclusivos de la página facturas
├── js/
│   ├── api.js            ← todos los fetch centralizados (NO TOCAR sin avisar)
│   ├── clientes.js       ← lógica de presentación de clientes
│   ├── vehiculos.js      ← lógica de presentación de vehículos
│   ├── services.js       ← lógica de presentación de services
│   ├── presupuestos.js   ← lógica de presentación de presupuestos
│   └── facturas.js       ← lógica de presentación de facturas
├── pages/
│   ├── clientes.html
│   ├── vehiculos.html
│   ├── services.html
│   ├── presupuestos.html
│   └── facturas.html
└── index.html            ← dashboard principal con navegación
```

---

## Archivos clave

### `css/main.css`

Contiene todas las variables CSS del sistema de diseño: colores, tipografía, espaciado, bordes y componentes base (botones, inputs, cards, tablas, badges). Todos los demás archivos CSS lo importan. **No modificar sin avisar al grupo.**

### `js/api.js`

Centraliza todas las llamadas `fetch()` al backend. Cada función devuelve la respuesta en formato envelope `{ success, data, error }`. Los archivos JS de cada página solo llaman funciones de este archivo. **No modificar sin avisar al grupo.**

---

## Cómo correr el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/BoxService-FrontEnd.git
```

### 2. Asegurarse de que el backend esté corriendo

El frontend consume la API en `http://localhost:5000`. El backend debe estar iniciado antes de abrir el frontend.

Ver instrucciones en el repo [BoxService-BackEnd](https://github.com/tu-usuario/BoxService-BackEnd).

### 3. Abrir en el navegador

Abrir directamente el archivo `index.html` en el navegador, o usar la extensión **Live Server** de Visual Studio Code para recarga automática.

> No se necesita servidor propio para el frontend — el backend ya configura CORS para permitir requests desde cualquier origen local.

---

## Sistema de diseño

### Paleta de colores

| Variable               | Color     | Uso                                   |
| ---------------------- | --------- | ------------------------------------- |
| `--color-bg`           | `#111827` | Fondo de todas las páginas            |
| `--color-surface`      | `#1F2937` | Fondo de cards y paneles              |
| `--color-border`       | `#374151` | Bordes de inputs, tablas, separadores |
| `--color-accent`       | `#F59E0B` | Botones primarios, links activos      |
| `--color-accent-hover` | `#D97706` | Hover del botón primario              |
| `--color-muted`        | `#9CA3AF` | Labels, texto secundario              |
| `--color-light`        | `#F3F4F6` | Texto principal y títulos             |

### Tipografía

Fuente única: **IBM Plex Mono** — importada desde Google Fonts en el `<head>` de cada HTML.

| Variable      | Tamaño | Usar en                        |
| ------------- | ------ | ------------------------------ |
| `--text-xs`   | 12px   | Badges de estado               |
| `--text-sm`   | 14px   | Labels, texto de tabla         |
| `--text-base` | 16px   | Texto general, inputs, botones |
| `--text-lg`   | 18px   | Subtítulos                     |
| `--text-xl`   | 20px   | Títulos de card                |
| `--text-2xl`  | 24px   | Títulos de página              |
| `--text-3xl`  | 30px   | Título principal               |

### Regla principal

**El frontend es tonto.** Solo muestra datos y manda requests. Toda la lógica vive en el backend.

```
❌ No calcular totales ni subtotales en JS
❌ No validar reglas de negocio en JS
❌ No decidir si un presupuesto se puede aprobar en JS
✅ Llamar funciones de api.js y mostrar el resultado
✅ Mostrar error.message si success es false
```

---

## Comunicación con el backend

Todas las llamadas pasan por `js/api.js`. Cada función devuelve un objeto con esta estructura:

```javascript
// Éxito
{ success: true, data: { ... }, error: null }

// Error
{ success: false, data: null, error: { code: 404, message: "No encontrado" } }
```

Ejemplo de uso en cualquier página:

```javascript
import { getClientes } from "./api.js";

const res = await getClientes();

if (res.success) {
  mostrarTabla(res.data);
} else {
  mostrarError(res.error.message);
}
```

---

## Convenciones del equipo

- Usar solo variables CSS definidas en `main.css` — nunca hardcodear colores ni tamaños
- El CSS propio de cada página solo tiene estilos que no existen en `main.css`
- Cada página importa siempre los dos CSS: `main.css` y el propio
- `main.css` y `api.js` solo los modifica Maxi
- Nunca poner lógica de negocio en los archivos JS de las páginas
- Nunca hacer fetch directo — siempre usar las funciones de `api.js`
