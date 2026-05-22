from __future__ import annotations

import logging
import os
import re
import secrets
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import mercadopago
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "oviplay")
MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "").rstrip("/")
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "").rstrip("/")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "true").lower() in {"1", "true", "yes"}
COOKIE_SAMESITE = "none" if COOKIE_SECURE else "lax"
MP_USE_SANDBOX = os.environ.get("MP_USE_SANDBOX", "false").lower() in {"1", "true", "yes"}
FREE_SHIPPING_FROM = float(os.environ.get("FREE_SHIPPING_FROM", "80000"))
DEFAULT_SHIPPING_COST = float(os.environ.get("DEFAULT_SHIPPING_COST", "8000"))

DEFAULT_CATEGORIES = [
    {
        "category_id": "cat_move",
        "nombre": "OVI Move",
        "descripcion": "Articulados que se mueven y se coleccionan",
    },
    {
        "category_id": "cat_build",
        "nombre": "OVI Build",
        "descripcion": "Kits para armar, encastrar y construir",
    },
    {
        "category_id": "cat_game",
        "nombre": "OVI Game",
        "descripcion": "Juegos simples para compartir en familia",
    },
    {
        "category_id": "cat_mini",
        "nombre": "OVI Mini",
        "descripcion": "Figuras pequeñas, llaveros y accesorios",
    },
    {
        "category_id": "cat_learn",
        "nombre": "OVI Learn",
        "descripcion": "Letras, números y formas para aprender jugando",
    },
]

client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=int(os.environ.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000")),
    connectTimeoutMS=int(os.environ.get("MONGO_CONNECT_TIMEOUT_MS", "5000")),
    socketTimeoutMS=int(os.environ.get("MONGO_SOCKET_TIMEOUT_MS", "5000")),
)
db = client[DB_NAME]
mp_sdk = mercadopago.SDK(MP_ACCESS_TOKEN) if MP_ACCESS_TOKEN else None

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("oviplay")

app = FastAPI(title="OVI Play API", version="1.0.0")
api_router = APIRouter(prefix="/api")


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    nombre: str
    descripcion: str
    precio: float = Field(ge=0)
    edad_minima: int = Field(ge=0)
    edad_maxima: int = Field(ge=0)
    categoria: str
    imagen_url: str
    stock: int = Field(ge=0)
    created_at: datetime


class ProductCreate(BaseModel):
    nombre: str
    descripcion: str
    precio: float = Field(ge=0)
    edad_minima: int = Field(ge=0)
    edad_maxima: int = Field(ge=0)
    categoria: str
    imagen_url: str
    stock: int = Field(ge=0)


class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(default=None, ge=0)
    edad_minima: Optional[int] = Field(default=None, ge=0)
    edad_maxima: Optional[int] = Field(default=None, ge=0)
    categoria: Optional[str] = None
    imagen_url: Optional[str] = None
    stock: Optional[int] = Field(default=None, ge=0)


class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str
    nombre: str
    descripcion: str = ""


class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    quantity: int = Field(gt=0)


class OrderItem(BaseModel):
    product_id: str
    nombre: str
    precio: float
    quantity: int


class OrderCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    items: List[CartItem]
    payment_method: str = "mercadopago"
    shipping_address: Dict
    guest_email: Optional[EmailStr] = None


class MPPreferenceRequest(BaseModel):
    order_id: str


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return value.lower().strip()


def parse_origins() -> List[str]:
    origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip().rstrip("/") for origin in origins.split(",") if origin.strip()]


def set_cart_cookie(response: Response, owner_id: str) -> None:
    response.set_cookie(
        key="cart_owner_id",
        value=owner_id,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=60 * 60 * 24 * 30,
        path="/",
    )


def get_or_create_cart_owner(request: Request, response: Optional[Response] = None) -> str:
    owner_id = request.cookies.get("cart_owner_id")
    if not owner_id:
        owner_id = f"guest_{uuid.uuid4().hex[:24]}"
        if response is not None:
            set_cart_cookie(response, owner_id)
    return owner_id


