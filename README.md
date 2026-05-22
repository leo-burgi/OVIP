# OVI Play MVP productivo

E-commerce simple para catálogo, carrito invitado, checkout y pago con Mercado Pago.

Esta versión está preparada para desplegarse como monorepo en Railway:

- `backend/`: FastAPI + MongoDB + Mercado Pago.
- `frontend/`: React servido como sitio estático.
- `DEPLOYMENT_OVI_PLAY.md`: paso a paso de GitHub, Railway, MongoDB y Mercado Pago.

No depende del login de Emergent ni de PayPal. El admin básico usa la variable `ADMIN_API_KEY`.
