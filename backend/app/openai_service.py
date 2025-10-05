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
        "description": "Agregar un producto al carrito del cliente. Llama esta función una vez por cada producto que el cliente mencione.",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"},
                "product_id": {"type": "string", "description": "ID del producto: 1=Clásica, 2=BBQ, 3=Papas, 4=Coca"},
                "quantity": {"type": "integer", "default": 1, "description": "Cantidad del producto"}
            },
            "required": ["session_id", "product_id"]
        }
    },
    {
        "type": "function",
        "name": "get_cart",
        "description": "Ver el contenido actual del carrito y el total. Úsala antes de proceder al pago para verificar que hay productos.",
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
            "required": ["session_id"]
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
        "description": "Indicar que el cliente está listo para proceder al pago. Solo llama esta función DESPUÉS de verificar con get_cart que hay productos.",
        "parameters": {
            "type": "object",
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        }
    },
    {
        "type": "function",
        "name": "reopen_checkout",
        "description": "Volver a abrir la pantalla de pago si el cliente la cerró accidentalmente o necesita volver a ella",
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
        if not product:
            return {
                "error": f"Producto no encontrado: {args.get('product_id')}",
                "success": False,
                "available_products": [{"id": p["id"], "name": p["name"]} for p in MENU]
            }
        
        quantity = args.get("quantity", 1)
        
        # Verificar si el producto ya está en el carrito
        existing_item = next(
            (item for item in CARTS[session_id]["items"] if item["product"]["id"] == product["id"]), 
            None
        )
        
        if existing_item:
            # Si ya existe, aumentar cantidad
            existing_item["quantity"] += quantity
        else:
            # Si no existe, agregarlo
            CARTS[session_id]["items"].append({
                "product": product,
                "quantity": quantity
            })
        
        total = sum(item["product"]["price"] * item["quantity"] for item in CARTS[session_id]["items"])
        
        return {
            "success": True, 
            "product_added": product["name"],
            "quantity": quantity,
            "price": product["price"],
            "items": CARTS[session_id]["items"],
            "total": total,
            "cart_count": len(CARTS[session_id]["items"]),
            "message": f"Agregado {quantity}x {product['name']} por ${product['price'] * quantity:.2f}"
        }
    
    if name == "get_cart":
        cart = CARTS.get(session_id, {"items": [], "customer": {}})
        total = sum(item["product"]["price"] * item["quantity"] for item in cart["items"])
        
        return {
            "items": cart["items"], 
            "total": total,
            "count": len(cart["items"]),
            "is_empty": len(cart["items"]) == 0,
            "message": f"El carrito tiene {len(cart['items'])} productos por un total de ${total:.2f}" if cart["items"] else "El carrito está vacío"
        }
    
    if name == "remove_from_cart":
        if session_id in CARTS:
            initial_count = len(CARTS[session_id]["items"])
            CARTS[session_id]["items"] = [
                item for item in CARTS[session_id]["items"] 
                if item["product"]["id"] != args["product_id"]
            ]
            removed = initial_count > len(CARTS[session_id]["items"])
            
            return {
                "success": removed,
                "items": CARTS[session_id]["items"],
                "message": "Producto eliminado" if removed else "Producto no encontrado en el carrito"
            }
        return {"success": False, "error": "Carrito no encontrado"}
    
    if name == "save_customer_data":
        if session_id not in CARTS:
            CARTS[session_id] = {"items": [], "customer": {}}
        
        # Actualizar solo los campos que se proporcionaron
        customer_data = CARTS[session_id]["customer"]
        
        if args.get("name"):
            customer_data["name"] = args["name"]
        if args.get("phone"):
            customer_data["phone"] = args["phone"]
        if args.get("email"):
            customer_data["email"] = args.get("email", "")
        if args.get("address"):
            customer_data["address"] = args["address"]
        
        CARTS[session_id]["customer"] = customer_data
        
        # Verificar qué datos faltan
        missing = []
        if not customer_data.get("name"):
            missing.append("nombre")
        if not customer_data.get("phone"):
            missing.append("teléfono")
        if not customer_data.get("address"):
            missing.append("dirección")
        
        return {
            "success": True, 
            "customer": customer_data,
            "is_complete": len(missing) == 0,
            "missing_fields": missing,
            "message": "Datos guardados correctamente" if len(missing) == 0 else f"Faltan: {', '.join(missing)}"
        }
    
    if name == "ready_for_checkout":
        cart = CARTS.get(session_id, {"items": [], "customer": {}})
        
        if len(cart["items"]) == 0:
            return {
                "success": False,
                "ready": False,
                "open_checkout": False,
                "error": "El carrito está vacío",
                "message": "No puedes proceder al pago con el carrito vacío. Agrega productos primero."
            }
        
        total = sum(item["product"]["price"] * item["quantity"] for item in cart["items"])
        
        return {
            "success": True,
            "ready": True,
            "open_checkout": True,  # Flag explícito para abrir el modal
            "items_count": len(cart["items"]),
            "total": total,
            "has_customer_data": bool(cart.get("customer", {}).get("name")),
            "message": f"Abriendo pantalla de pago. Total: ${total:.2f}"
        }
    
    if name == "show_product":
        product = next((p for p in MENU if p["id"] == args["product_id"]), None)
        if product:
            return {
                "success": True,
                "product": product,
                "message": f"Mostrando {product['name']}"
            }
        return {"success": False, "error": "Producto no encontrado"}
    
    if name == "reopen_checkout":
        cart = CARTS.get(session_id, {"items": [], "customer": {}})
        
        if len(cart["items"]) == 0:
            return {
                "success": False,
                "open_checkout": False,
                "error": "El carrito está vacío",
                "message": "No hay nada en el carrito para proceder al pago."
            }
        
        total = sum(item["product"]["price"] * item["quantity"] for item in cart["items"])
        
        return {
            "success": True,
            "open_checkout": True,
            "items_count": len(cart["items"]),
            "total": total,
            "message": f"Reabriendo pantalla de pago. Total: ${total:.2f}"
        }
    
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

PRODUCTOS DISPONIBLES:
1. Hamburguesa Clásica - $14.89 (ID: "1")
2. Hamburguesa BBQ - $16.99 (ID: "2")
3. Papas Fritas - $5.79 (ID: "3")
4. Coca Cola - $2.99 (ID: "4")

FLUJO OBLIGATORIO:

1. BIENVENIDA (primera vez):
   "¡Bienvenido a Burger House! Tenemos hamburguesas, papas y bebidas. ¿Qué te gustaría ordenar hoy?"

2. CUANDO PREGUNTAN POR UN PRODUCTO (sin agregarlo):
   Ejemplo: "¿Tienes hamburguesa BBQ?" o "¿Qué es la hamburguesa clásica?"
   - Llama show_product con el product_id correspondiente
   - Responde: "Claro, aquí está la Hamburguesa BBQ por $16.99. ¿Te gustaría agregarla a tu pedido?"

3. AGREGAR PRODUCTOS AL CARRITO:
   
   CASO A - Un solo producto:
   Usuario: "Quiero una hamburguesa BBQ"
   - Llama add_to_cart con session_id, product_id="2", quantity=1
   - Responde: "Perfecto, agregué Hamburguesa BBQ por $16.99. ¿Algo más?"
   
   CASO B - Múltiples productos en una frase:
   Usuario: "Dame una clásica y unas papas"
   - PRIMERO llama add_to_cart con product_id="1" (Hamburguesa Clásica)
   - LUEGO llama add_to_cart con product_id="3" (Papas Fritas)
   - Responde: "Listo! Agregué Hamburguesa Clásica por $14.89 y Papas Fritas por $5.79. Tu total es $20.68. ¿Deseas algo más?"
   
   CASO C - Con cantidades específicas:
   Usuario: "Quiero 2 hamburguesas BBQ"
   - Llama add_to_cart con product_id="2", quantity=2
   - Responde: "Perfecto, agregué 2 Hamburguesas BBQ por $33.98 total. ¿Algo más?"
   
   IMPORTANTE: Cuando te piden varios productos, haz MÚLTIPLES llamadas a add_to_cart (una por cada producto). NO intentes agregar todo de una vez.

4. CUANDO TERMINE Y PIDA IR AL PAGO:
   Ejemplos: "procede al pago", "eso es todo", "ya", "listo para pagar", "quiero pagar"
   
   PASOS EN ORDEN:
   a) PRIMERO verifica que haya productos en el carrito llamando get_cart
   b) Si el carrito está vacío, di: "Tu carrito está vacío. ¿Qué te gustaría ordenar?"
   c) Si hay productos:
      - Di: "Perfecto, tu pedido está listo por $[total]. Un momento mientras abro la pantalla de pago."
      - Llama ready_for_checkout INMEDIATAMENTE
      - La pantalla se abrirá automáticamente
      - Luego di: "Ya puedes ver la pantalla de pago. Vamos a completar tus datos de entrega."
   d) Empieza a pedir datos uno por uno

