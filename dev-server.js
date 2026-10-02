// dev-server.js — servidor estático mínimo para probar el frontend en local.
//
// No hay build ni framework acá: esto solo sirve los archivos .html/.css/.js
// tal cual están en disco, igual que haría Live Server. Sin esto, abrir
// index.html con doble click no funciona: los <script type="module"> no
// cargan sobre file:// (el navegador bloquea el fetch de módulos por CORS).
//
// El backend (BoxService_BackEnd) se levanta aparte, con `dotnet run`,
// y escucha en http://localhost:5001 — ya tiene CORS abierto para esto.
//
// Uso: npm run dev   (o: node dev-server.js [puerto])

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.argv[2] || process.env.PORT || 5500);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let filePath = path.join(root, urlPath);

  // Nunca servir nada fuera de la carpeta del frontend.
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 - No encontrado: ${urlPath}`);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`BoxService frontend (dev) corriendo en http://localhost:${port}`);
  console.log(`Asegurate de que el backend esté levantado en http://localhost:5001 (dotnet run).`);
});
