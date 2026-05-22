import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'oviplay')]


def normalize_text(value: str) -> str:
    import unicodedata
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return value.lower().strip()

async def seed_data():
    print("Iniciando seed de datos...")
    
    existing_categories = await db.categories.count_documents({})
    if existing_categories == 0:
        categories = [
            {
                "category_id": "cat_move",
                "nombre": "OVI Move",
                "descripcion": "Animales, dinosaurios, dragones y robots articulados para mover y coleccionar"
            },
            {
                "category_id": "cat_build",
                "nombre": "OVI Build",
                "descripcion": "Kits para armar, encastrar y construir. Desarrolla motricidad y creatividad"
            },
            {
                "category_id": "cat_game",
                "nombre": "OVI Game",
                "descripcion": "Dados, ruletas y juegos de reglas simples para jugar en familia"
            },
            {
                "category_id": "cat_mini",
                "nombre": "OVI Mini",
                "descripcion": "Figuras pequeñas, llaveros y accesorios. Regalos perfectos"
            },
            {
                "category_id": "cat_learn",
                "nombre": "OVI Learn",
                "descripcion": "Letras, números y formas para aprender jugando"
            }
        ]
        await db.categories.insert_many(categories)
        print(f"Se crearon {len(categories)} categorías")
    
    existing_products = await db.products.count_documents({})
    if existing_products == 0:
        products = [
            {
                "product_id": "prod_001",
                "nombre": "Dragón Articulado Multicolor",
                "descripcion": "Dragón flexible con articulaciones que permiten múltiples posiciones. Perfecto para juego libre y colección. Cada pieza se ensambla con precisión.",
                "precio": 32500.00,
                "edad_minima": 4,
                "edad_maxima": 12,
                "categoria": "OVI Move",
                "imagen_url": "https://images.unsplash.com/photo-1631106254201-ffbee2305c5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHw0fHxjb2xvcmZ1bCUyMGtpZHMlMjB0b3klMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc5MjIxNTY5fDA&ixlib=rb-4.1.0&q=85",
                "stock": 15,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_002",
                "nombre": "Dinosaurio Rex Articulado",
                "descripcion": "T-Rex con mandíbula móvil y patas articuladas. Se mueve, se para y ruge en la imaginación. Ideal para crear escenas jurásicas.",
                "precio": 28900.00,
                "edad_minima": 4,
                "edad_maxima": 10,
                "categoria": "OVI Move",
                "imagen_url": "https://images.unsplash.com/photo-1774464593838-85b320eb7453?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGtpZHMlMjB0b3klMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc5MjIxNTY5fDA&ixlib=rb-4.1.0&q=85",
                "stock": 20,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_003",
                "nombre": "Kit Constructor Modular 50 Piezas",
                "descripcion": "Piezas encastrables para crear estructuras infinitas. Desarrolla motricidad fina y creatividad espacial. Compatible entre sí para expandir posibilidades.",
                "precio": 45000.00,
                "edad_minima": 5,
                "edad_maxima": 14,
                "categoria": "OVI Build",
                "imagen_url": "https://images.pexels.com/photos/6743161/pexels-photo-6743161.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "stock": 12,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_004",
                "nombre": "Torre de Encastre Rainbow",
                "descripcion": "Torre de 8 niveles con piezas de colores para apilar y encajar. Cada nivel tiene un desafío diferente. Fomenta coordinación y reconocimiento de colores.",
                "precio": 24500.00,
                "edad_minima": 4,
                "edad_maxima": 8,
                "categoria": "OVI Build",
                "imagen_url": "https://images.pexels.com/photos/6743165/pexels-photo-6743165.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "stock": 18,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_005",
                "nombre": "Set de Dados Creativos XL",
                "descripcion": "6 dados gigantes con diferentes símbolos, emociones y desafíos. Para crear historias, juegos grupales o gimnasia. ¡Tirá y jugá!",
                "precio": 19800.00,
                "edad_minima": 4,
                "edad_maxima": 12,
                "categoria": "OVI Game",
                "imagen_url": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800",
                "stock": 25,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_006",
                "nombre": "Ruleta de Desafíos Físicos",
                "descripcion": "Ruleta giratoria con 12 desafíos de movimiento. Perfecta para gimnasios, cumpleaños y espacios recreativos. ¡Hace que todos se muevan!",
                "precio": 27500.00,
                "edad_minima": 5,
                "edad_maxima": 14,
                "categoria": "OVI Game",
                "imagen_url": "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800",
                "stock": 10,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_007",
                "nombre": "Juego de Memoria Táctil",
                "descripcion": "Fichas con texturas y formas para jugar memoria sin mirar. Estimula sentidos y memoria sensorial. Reglas simples para toda la familia.",
                "precio": 21900.00,
                "edad_minima": 4,
                "edad_maxima": 10,
                "categoria": "OVI Game",
                "imagen_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
                "stock": 16,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_008",
                "nombre": "Llavero Dinosaurio Mini",
                "descripcion": "Mini dino articulado de 5cm para llevar a todos lados. Perfecto como souvenir, regalo sorpresa o compra impulsiva. Varios colores disponibles.",
                "precio": 15000.00,
                "edad_minima": 4,
                "edad_maxima": 14,
                "categoria": "OVI Mini",
                "imagen_url": "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=800",
                "stock": 45,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_009",
                "nombre": "Set Mini Figuras Marinas",
                "descripcion": "Pack de 5 figuras pequeñas: pulpo, tiburón, tortuga, delfín y estrella. Ideales para coleccionar, regalar o jugar en el agua.",
                "precio": 18500.00,
                "edad_minima": 4,
                "edad_maxima": 12,
                "categoria": "OVI Mini",
                "imagen_url": "https://images.unsplash.com/photo-1582481655274-c6ed7c7bb4ac?w=800",
                "stock": 30,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_010",
                "nombre": "Abecedario Encastrable 3D",
                "descripcion": "27 letras tridimensionales para tocar, encajar y aprender. Cada letra tiene textura única. Fomenta lectoescritura de forma lúdica.",
                "precio": 52000.00,
                "edad_minima": 4,
                "edad_maxima": 8,
                "categoria": "OVI Learn",
                "imagen_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                "stock": 8,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_011",
                "nombre": "Números y Formas Didácticas",
                "descripcion": "Set de números del 0 al 9 más 10 formas geométricas. Para clasificar, contar, apilar y reconocer. Recurso ideal para docentes y terapeutas.",
                "precio": 38000.00,
                "edad_minima": 4,
                "edad_maxima": 8,
                "categoria": "OVI Learn",
                "imagen_url": "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=800",
                "stock": 12,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_012",
                "nombre": "Serpiente Flexible Arcoíris",
                "descripcion": "Serpiente articulada de 30 segmentos. Se tuerce, se enrolla, crea formas. Movimiento fluido que invita a explorar. Relajante y creativa.",
                "precio": 29500.00,
                "edad_minima": 4,
                "edad_maxima": 14,
                "categoria": "OVI Move",
                "imagen_url": "https://images.unsplash.com/photo-1587562792368-bdf3c0bbe0c6?w=800",
                "stock": 22,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_013",
                "nombre": "Puzzle Mecánico 3D Torre",
                "descripcion": "Desafío de encastre vertical con 15 piezas que se entrelazan. Sin pegamento. Construcción pura. ¡Sentir cada click al armarse!",
                "precio": 41500.00,
                "edad_minima": 6,
                "edad_maxima": 14,
                "categoria": "OVI Build",
                "imagen_url": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800",
                "stock": 10,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_014",
                "nombre": "Robot Articulado Mini",
                "descripcion": "Robot de 7cm con brazos, piernas y cabeza móviles. Compañero de escritorio o llavero de mochila. Varios colores metálicos.",
                "precio": 16500.00,
                "edad_minima": 4,
                "edad_maxima": 14,
                "categoria": "OVI Mini",
                "imagen_url": "https://images.unsplash.com/photo-1587562792368-bdf3c0bbe0c6?w=800",
                "stock": 35,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "product_id": "prod_015",
                "nombre": "Set Clasificación por Colores",
                "descripcion": "36 piezas en 6 colores diferentes con formas para clasificar, agrupar y ordenar. Desarrolla pensamiento lógico y coordinación óculo-manual.",
                "precio": 33500.00,
                "edad_minima": 4,
                "edad_maxima": 7,
                "categoria": "OVI Learn",
                "imagen_url": "https://images.unsplash.com/photo-1587562792368-bdf3c0bbe0c6?w=800",
                "stock": 14,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for product in products:
            product['nombre_normalizado'] = normalize_text(product['nombre'])
            product['descripcion_normalizada'] = normalize_text(product['descripcion'])
        await db.products.insert_many(products)
        print(f"Se crearon {len(products)} productos")
    
    existing_admin = await db.users.find_one({"email": "admin@oviplay.com"})
    if not existing_admin:
        admin_user = {
            "user_id": "user_admin001",
            "email": "admin@oviplay.com",
            "name": "Administrador OVI Play",
            "picture": "",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("Usuario administrador creado")
    
    print("¡Seed completado exitosamente!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())