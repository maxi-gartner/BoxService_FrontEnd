# Documentación simple del proyecto BoxService Frontend

Este proyecto es la parte de la interfaz de usuario de BoxService. Su trabajo no es hacer toda la lógica del negocio, sino mostrar información al usuario, recibir datos de entrada y enviarlos al backend.

En pocas palabras:
- La interfaz se encarga de mostrar pantallas.
- Los archivos JavaScript se encargan de captar acciones del usuario.
- El archivo api.js es el puente con el backend.
- El backend es quien realmente valida reglas de negocio y guarda los datos.

---

## 1. ¿Cómo está organizado el proyecto?

La estructura principal es esta:

- pages/: archivos HTML de cada pantalla.
- js/: lógica de interacción y comunicación con el backend.
- css/: estilos visuales.
- components/: partes reutilizables como el menú lateral y el footer.
- index.html: página principal o dashboard.

---

## 2. Qué hace cada carpeta

### pages/
Contiene una página HTML por cada módulo del sistema.

- clientes.html: pantalla para ver, crear y consultar clientes.
- vehiculos.html: pantalla para registrar y listar vehículos.
- services.html: pantalla para crear services y ver historial.
- presupuestos.html: pantalla para crear y gestionar presupuestos.
- facturas.html: pantalla para emitir y gestionar facturas.

### js/
Contiene toda la lógica que hace que las páginas funcionen.

- api.js: centraliza las llamadas al backend.
- components.js: carga elementos compartidos como el sidebar y el footer.
- clientes.js: controla la pantalla de clientes.
- vehiculos.js: controla la pantalla de vehículos.
- services.js: controla la pantalla de services.
- budget.js: controla la pantalla de presupuestos.
- invoice.js: controla la pantalla de facturas.

### css/
Contiene los estilos visuales.

- Main.css: estilos globales del sistema.
- clientes.css, vehicle.css, services.css, budget.css, invoice.css: estilos específicos de cada pantalla.

### components/
Archivos HTML reutilizables.

- sidebar.html: menú de navegación.
- footer.html: pie de página.

---

## 3. Explicación simple de cada archivo

### index.html
Es la página de inicio del sistema, también llamada dashboard.

Qué hace:
- muestra un resumen del sistema;
- ofrece accesos rápidos a clientes, vehículos, services, presupuestos y facturas;
- consulta el estado del servidor y la base de datos mediante la API;
- carga el menú lateral y el footer.

Rol general:
- interfaz de usuario.
- punto de entrada del sistema.

---

### components/sidebar.html
Es el menú lateral que aparece en todas las páginas.

Qué hace:
- muestra enlaces a las distintas pantallas;
- marca la opción activa según la página actual;
- muestra un estado de salud del backend.

Rol general:
- interfaz de usuario.
- componente compartido.

### components/footer.html
Es el pie de página común para las pantallas.

Qué hace:
- muestra información básica de la aplicación.

Rol general:
- interfaz de usuario.

---

### css/Main.css
Es el archivo base de estilos.

Qué hace:
- define colores, tipografías, tamaños, espaciados y componentes base;
- organiza el layout general del sistema;
- da estilo al sidebar, tablas, botones y tarjetas.

Rol general:
- interfaz de usuario.
- diseño del sistema.

### css/clientes.css, vehicle.css, services.css, budget.css, invoice.css
Son estilos propios de cada página.

Qué hacen:
- agregan detalles visuales particulares para cada pantalla;
- no contienen lógica, solo diseño.

Rol general:
- interfaz de usuario.

---

### js/api.js
Este es uno de los archivos más importantes del proyecto.

Qué hace:
- centraliza todas las llamadas al backend mediante fetch;
- define funciones para obtener o crear clientes, vehículos, services, presupuestos y facturas;
- convierte las respuestas en un formato simple de éxito o error.

Por qué es importante:
- evita repetir código en cada pantalla;
- mantiene el proyecto ordenado;
- separa la capa de acceso a datos del resto de la interfaz.

Rol general:
- acceso a datos.
- capa de comunicación con el backend.

Funciones principales:
- getHealth(): verifica si el backend está disponible.
- getClients(), createClient(): clientes.
- getVehiculos(), createVehiculo(): vehículos.
- getServices(), createService(), createServiceDetail(): services.
- getBudgets(), createBudget(), approveBudget(), updateBudgetStatus(): presupuestos.
- getInvoices(), createInvoice(), updateInvoiceStatus(): facturas.

---

### js/components.js
Este archivo se encarga de cargar los componentes compartidos.

Qué hace:
- carga el sidebar y el footer en cada página;
- detecta en qué página está el usuario;
- marca el enlace activo del menú;
- verifica si el backend responde.

Rol general:
- interfaz de usuario.
- carga de componentes reutilizables.

---

### js/clientes.js
Controla la pantalla de clientes.

Qué hace:
- carga la lista de clientes desde el backend;
- muestra los clientes en una tabla;
- permite crear un cliente desde el formulario;
- al hacer clic en un cliente, muestra sus vehículos asociados.

Rol general:
- interfaz de usuario + uso de datos.
- no contiene la lógica del negocio real, solo la presentación y el flujo del formulario.

Funciones principales:
- cargarClientes(): trae y muestra los clientes.
- cargarVehiculos(): trae y muestra los vehículos del cliente seleccionado.
- showError(): muestra errores en la tabla cuando algo falla.
- escapeHtml(): protege el contenido mostrado para evitar problemas con caracteres especiales.

---

### js/vehiculos.js
Controla la pantalla de vehículos.