async def require_admin(request: Request) -> bool:
    if not ADMIN_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ADMIN_API_KEY no configurada en el backend",
        )
    incoming_key = request.headers.get("X-Admin-Key", "")
    if not incoming_key or not secrets.compare_digest(incoming_key, ADMIN_API_KEY):
        raise HTTPException(status_code=403, detail="Clave de administración inválida")
    return True


def serialize_datetime(doc: Dict, *fields: str) -> Dict:
    for field in fields:
        if isinstance(doc.get(field), str):
            doc[field] = datetime.fromisoformat(doc[field])
    return doc


def shipping_cost_for(subtotal: float) -> float:
    return 0 if subtotal >= FREE_SHIPPING_FROM else DEFAULT_SHIPPING_COST


async def build_order_items(items: List[CartItem]) -> tuple[List[Dict], float]:
    if not items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")

    consolidated: Dict[str, int] = {}
    for item in items:
        consolidated[item.product_id] = consolidated.get(item.product_id, 0) + item.quantity

    product_ids = list(consolidated.keys())
    products = await db.products.find(
        {"product_id": {"$in": product_ids}},
        {"_id": 0},
    ).to_list(len(product_ids))
    products_by_id = {product["product_id"]: product for product in products}

    order_items: List[Dict] = []
    subtotal = 0.0

    for product_id, quantity in consolidated.items():
        product = products_by_id.get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto no encontrado: {product_id}")
        if int(product.get("stock", 0)) < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {product.get('nombre', product_id)}",
            )

        price = float(product["precio"])
        subtotal += price * quantity
        order_items.append(
            {
                "product_id": product_id,
                "nombre": product["nombre"],
                "precio": price,
                "quantity": quantity,
            }
        )

    return order_items, subtotal


async def mark_order_as_paid(order_id: str, payment: Dict) -> None:
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        return

    already_completed = order.get("payment_status") == "completed"
    if already_completed:
        return

    for item in order.get("items", []):
        await db.products.update_one(
            {"product_id": item["product_id"], "stock": {"$gte": item["quantity"]}},
            {"$inc": {"stock": -int(item["quantity"])}},
        )

    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "mp_payment_id": str(payment.get("id")),
                "payment_status": "completed",
                "payment_status_detail": payment.get("status_detail"),
                "status": "processing",
                "paid_amount": payment.get("transaction_amount"),
                "paid_at": utc_now().isoformat(),
            }
        },
    )

    cart_owner_id = order.get("cart_owner_id")
    if cart_owner_id:
        await db.carts.delete_one({"owner_id": cart_owner_id})


async def ping_db() -> tuple[bool, Optional[str]]:
    try:
        await db.command("ping")
        return True, None
    except (ServerSelectionTimeoutError, PyMongoError) as exc:
        return False, str(exc)
    except Exception as exc:
        return False, str(exc)


async def ensure_default_categories() -> None:
    for category in DEFAULT_CATEGORIES:
        await db.categories.update_one(
            {"category_id": category["category_id"]},
            {"$setOnInsert": category},
            upsert=True,
        )