5. SI EL CLIENTE CERRÓ LA PANTALLA DE PAGO:
   Ejemplos: "se cerró la pantalla", "volver al pago", "abrir pantalla de pago", "ver mi pedido"
   
   PASOS:
   a) Di: "Claro, voy a abrir la pantalla de pago nuevamente."
   b) Llama reopen_checkout
   c) Si tiene datos incompletos, continúa pidiendo los que faltan
   d) Si tiene todos los datos, di: "Ya está abierta. Solo ingresa los datos de tu tarjeta para completar el pago."
   
5. PEDIR DATOS (uno por uno, esperar respuesta), si el cliente necesita modificar algun dato, permite hacerlo: pero garantiza los cambios en pantalla llamando a las funciones
   - "¿Cuál es tu nombre completo?" → Espera respuesta → save_customer_data con name
   - "¿Tu número de teléfono?" → Espera respuesta → save_customer_data con phone
   - "¿Tu correo electrónico?" → Espera respuesta → save_customer_data con email (opcional)
   - "¿Dirección completa de entrega?" → Espera respuesta → save_customer_data con address
   
6. DESPUÉS DEL ÚLTIMO DATO:
   "Perfecto, todos tus datos están listos. Ahora puedes ingresar tu tarjeta en la pantalla para completar el pago."

MANEJO DE ERRORES:
- Si no entiendes qué producto quieren, pregunta: "¿Te refieres a la Hamburguesa Clásica o la BBQ?"
- Si el carrito está vacío al pedir pagar, di: "Tu carrito está vacío. ¿Qué te gustaría ordenar?"
- Si falla una función, pide disculpas y pregunta: "Lo siento, hubo un error. ¿Podrías repetir tu pedido?"

REGLAS CRÍTICAS:
- Session ID: {session_id} - SIEMPRE inclúyelo en TODAS las funciones
- MAPEO DE IDs: "hamburguesa clásica"/"clásica" = "1", "hamburguesa bbq"/"bbq" = "2", "papas" = "3", "coca"/"coca cola" = "4"
- Para múltiples productos: HAZ MÚLTIPLES llamadas a add_to_cart
- SIEMPRE verifica el carrito con get_cart ANTES de llamar ready_for_checkout
- Menciona precios al agregar productos
- Sé breve pero amigable
- NO repitas el pedido completo a menos que te lo pidan
- NUNCA pidas datos de tarjeta por voz
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