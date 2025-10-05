from openai import OpenAI
import httpx
from .config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Data simulada
MENU = [
    {"id": "1", "name": "Hamburguesa Clásica", "price": 14.89, "category": "burger"},
    {"id": "2", "name": "Hamburguesa BBQ", "price": 16.99, "category": "burger"},
    {"id": "3", "name": "Papas Fritas", "price": 5.79, "category": "side"},
    {"id": "4", "name": "Coca Cola", "price": 2.99, "category": "drink"},
]

CARTS = {}

# Tools expandidos
TOOLS = [
    {
        "type": "function",
        "name": "get_menu",
        "description": "Obtener el menú completo con todos los productos disponibles",
    },
    {
        "type": "function",
        "name": "add_to_cart",
        "description": "Agregar un producto al carrito del cliente",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "product_id": {"type": "string"},
                "quantity": {"type": "integer", "default": 1}
            },
            "required": ["session_id", "product_id"]
        }
    },
    {
        "type": "function",
        "name": "get_cart",
        "description": "Ver el contenido actual del carrito y el total",
        "parameters": {
            "type": "object",
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        }
    },
    {
        "type": "function",
        "name": "remove_from_cart",
        "description": "Eliminar un producto específico del carrito",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "product_id": {"type": "string"}
            },
            "required": ["session_id", "product_id"]
        }
    },
    {
        "type": "function",
        "name": "save_customer_data",
        "description": "Guardar información de contacto y entrega del cliente",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "name": {"type": "string"},
                "phone": {"type": "string"},
                "email": {"type": "string"},
                "address": {"type": "string"}
            },
            "required": ["session_id", "name", "phone", "address"]
        }
    },
    {
        "type": "function",
        "name": "show_product",
        "description": "Mostrar un producto específico en el carrusel cuando el cliente pregunta por él",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "product_id": {"type": "string"}
            },
            "required": ["session_id", "product_id"]
        }
    },
    {
        "type": "function",
        "name": "ready_for_checkout",
        "description": "Indicar que el cliente está listo para proceder al pago",
        "parameters": {
            "type": "object",
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        }
    },
]

def execute_function(name: str, args: dict):
    """Ejecutar funciones llamadas por la IA"""
    session_id = args.get("session_id")
    
    if name == "get_menu":
        return {"menu": MENU, "message": "Aquí está nuestro menú completo"}
    
    if name == "add_to_cart":
        if session_id not in CARTS:
            CARTS[session_id] = {"items": [], "customer": {}}
        
        product = next((p for p in MENU if p["id"] == args["product_id"]), None)
        if product:
            CARTS[session_id]["items"].append({
                "product": product,
                "quantity": args.get("quantity", 1)
            })
            total = sum(item["product"]["price"] * item["quantity"] for item in CARTS[session_id]["items"])
            return {
                "success": True, 
                "cart": CARTS[session_id]["items"],
                "total": total,
                "message": f"Agregado {product['name']} al carrito"
            }
        return {"error": "Producto no encontrado"}
    
    if name == "get_cart":
        cart = CARTS.get(session_id, {"items": []})
        total = sum(item["product"]["price"] * item["quantity"] for item in cart["items"])
        return {
            "items": cart["items"], 
            "total": total,
            "count": len(cart["items"])
        }
    
    if name == "remove_from_cart":
        if session_id in CARTS:
            CARTS[session_id]["items"] = [
                item for item in CARTS[session_id]["items"] 
                if item["product"]["id"] != args["product_id"]
            ]
            return {"success": True, "cart": CARTS[session_id]["items"]}
        return {"error": "Carrito no encontrado"}
    
    if name == "save_customer_data":
        if session_id not in CARTS:
            CARTS[session_id] = {"items": [], "customer": {}}
        
        CARTS[session_id]["customer"] = {
            "name": args.get("name"),
            "phone": args.get("phone"),
            "email": args.get("email"),
            "address": args.get("address")
        }
        return {
            "success": True, 
            "customer": CARTS[session_id]["customer"],
            "message": "Datos guardados correctamente"
        }
    
    if name == "ready_for_checkout":
        cart = CARTS.get(session_id, {})
        return {
            "success": True,
            "ready": True,
            "items_count": len(cart.get("items", [])),
            "has_customer_data": bool(cart.get("customer", {}).get("name")),
            "message": "Listo para proceder al pago"
        }
    if name == "show_product":
        product = next((p for p in MENU if p["id"] == args["product_id"]), None)
        if product:
            return {
                "success": True,
                "product": product,
                "message": f"Mostrando {product['name']}"
            }
        return {"error": "Producto no encontrado"}
    
    return {"error": "Función no implementada"}

def generate_ephemeral_key(session_id: str):
    """Generar clave temporal de OpenAI"""
    session_config = {
        "session": {
            "type": "realtime",
            "model": "gpt-4o-realtime-preview-2024-10-01",
            "audio": {
                "output": {"voice": "alloy"}
            },
            "instructions": f"""Eres el asistente de voz de Burger House. Sé amigable pero conciso (2-3 oraciones máximo).

FLUJO OBLIGATORIO:

1. BIENVENIDA (primera vez):
   "¡Bienvenido a Burger House! Tenemos hamburguesas, papas y bebidas. ¿Qué te gustaría ordenar hoy?"

2. AGREGAR PRODUCTO:
   "Perfecto, agregué [producto] por $[precio] a tu carrito. ¿Deseas agregar algo más?"

   IMPORTANTE: 
- Cuando pregunten POR un producto (sin agregarlo), usa show_product para mostrarlo en pantalla
- Cuando lo AGREGUEN al carrito, usa add_to_cart
   
3. CUANDO TERMINE (diga "no", "eso es todo", "ya", "listo para pagar"):
   "Genial, tu pedido está listo. Ahora voy a pedirte algunos datos de entrega."
   Acción: Llamar ready_for_checkout INMEDIATAMENTE después de esta respuesta
   
4. PEDIR DATOS (uno por uno, esperar respuesta):
   - "¿Cuál es tu nombre completo?"
   - "¿Tu número de teléfono?"
   - "¿Tu correo electrónico?"
   - "¿Dirección completa de entrega?"
   Después de recibir cada dato, guardarlo con save_customer_data
   
5. DESPUÉS DEL ÚLTIMO DATO:
   "Perfecto, todos tus datos están listos. Ahora puedes ingresar tu tarjeta en la pantalla para completar el pago."

REGLAS CRÍTICAS:
- Session ID: {session_id} - SIEMPRE inclúyelo en funciones
- Menciona precios al agregar productos
- Sé breve pero amigable
- NO repitas el pedido completo a menos que te lo pidan
- Cuando termine de pedir → ready_for_checkout → luego pide datos
- Siempre que te mencionen algo relacionado con tarjeta o pagos, redirige a la pantalla de pago ready_for_checkout
- NUNCA pidas datos de tarjeta por voz

Ejemplos de tono correcto:
✅ "¡Hola! Bienvenido a Burger House. ¿Qué te gustaría ordenar?"
✅ "Listo, agregué Hamburguesa BBQ por $16.99. ¿Algo más?"
✅ "Perfecto. ¿Cuál es tu nombre completo?"
""",
            "tools": TOOLS,
            "tool_choice": "auto",
        }
    }
    
    with httpx.Client() as http_client:
        response = http_client.post(
            "https://api.openai.com/v1/realtime/client_secrets",
            json=session_config,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    if response.status_code != 200:
        raise Exception(f"Error: {response.text}")
    
    return response.json().get("value")