async def ensure_indexes() -> None:
    await db.products.create_index("product_id", unique=True)
    await db.products.create_index("categoria")
    await db.categories.create_index("category_id", unique=True)
    await db.carts.create_index("owner_id", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("mp_preference_id")
    await db.orders.create_index("mp_payment_id")


@app.on_event("startup")
async def startup() -> None:
    # No hacemos caer toda la app si Mongo está mal configurado.
    # Así /api/health responde y permite diagnosticar el problema en Railway.
    db_ok, db_error = await ping_db()
    if not db_ok:
        logger.error("MongoDB no disponible al iniciar: %s", db_error)
        return

    await ensure_indexes()
    await ensure_default_categories()


@api_router.get("/health")
async def health():
    db_ok, db_error = await ping_db()
    return {
        "ok": db_ok,
        "service": "oviplay-api",
        "db": DB_NAME,
        "mongo_connected": db_ok,
        "mongo_error": db_error if not db_ok else None,
        "frontend_base_url": FRONTEND_BASE_URL,
        "backend_base_url": BACKEND_BASE_URL,
    }


@api_router.get("/auth/me")
async def get_me():
    # El login de Emergent no es portable. Para este MVP se permite compra invitada
    # y el admin se protege con X-Admin-Key.
    raise HTTPException(status_code=401, detail="No autenticado")


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="cart_owner_id", path="/")
    return {"message": "Sesión local cerrada"}


@api_router.get("/products")
async def get_products(
    categoria: Optional[str] = None,
    edad_min: Optional[int] = None,
    edad_max: Optional[int] = None,
    search: Optional[str] = None,
):
    query: Dict = {}
    and_clauses: List[Dict] = []

    if categoria:
        query["categoria"] = categoria

    if edad_min is not None and edad_max is not None:
        and_clauses.append(
            {"edad_minima": {"$lte": edad_max}, "edad_maxima": {"$gte": edad_min}}
        )

    if search:
        escaped = re.escape(normalize_text(search))
        and_clauses.append(
            {
                "$or": [
                    {"nombre_normalizado": {"$regex": escaped, "$options": "i"}},
                    {"descripcion_normalizada": {"$regex": escaped, "$options": "i"}},
                    {"nombre": {"$regex": re.escape(search), "$options": "i"}},
                    {"descripcion": {"$regex": re.escape(search), "$options": "i"}},
                ]
            }
        )

    if and_clauses:
        query["$and"] = and_clauses

    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for product in products:
        serialize_datetime(product, "created_at")
    return products


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return serialize_datetime(product, "created_at")


@api_router.post("/admin/products", dependencies=[Depends(require_admin)])
async def create_product(product_data: ProductCreate):
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    doc = {
        "product_id": product_id,
        **product_data.model_dump(),
        "nombre_normalizado": normalize_text(product_data.nombre),
        "descripcion_normalizada": normalize_text(product_data.descripcion),
        "created_at": utc_now().isoformat(),
    }
    await db.products.insert_one(doc)
    return Product(**serialize_datetime(doc, "created_at"))


@api_router.put("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
async def update_product(product_id: str, product_data: ProductUpdate):
    existing = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if "nombre" in update_data:
        update_data["nombre_normalizado"] = normalize_text(update_data["nombre"])
    if "descripcion" in update_data:
        update_data["descripcion_normalizada"] = normalize_text(update_data["descripcion"])

    if update_data:
        await db.products.update_one({"product_id": product_id}, {"$set": update_data})

    updated = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return Product(**serialize_datetime(updated, "created_at"))


@api_router.delete("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
async def delete_product(product_id: str):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado"}


@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("nombre", 1).to_list(100)
    if not categories:
        # Fallback útil para una base nueva: el admin ya puede cargar productos
        # aunque todavía no se haya corrido seed_data.py.
        return DEFAULT_CATEGORIES
    return categories


@api_router.get("/cart")
async def get_cart(request: Request, response: Response):
    owner_id = get_or_create_cart_owner(request, response)
    cart = await db.carts.find_one({"owner_id": owner_id}, {"_id": 0})
    if not cart:
        return {"owner_id": owner_id, "items": []}
    return cart


@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, request: Request, response: Response):
    owner_id = get_or_create_cart_owner(request, response)
    product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    cart = await db.carts.find_one({"owner_id": owner_id}, {"_id": 0})
    items = cart.get("items", []) if cart else []
    current_quantity = 0
    for cart_item in items:
        if cart_item["product_id"] == item.product_id:
            current_quantity = int(cart_item["quantity"])
            break

    if int(product.get("stock", 0)) < current_quantity + item.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    found = False
    for cart_item in items:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] = int(cart_item["quantity"]) + item.quantity
            found = True
            break
    if not found:
        items.append(item.model_dump())

    await db.carts.update_one(
        {"owner_id": owner_id},
        {
            "$set": {"items": items, "updated_at": utc_now().isoformat()},
            "$setOnInsert": {"owner_id": owner_id, "created_at": utc_now().isoformat()},
        },
        upsert=True,
    )
    return {"message": "Producto agregado al carrito", "items": items}