Qué hace:
- carga la lista de vehículos;
- permite crear un vehículo a partir de un formulario;
- muestra mensajes de éxito o error.

Rol general:
- interfaz de usuario + acceso a datos.

Funciones principales:
- cargarVehiculos(): trae los vehículos desde la API.
- renderVehiculos(): muestra los datos en la tabla.
- crearFila(): arma cada fila de la tabla.
- showAlert(): muestra mensajes del sistema.

---

### js/services.js
Es el módulo más completo del frontend.

Qué hace:
- permite buscar un vehículo o cliente;
- muestra el historial de services de un vehículo;
- permite crear un service manual;
- permite crear un service a partir de un presupuesto aprobado;
- muestra mensajes de éxito o error.

Rol general:
- interfaz de usuario.
- lógica de flujo de trabajo del módulo services.

Funciones principales:
- checkHealth(): revisa si el backend está online.
- cargarVehiculos(): carga vehículos y clientes para la búsqueda.
- renderVehiculos(): muestra los resultados de búsqueda.
- seleccionarVehiculo(): marca un vehículo como seleccionado y muestra detalle.
- cargarHistorialVehiculo(): muestra el historial de services.
- cargarPresupuestosAprobadosVehiculo(): muestra presupuestos aprobados pendientes.
- crearServiceDesdePresupuesto(): crea un service desde un presupuesto ya aprobado.
- serviceForm.addEventListener("submit"): crea un service manual.
- mostrarAlerta() y mostrarMensajeFormulario(): muestran mensajes al usuario.

Importante:
- aunque este archivo tiene bastante lógica, sigue siendo una capa de interfaz y coordinación.
- la lógica real del negocio está en el backend.

---

### js/budget.js
Controla la pantalla de presupuestos.

Qué hace:
- muestra la lista de presupuestos;
- permite abrir un formulario para crear un nuevo presupuesto;
- permite agregar ítems dinámicamente;
- calcula el total del presupuesto en tiempo real;
- permite aprobar o rechazar presupuestos.

Rol general:
- interfaz de usuario + acceso a datos.
- lógica de formulario en frontend.

Funciones principales:
- loadBudgets(): carga la tabla de presupuestos.
- recalcTotal(): calcula el total según cantidad y precio de los ítems.
- window.approveBudgetAction(): aprueba un presupuesto.
- window.rejectBudgetAction(): rechaza un presupuesto.
- document.getElementById("btn-save").addEventListener(...): crea un presupuesto nuevo.

---

### js/invoice.js
Controla la pantalla de facturas.

Qué hace:
- muestra la lista de facturas;
- permite emitir una factura desde un service y un presupuesto;
- permite marcar una factura como cobrada o anularla.

Rol general:
- interfaz de usuario + acceso a datos.

Funciones principales:
- loadInvoices(): carga las facturas.
- window.markPaid(): marca la factura como cobrada.
- window.cancelInvoice(): anula la factura.
- document.getElementById("btn-emit").addEventListener(...): emite una factura nueva.

---

## 4. Qué parte corresponde a cada tipo de responsabilidad

### Acceso a datos
Está concentrado principalmente en:
- js/api.js

Aquí se hacen las peticiones al backend con fetch.

### Lógica de negocio
En este proyecto la lógica de negocio no vive en el frontend.
El frontend solo:
- recoge datos,
- los envía,
- muestra resultados,
- y permite al usuario interactuar.

La lógica real de negocio debería estar en el backend.

### Interfaz de usuario
Está en:
- index.html
- pages/*.html
- components/*.html
- css/*.css
- js/*.js

Aquí se construyen pantallas, formularios, tablas, botones y mensajes.

---

## 5. Flujo típico de una acción en el sistema

Un ejemplo simple sería crear un cliente:

1. El usuario llena el formulario en clientes.html.
2. El archivo clientes.js toma esos datos.
3. clientes.js llama a createClient() desde api.js.
4. api.js envía la solicitud al backend.
5. El backend responde con éxito o error.
6. clientes.js muestra un mensaje y vuelve a cargar la lista.

Este patrón se repite en casi todo el proyecto.

---

## 6. Idea clave para entender el proyecto

El proyecto está pensado como una aplicación frontend simple y modular.

Piensa así:
- HTML = estructura de la pantalla.
- CSS = apariencia.
- JavaScript = comportamiento.
- api.js = comunicación con el servidor.

El frontend es una capa de presentación, no el núcleo del negocio.

---

## 7. Recomendación para un futuro programador

Si vas a trabajar en este proyecto, sigue esta regla:

- No hagas lógica de negocio en los archivos JS de pantalla.
- Usa api.js para cualquier comunicación con el backend.
- Mantén los estilos en CSS y no mezcles lógica con diseño.
- Si agregas una nueva funcionalidad, intenta respetar este flujo:
  1. HTML de la pantalla.
  2. CSS si hace falta.
  3. JS para conectar la UI con api.js.
  4. Backend para la lógica real.

---

## 8. Resumen rápido

- index.html: página principal y dashboard.
- components/: elementos compartidos de navegación.
- api.js: punto central para pedir datos al backend.
- clientes.js: manejo de clientes.
- vehiculos.js: manejo de vehículos.
- services.js: gestión de services.
- budget.js: gestión de presupuestos.
- invoice.js: gestión de facturas.
- css/: estilos visuales.

Si alguien nuevo entra al proyecto, esta mentalidad le ayudará mucho:
"El frontend muestra y solicita; el backend decide y guarda."
