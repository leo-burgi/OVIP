# OVI Play - puesta en producción rápida

## Decisión técnica recomendada

Para poner en producción rápido sin sobredimensionar:

- **Frontend:** React en Railway, servido como sitio estático con Caddy.
- **Backend:** FastAPI en Railway.
- **Base de datos:** MongoDB dentro del mismo proyecto Railway.
- **Pagos:** Mercado Pago Checkout Pro usando `MP_ACCESS_TOKEN` del titular de la cuenta.
- **Carrito:** invitado por cookie HTTP-only, sin depender del login de Emergent.
- **Admin básico:** protegido por `ADMIN_API_KEY`. No es un backoffice definitivo, pero permite cargar/editar productos.

## Qué se corrigió respecto del código de Emergent

1. Se eliminó la dependencia funcional del login externo de Emergent.
2. El carrito ahora funciona para usuarios invitados.
3. El backend valida precios, stock y total. Ya no confía en el total enviado desde el frontend.
4. Mercado Pago devuelve una única `checkout_url` según sandbox/live.
5. Se agregó webhook de Mercado Pago para actualizar órdenes y descontar stock cuando el pago se aprueba.
6. Se limpió `requirements.txt` para evitar conflictos de paquetes innecesarios.
7. Se agregaron Dockerfiles para deploy por servicio en Railway.
8. Se agregó `.env.example` para backend y frontend.

## Variables de entorno del backend

En Railway, servicio backend:

```env
MONGO_URL=${{MongoDB.MONGO_URL}}
DB_NAME=oviplay
MP_ACCESS_TOKEN=APP_USR_xxxxxxxxxxxxxxxxxxxxx
MP_USE_SANDBOX=false
FRONTEND_BASE_URL=https://tu-frontend.railway.app
BACKEND_BASE_URL=https://tu-backend.railway.app
CORS_ORIGINS=https://tu-frontend.railway.app,http://localhost:3000
COOKIE_SECURE=true
ADMIN_API_KEY=una-clave-larga-dificil
FREE_SHIPPING_FROM=80000
DEFAULT_SHIPPING_COST=8000
```

Para correr local en `http://localhost`, usar `COOKIE_SECURE=false`; si queda en `true`, el navegador puede no guardar la cookie del carrito.

Para pruebas con credenciales TEST de Mercado Pago:

```env
MP_USE_SANDBOX=true
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxx
```

## Variables de entorno del frontend

En Railway, servicio frontend:

```env
REACT_APP_BACKEND_URL=https://tu-backend.railway.app
```

Importante: como es Create React App, esa variable se usa en build-time. Si cambiás el backend después, redeploy del frontend.

## Deploy en Railway

### 1. Subir repo a GitHub

```bash
git init
git add .
git commit -m "prepare oviplay production mvp"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si el repo remoto ya existe:

```bash
git remote -v
git add .
git commit -m "prepare oviplay production mvp"
git pull origin main --rebase
git push origin main
```

### 2. Crear proyecto Railway

- New Project → Deploy from GitHub Repo.
- Seleccionar el repo.
- Crear tres servicios dentro del mismo proyecto:
  - `backend`, con root directory `/backend`.
  - `frontend`, con root directory `/frontend`.
  - `MongoDB`, desde `+ New` → Database → MongoDB.

### 3. Backend

En el servicio backend:

- Root directory: `/backend`
- Railway debería detectar el `Dockerfile`.
- Variables: cargar las del bloque backend.
- Networking → Public Networking → Generate Domain.
- Guardar la URL generada como `BACKEND_BASE_URL`.

### 4. Frontend

En el servicio frontend:

- Root directory: `/frontend`
- Railway debería detectar el `Dockerfile`.
- Variable: `REACT_APP_BACKEND_URL=https://url-del-backend.railway.app`
- Networking → Public Networking → Generate Domain.
- Guardar esa URL en el backend como `FRONTEND_BASE_URL` y `CORS_ORIGINS`.
- Redeploy backend y frontend después de ajustar URLs.

### 5. Base de datos y carga inicial

Opción rápida local, apuntando al Mongo público o privado según cómo lo configures:

```bash
cd backend
cp .env.example .env
# ajustar MONGO_URL y DB_NAME
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
```

En Railway también podés correrlo desde un shell/one-off command si tu plan y UI lo permite:

```bash
python seed_data.py
```

### 6. Mercado Pago

En Mercado Pago Developers:

1. Crear una aplicación o usar una existente del titular.
2. Copiar el Access Token productivo a `MP_ACCESS_TOKEN`.
3. Configurar webhook o dejar que la preferencia envíe `notification_url` dinámicamente.
4. URL de webhook:

```txt
https://tu-backend.railway.app/api/payments/mercadopago/webhook
```

Para test:

- Usar credenciales TEST.
- Setear `MP_USE_SANDBOX=true`.
- Usar usuario comprador de prueba, no tu misma cuenta vendedora.

## Prueba funcional mínima

1. Abrir frontend.
2. Entrar a `/productos`.
3. Agregar un producto al carrito sin login.
4. Ir a carrito.
5. Ir a checkout.
6. Completar datos.
7. Pagar con Mercado Pago.
8. Volver a success/pending/failure.
9. Verificar en MongoDB colección `orders`:
   - `payment_status`
   - `status`
   - `mp_payment_id`
10. Verificar que stock se descuenta al aprobarse el pago.

## Administración de productos

Ir a:

```txt
https://tu-frontend.railway.app/admin
```

Ingresar la misma clave configurada en `ADMIN_API_KEY`.

Este admin es suficiente para MVP, no para operación seria. Próximo paso: usuarios reales, roles, imágenes propias, variantes, órdenes, estados de envío y notificaciones.

## Reset aplicado para este deploy

URLs actuales usadas en Railway:

```txt
Frontend: https://talented-vitality-production-8431.up.railway.app
Backend: https://ovip-production.up.railway.app
Health:   https://ovip-production.up.railway.app/api/health
```

Variables finales recomendadas:

Backend `OVIP`:

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

Frontend `talented-vitality`:

```env
REACT_APP_BACKEND_URL=https://ovip-production.up.railway.app
```

El código actual endurece `/api/health`: si Mongo falla, la aplicación ya no debería caerse completa; el endpoint debe responder con `mongo_connected: false` y el error de conexión. Eso permite diagnosticar variables sin quedar a ciegas con un 502 genérico.
