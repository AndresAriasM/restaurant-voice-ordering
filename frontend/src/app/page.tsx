'use client';

import { useEffect, useState } from 'react';
import { Mic, MicOff, ShoppingCart, MessageCircle, CreditCard } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useCartStore } from '@/store/cart';
import ProductCarousel from '@/components/ProductCarousel';
import CheckoutView from '@/components/CheckoutView';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [checkoutWasClosed, setCheckoutWasClosed] = useState(false);
  const { isConnected, isListening, transcript, connect, disconnect } = useVoice();
  const { items, getTotal, focusedProductId, showCheckout, setShowCheckout, customer } = useCartStore();

  useEffect(() => {
    axios.get(`${API_URL}/products`)
      .then(res => setProducts(res.data.products))
      .catch(err => console.error('Error loading products:', err));
  }, []);

  const showSidebar = items.length > 0 || transcript.length > 0 || isConnected;
  
  // Detectar si se cerró el checkout con datos incompletos
  const isDataComplete = customer.name && customer.phone && customer.address;
  const shouldShowCheckoutReminder = checkoutWasClosed && items.length > 0 && !showCheckout;

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    if (!isDataComplete && items.length > 0) {
      setCheckoutWasClosed(true);
    }
  };

  const handleReopenCheckout = () => {
    setShowCheckout(true);
    setCheckoutWasClosed(false);
  };

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Fondo mejorado con patrón de hamburguesas */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 -z-10">
        {/* Patrón de fondo sutil */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='60' cy='30' r='8'/%3E%3Ccircle cx='30' cy='60' r='8'/%3E%3Ccircle cx='90' cy='60' r='8'/%3E%3Ccircle cx='60' cy='90' r='8'/%3E%3Cpath d='M40 40 L50 30 L70 30 L80 40 L70 50 L50 50 Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        />
        
        {/* Formas decorativas grandes */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-orange-300/15 to-red-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-gradient-to-tl from-red-300/15 to-orange-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-yellow-300/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDuration: '8s'}} />
        
        {/* Elementos flotantes decorativos */}
        <div className="absolute top-20 right-20 text-6xl opacity-10 animate-bounce" style={{animationDuration: '3s', animationDelay: '0s'}}>🍔</div>
        <div className="absolute bottom-32 left-32 text-5xl opacity-10 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>🍟</div>
        <div className="absolute top-1/3 right-1/4 text-4xl opacity-10 animate-bounce" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}>🥤</div>
        <div className="absolute bottom-1/4 left-1/3 text-5xl opacity-10 animate-bounce" style={{animationDuration: '4.5s', animationDelay: '1.5s'}}>🍔</div>
      </div>

      {/* Modal de Checkout */}
      {showCheckout && <CheckoutView onClose={handleCloseCheckout} />}

      {/* Header Mejorado con más impacto */}
      <header className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 shadow-2xl border-b-4 border-yellow-400 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo más grande y con animación */}
            <div className="text-7xl animate-bounce drop-shadow-2xl">🍔</div>
            <div>
              <h1 className="text-6xl font-black text-white drop-shadow-lg tracking-tight">
                Burger House
              </h1>
              <p className="text-white/90 text-lg font-bold mt-1 flex items-center gap-2">
                <span className="inline-block animate-pulse">🎤</span>
                Ordena con tu voz - Rápido y delicioso
              </p>
            </div>
          </div>

          {/* Estado de conexión mejorado */}
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-full font-bold text-base border-2 border-white/30">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                En Vivo
              </div>
            )}
            {items.length > 0 && (
              <div className="bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-full font-black text-base border-2 border-white/30">
                🛒 {items.length} {items.length === 1 ? 'item' : 'items'}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Área del Carrusel */}
        <div className={`flex-1 flex items-center justify-center p-8 transition-all duration-500 ${
          showSidebar ? 'mr-0' : 'mr-0'
        }`}>
          <ProductCarousel products={products} focusedProductId={focusedProductId} />
        </div>

        {/* Sidebar Mejorado */}
        <aside className={`bg-white border-l-4 border-orange-400 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col ${
          showSidebar ? 'w-[400px]' : 'w-0 border-0'
        }`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Estado: Escuchando */}
            {isListening && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg animate-in slide-in-from-top">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold">Escuchando...</span>
                </div>
              </div>
            )}

            {/* Transcripción */}
            {transcript.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                <h3 className="text-sm font-bold mb-3 text-gray-700 flex items-center gap-2">
                  <MessageCircle size={16} />
                  Conversación
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transcript.slice(-8).map((t, i) => (
                    <div key={i} className={`p-3 rounded-xl text-sm ${
                      t.startsWith('Tú:') 
                        ? 'bg-blue-50 text-blue-900 ml-4' 
                        : 'bg-green-50 text-green-900 mr-4'
                    }`}>
                      <span className="font-semibold">{t.split(':')[0]}:</span>
                      <span className="ml-1">{t.split(':').slice(1).join(':')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carrito */}
            {items.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-300 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-orange-800">
                    <ShoppingCart size={20} />
                    Tu Pedido
                  </h3>
                  <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                    {items.length}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">
                          {item.quantity}x {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${item.product.price.toFixed(2)} c/u
                        </p>
                      </div>
                      <span className="font-black text-green-600">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t-2 border-orange-300 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-black text-gray-900">Total:</span>
                    <span className="text-2xl font-black text-green-600">
                      ${getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {isConnected ? (
                  <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-900 text-center font-medium">
                      💬 Di <strong>"Estoy listo"</strong> o <strong>"Quiero pagar"</strong> para proceder al checkout
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                    <p className="text-sm text-yellow-900 text-center font-medium">
                      🎤 Presiona el micrófono para continuar con tu pedido
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recordatorio de checkout cerrado */}
            {shouldShowCheckoutReminder && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-300 shadow-lg animate-in slide-in-from-bottom">
                <div className="flex items-start gap-3 mb-3">
                  <CreditCard size={24} className="text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-purple-900 mb-1">
                      Pantalla de pago cerrada
                    </h3>
                    <p className="text-sm text-purple-700 mb-3">
                      Cerraste la pantalla sin completar tu pedido. 
                      {!isDataComplete && " Aún faltan algunos datos."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReopenCheckout}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  Volver al Pago
                </button>
                <p className="text-xs text-purple-600 text-center mt-2">
                  💡 O dile al asistente: "volver al pago"
                </p>
              </div>
            )}

            {/* Ayuda inicial */}
            {!isConnected && items.length === 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-3">
                  👋 ¿Cómo funciona?
                </h3>
                <ol className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600">1.</span>
                    <span>Presiona el botón del micrófono 🎤</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600">2.</span>
                    <span>Di qué productos quieres ordenar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-600">3.</span>
                    <span>El asistente te guiará paso a paso</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Botón de Voz MEJORADO - Más grande y llamativo */}
      <button
        onClick={isConnected ? disconnect : connect}
        className={`fixed bottom-10 right-10 w-24 h-24 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 border-4 border-white ${
          isConnected 
            ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 animate-pulse' 
            : 'bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 hover:shadow-blue-500/50'
        }`}
        title={isConnected ? 'Desconectar micrófono' : 'Conectar micrófono'}
      >
        {isConnected ? (
          <MicOff size={40} className="text-white drop-shadow-lg" />
        ) : (
          <Mic size={40} className="text-white drop-shadow-lg" />
        )}
        
        {isConnected && (
          <>
            <div className="absolute w-28 h-28 rounded-full bg-red-400 animate-ping opacity-30"></div>
            <div className="absolute w-32 h-32 rounded-full bg-red-300 animate-ping opacity-20" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute w-36 h-36 rounded-full bg-red-200 animate-ping opacity-10" style={{animationDelay: '0.6s'}}></div>
          </>
        )}
      </button>

      {/* Tooltip del botón - Más grande */}
      {!isConnected && (
        <div className="fixed bottom-40 right-10 bg-gradient-to-r from-gray-900 to-black text-white px-6 py-3 rounded-2xl text-base font-bold shadow-2xl animate-bounce z-50 border-2 border-white/20">
          <span className="text-2xl mr-2">👆</span>
          ¡Presiona aquí para empezar!
        </div>
      )}
    </main>
  );
}