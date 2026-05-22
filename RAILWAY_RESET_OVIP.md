# Reset limpio Railway - OVI Play

## Servicios reales

- Frontend: `https://talented-vitality-production-8431.up.railway.app`
- Backend: `https://ovip-production.up.railway.app`
- Health backend: `https://ovip-production.up.railway.app/api/health`

## Situación detectada

El error `502 Application failed to respond` en `/api/health` indica que el backend no está respondiendo. Con este código, la causa más probable es configuración incorrecta o inaccesible de `MONGO_URL`: antes el backend intentaba crear índices contra Mongo al arrancar y, si Mongo fallaba, la app entera quedaba caída.

El host tipo `kodama.proxy.rlwy.net` no es una página web. Es un endpoint TCP/proxy de MongoDB para conectarse con un cliente Mongo, Compass o backend. Si se abre en el navegador, es normal que falle.

## Variables exactas por servicio

### Servicio backend: `OVIP`

```env
MONGO_URL=${{MongoDB.MONGO_URL}}
DB_NAME=oviplay

FRONTEND_BASE_URL=https://talented-vitality-production-8431.up.railway.app
BACKEND_BASE_URL=https://ovip-production.up.railway.app
CORS_ORIGINS=https://talented-vitality-production-8431.up.railway.app,http://localhost:3000,http://127.0.0.1:3000
COOKIE_SECURE=true

ADMIN_API_KEY=una-clave-larga-privada

MP_ACCESS_TOKEN=TEST-tu-token-de-mercadopago
MP_USE_SANDBOX=true

FREE_SHIPPING_FROM=80000
DEFAULT_SHIPPING_COST=8000

MONGO_SERVER_SELECTION_TIMEOUT_MS=5000
MONGO_CONNECT_TIMEOUT_MS=5000
MONGO_SOCKET_TIMEOUT_MS=5000
```

Notas:

- `MONGO_URL` debe ser una referencia al servicio `MongoDB`, no una URL escrita a mano si podés evitarlo.
- Para producción real de Mercado Pago, cambiar `MP_ACCESS_TOKEN` por `APP_USR-...` y `MP_USE_SANDBOX=false`.
- No poner `/api` al final de `BACKEND_BASE_URL`.

### Servicio frontend: `talented-vitality`

```env
REACT_APP_BACKEND_URL=https://ovip-production.up.railway.app
```

Notas:

- No poner `/api` al final.
- Cada cambio en esta variable requiere redeploy del frontend.

## Orden de redeploy limpio

1. Subir este patch/código al repo.
2. Redeploy backend `OVIP`.
3. Abrir `https://ovip-production.up.railway.app/api/health`.
4. Si `mongo_connected` es `false`, corregir `MONGO_URL` antes de tocar el frontend.
5. Redeploy frontend `talented-vitality`.
6. Abrir `/productos`.
7. Abrir `/admin` y cargar un producto.

## Resultado esperado en health

```json
{
  "ok": true,
  "service": "oviplay-api",
  "db": "oviplay",
  "mongo_connected": true,
  "mongo_error": null,
  "frontend_base_url": "https://talented-vitality-production-8431.up.railway.app",
  "backend_base_url": "https://ovip-production.up.railway.app"
}
```

Si `ok` aparece `false`, la app ya responde, pero Mongo sigue mal configurado.
