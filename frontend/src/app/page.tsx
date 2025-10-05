'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, ShoppingCart } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useCartStore } from '@/store/cart';
import ProductCarousel from '@/components/ProductCarousel';
import CheckoutView from '@/components/CheckoutView';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function Home() {
  const [products, setProducts] = useState([]);
  const { isConnected, isListening, transcript, connect, disconnect } = useVoice();
  const { items, getTotal, focusedProductId, showCheckout, setShowCheckout } = useCartStore();

  useEffect(() => {
    axios.get(`${API_URL}/products`)
      .then(res => setProducts(res.data.products))
      .catch(err => console.error('Error loading products:', err));
  }, []);
  
  useEffect(() => {
    console.log('🔔 Estado showCheckout cambió a:', showCheckout);
  }, [showCheckout]);

  const showCart = items.length > 0;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Modal de Checkout */}
      {showCheckout && <CheckoutView onClose={() => setShowCheckout(false)} />}

      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-yellow-500">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='30'%3E🍔%3C/text%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px'
        }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/95 backdrop-blur-md shadow-xl border-b-4 border-yellow-400 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="text-6xl animate-bounce">🍔</div>
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              Burger House
            </h1>
            <p className="text-gray-600 text-lg font-medium mt-1">
              ✨ Ordena con tu voz - Rápido y delicioso
            </p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col h-[calc(100vh-120px)]">
        <div className="flex-1 flex">
          {/* Carrusel */}
          <div className={`flex-1 flex items-center justify-center transition-all ${showCart ? '' : 'pr-0'}`}>
            <ProductCarousel products={products} focusedProductId={focusedProductId} />
          </div>

          {/* Sidebar */}
          <div className={`bg-white/95 backdrop-blur-md border-l-4 border-yellow-400 p-6 space-y-6 overflow-y-auto transition-all duration-500 shadow-2xl ${
            showCart || transcript.length > 0 ? 'w-[420px]' : 'w-0 p-0 border-0'
          }`}>
            {/* Escuchando */}
            {isListening && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-4 h-4 bg-white rounded-full animate-ping absolute"></div>
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold text-lg">Escuchando...</span>
                </div>
              </div>
            )}

            {/* Transcripción */}
            {transcript.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 shadow-lg border-2 border-gray-200">
                <h2 className="text-lg font-bold mb-3 text-gray-800">💬 Conversación</h2>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {transcript.slice(-5).map((t, i) => (
                    <div key={i} className={`p-2 rounded-xl text-xs font-medium ${
                      t.startsWith('Tú:') ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'
                    }`}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carrito */}
            {showCart && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 shadow-lg border-2 border-yellow-300">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-700">
                  <ShoppingCart size={22} />
                  Tu Pedido ({items.length})
                </h2>
                
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl shadow">
                      <span className="font-bold text-sm">{item.quantity}x {item.product.name}</span>
                      <span className="font-bold text-green-600">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-3 border-t-2 border-yellow-300 font-black flex justify-between text-xl text-orange-700">
                  <span>Total:</span>
                  <span className="text-green-600">${getTotal().toFixed(2)}</span>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
                  <p className="text-sm text-blue-800 text-center">
                    💬 <strong>Dile al asistente</strong> que estás listo para proceder con el pago
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón flotante */}
      <button
        onClick={isConnected ? disconnect : connect}
        className={`fixed bottom-8 right-8 w-20 h-20 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 ${
          isConnected ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}
      >
        {isConnected ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
        {isConnected && (
          <>
            <div className="absolute w-24 h-24 rounded-full bg-red-400 animate-ping opacity-20"></div>
            <div className="absolute w-28 h-28 rounded-full bg-red-300 animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
          </>
        )}
      </button>
    </main>
  );
}