@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, request: Request, response: Response):
    owner_id = get_or_create_cart_owner(request, response)
    cart = await db.carts.find_one({"owner_id": owner_id}, {"_id": 0})
    if not cart:
        return {"message": "Carrito vacío"}

    items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
    await db.carts.update_one(
        {"owner_id": owner_id},
        {"$set": {"items": items, "updated_at": utc_now().isoformat()}},
    )
    return {"message": "Producto eliminado del carrito"}


@api_router.put("/cart/update/{product_id}")
async def update_cart_item(product_id: str, quantity: int, request: Request, response: Response):
    if quantity < 1:
        raise HTTPException(status_code=400, detail="Cantidad debe ser mayor a 0")

    owner_id = get_or_create_cart_owner(request, response)
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if int(product.get("stock", 0)) < quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    cart = await db.carts.find_one({"owner_id": owner_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")

    items = cart.get("items", [])
    found = False
    for cart_item in items:
        if cart_item["product_id"] == product_id:
            cart_item["quantity"] = quantity
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Producto no encontrado en el carrito")

    await db.carts.update_one(
        {"owner_id": owner_id},
        {"$set": {"items": items, "updated_at": utc_now().isoformat()}},
    )
    return {"message": "Carrito actualizado"}


@api_router.post("/orders")
async def create_order(order_data: OrderCreate, request: Request, response: Response):
    if order_data.payment_method != "mercadopago":
        raise HTTPException(status_code=400, detail="Por ahora solo está habilitado Mercado Pago")

    owner_id = get_or_create_cart_owner(request, response)
    order_items, subtotal = await build_order_items(order_data.items)
    shipping_cost = shipping_cost_for(subtotal)
    total = subtotal + shipping_cost
    order_id = f"order_{uuid.uuid4().hex[:12]}"

    order_doc = {
        "order_id": order_id,
        "cart_owner_id": owner_id,
        "guest_email": str(order_data.guest_email) if order_data.guest_email else None,
        "items": order_items,
        "subtotal": subtotal,
        "shipping_cost": shipping_cost,
        "total": total,
        "payment_method": "mercadopago",
        "payment_status": "pending",
        "status": "created",
        "shipping_address": order_data.shipping_address,
        "created_at": utc_now().isoformat(),
    }
    await db.orders.insert_one(order_doc)
    return serialize_datetime(order_doc, "created_at")


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return serialize_datetime(order, "created_at")


@api_router.get("/admin/orders", dependencies=[Depends(require_admin)])
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_datetime(order, "created_at") for order in orders]


@api_router.post("/payments/mercadopago/preference")
async def create_mp_preference(payload: MPPreferenceRequest, request: Request):
    if not mp_sdk:
        raise HTTPException(status_code=503, detail="Mercado Pago no configurado")

    order = await db.orders.find_one({"order_id": payload.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    frontend_url = FRONTEND_BASE_URL or str(request.base_url).rstrip("/")
    backend_url = BACKEND_BASE_URL or str(request.base_url).rstrip("/")

    mp_items = [
        {
            "id": item["product_id"],
            "title": item["nombre"],
            "quantity": int(item["quantity"]),
            "currency_id": "ARS",
            "unit_price": float(item["precio"]),
        }
        for item in order.get("items", [])
    ]

    if order.get("shipping_cost", 0) > 0:
        mp_items.append(
            {
                "id": "shipping",
                "title": "Envío",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(order["shipping_cost"]),
            }
        )

    preference_data = {
        "items": mp_items,
        "external_reference": order["order_id"],
        "back_urls": {
            "success": f"{frontend_url}/checkout/success?order_id={order['order_id']}",
            "failure": f"{frontend_url}/checkout/failure?order_id={order['order_id']}",
            "pending": f"{frontend_url}/checkout/pending?order_id={order['order_id']}",
        },
        "auto_return": "approved",
        "notification_url": f"{backend_url}/api/payments/mercadopago/webhook",
        "statement_descriptor": "OVI PLAY",
        "metadata": {"order_id": order["order_id"]},
    }

    try:
        mp_response = mp_sdk.preference().create(preference_data)
        if mp_response.get("status") not in (200, 201):
            logger.error("Mercado Pago preference error: %s", mp_response)
            raise HTTPException(status_code=502, detail="Error creando preferencia de pago")

        preference = mp_response["response"]
        checkout_url = preference.get("sandbox_init_point") if MP_USE_SANDBOX else preference.get("init_point")
        if not checkout_url:
            checkout_url = preference.get("init_point") or preference.get("sandbox_init_point")

        await db.orders.update_one(
            {"order_id": order["order_id"]},
            {
                "$set": {
                    "mp_preference_id": preference.get("id"),
                    "status": "waiting_payment",
                    "updated_at": utc_now().isoformat(),
                }
            },
        )

        return {
            "preference_id": preference.get("id"),
            "checkout_url": checkout_url,
            "init_point": preference.get("init_point"),
            "sandbox_init_point": preference.get("sandbox_init_point"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error Mercado Pago")
        raise HTTPException(status_code=502, detail=f"Error Mercado Pago: {exc}") from exc


@api_router.post("/payments/mercadopago/webhook")
async def mp_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}

    topic = body.get("type") or body.get("topic") or request.query_params.get("type") or request.query_params.get("topic")
    data = body.get("data") if isinstance(body.get("data"), dict) else {}
    payment_id = data.get("id") or request.query_params.get("id") or request.query_params.get("data.id")

    if topic not in {"payment", "payments"} or not payment_id or not mp_sdk:
        return {"status": "ok"}

    try:
        payment_response = mp_sdk.payment().get(payment_id)
        if payment_response.get("status") != 200:
            logger.warning("No se pudo consultar pago MP: %s", payment_response)
            return {"status": "ok"}

        payment = payment_response["response"]
        external_reference = payment.get("external_reference") or payment.get("metadata", {}).get("order_id")
        if not external_reference:
            return {"status": "ok"}

        status = payment.get("status")
        payment_status = {
            "approved": "completed",
            "in_process": "pending",
            "pending": "pending",
            "rejected": "failed",
            "cancelled": "cancelled",
            "refunded": "refunded",
            "charged_back": "charged_back",
        }.get(status, status or "unknown")

        if status == "approved":
            await mark_order_as_paid(external_reference, payment)
        else:
            await db.orders.update_one(
                {"order_id": external_reference, "payment_status": {"$ne": "completed"}},
                {
                    "$set": {
                        "mp_payment_id": str(payment.get("id")),
                        "payment_status": payment_status,
                        "payment_status_detail": payment.get("status_detail"),
                        "status": "payment_pending" if payment_status == "pending" else "payment_failed",
                        "updated_at": utc_now().isoformat(),
                    }
                },
            )
    except Exception:
        logger.exception("Error procesando webhook MP")

    return {"status": "ok"}


@api_router.get("/payments/mercadopago/order-status/{order_id}")
async def get_mp_order_status(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return {
        "order_id": order["order_id"],
        "status": order.get("status"),
        "payment_status": order.get("payment_status"),
        "payment_status_detail": order.get("payment_status_detail"),
        "total": order.get("total"),
    }


app.include_router(api_router)

origins = parse_origins()
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
