from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

from .config import settings
from .openai_service import MENU, CARTS, generate_ephemeral_key, execute_function

app = FastAPI(title="Restaurant Voice Ordering API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EphemeralKeyRequest(BaseModel):
    session_id: str = None

class FunctionCallRequest(BaseModel):
    name: str
    arguments: dict

@app.get("/")
def root():
    return {"message": "Restaurant Voice Ordering API"}

@app.get("/api/v1/products")
def get_products():
    return {"products": MENU}

@app.get("/api/v1/cart/{session_id}")
def get_cart(session_id: str):
    cart = CARTS.get(session_id, {"items": [], "customer": {}})
    total = sum(item["product"]["price"] * item["quantity"] for item in cart["items"])
    return {
        "items": cart["items"], 
        "total": total,
        "customer": cart.get("customer", {})
    }

@app.post("/api/v1/openai/ephemeral-key")
def create_ephemeral_key(request: EphemeralKeyRequest):
    session_id = request.session_id or str(uuid.uuid4())
    key = generate_ephemeral_key(session_id)
    return {"session_id": session_id, "ephemeral_key": key}

@app.post("/api/v1/openai/function-call")
def handle_function_call(request: FunctionCallRequest):
    result = execute_function(request.name, request.arguments)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)