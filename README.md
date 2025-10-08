# SaludTech_Digital_Pagina

Pequeña página estática con un backend Express simple para autenticación, carrito y compras usando archivos JSON en `db/`.

Requisitos
- Node.js 18+ instalado

Arrancar localmente (PowerShell - Windows)

Requisitos: Node.js 18+ instalado.

1) Instalar dependencias (una sola vez):

```powershell
npm install
```

2) Iniciar la API (Express) en el puerto 4000:

```powershell
npm run start:api
# o
node server.js
```

3) Iniciar el servidor estático (sirve los archivos en el puerto 5500):

```powershell
npm run serve
# o
npx http-server -p 5500
# si tienes bloqueo de ejecución en PowerShell, ejecuta:
.\node_modules\.bin\http-server.cmd -p 5500
```

4) Abrir en el navegador y probar las páginas clave:

- Frontend: http://localhost:5500/servicios.html
- Detalle: http://localhost:5500/detalle-servicio.html?id=1
- Login: http://localhost:5500/login.html

Endpoints de la API (base http://localhost:4000):
- GET /servicios
- POST /login
- POST /register
- GET /me
- GET /cart  (autenticado)
- PUT /cart  (autenticado)
- POST /purchase (autenticado)
- GET /my-purchases (autenticado)

Notas importantes
- El backend guarda datos en `db/*.json`. Esto es para demo/local; no usar en producción.
- El servidor calcula los totales de compra a partir de `data/servicios.json` para evitar manipulación de precios desde el cliente.

Scripts útiles (package.json)
- `npm run serve` -> arranca un servidor estático en 5500 (http-server)
- `npm run start:api` -> arranca la API (server.js)
- `npm run test:smoke` -> ejecuta `scripts/smoke-test.js` (login → cart → purchase)

Smoke test
Puedes ejecutar el smoke test automatizado para verificar rápidamente el flujo completo:

```powershell
npm run test:smoke
```

Soporte y notas
- Si PowerShell bloquea `npx`, usa el ejecutable local en `node_modules/.bin` o cambia la política de ejecución con `Set-ExecutionPolicy RemoteSigned` (ejecuta PowerShell como administrador para cambiarla).

Contacto
Repositorio: https://github.com/dpcardonabu/SaludTech_Digital_Pagina
