'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Phone, Mail, MapPin, CreditCard, Lock, Check, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart';

type Props = {
  onClose: () => void;
};

export default function CheckoutView({ onClose }: Props) {
  const { items, getTotal, customer } = useCartStore();
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  const total = getTotal();
  const isDataComplete = customer.name && customer.phone && customer.address;
  const isCardComplete = cardData.number.length === 16 && cardData.name && cardData.expiry && cardData.cvv.length === 3;

  // Validación: cerrar si no hay items
  useEffect(() => {
    if (items.length === 0) {
      alert('⚠️ Tu carrito está vacío. Agrega productos primero.');
      onClose();
    }
  }, [items.length, onClose]);

  // Validación: mostrar advertencia si total es 0
  useEffect(() => {
    if (total === 0 && items.length > 0) {
      console.error('❌ Error: El carrito tiene items pero el total es $0');
    }
  }, [total, items.length]);

  const handleClose = () => {
    // Si hay datos incompletos, advertir al usuario
    if (items.length > 0 && !isDataComplete) {
      const confirmClose = window.confirm(
        '⚠️ Aún no has completado todos los datos de entrega.\n\n' +
        '💡 Puedes decirle al asistente "volver al pago" o "abrir pantalla de pago" para continuar.\n\n' +
        '¿Seguro que deseas cerrar?'
      );
      if (!confirmClose) return;
    }
    
    onClose();
  };

  const handleConfirmOrder = () => {
    // Validaciones
    if (items.length === 0) {
      alert('⚠️ Tu carrito está vacío');
      return;
    }

    if (total === 0) {
      alert('⚠️ Error calculando el total. Por favor intenta nuevamente.');
      return;
    }

    if (!isDataComplete) {
      alert('⚠️ Por favor completa todos los datos de entrega hablando con el asistente');
      return;
    }

    if (!isCardComplete) {
      alert('⚠️ Por favor completa todos los datos de la tarjeta');
      return;
    }

    // Validar formato de tarjeta
    if (!/^\d{16}$/.test(cardData.number)) {
      alert('⚠️ Número de tarjeta inválido (debe tener 16 dígitos)');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      alert('⚠️ Fecha de expiración inválida (formato: MM/AA)');
      return;
    }

    if (!/^\d{3}$/.test(cardData.cvv)) {
      alert('⚠️ CVV inválido (debe tener 3 dígitos)');
      return;
    }

    // Confirmar pedido
    alert(`✅ ¡Pedido confirmado por $${total.toFixed(2)}!

📦 Entrega a: ${customer.name}
📍 ${customer.address}
📞 ${customer.phone}
⏱️ Tiempo estimado: 30-40 minutos

¡Gracias por tu compra! 🍔`);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShoppingCart size={32} className="text-white" />
            <div>
              <h2 className="text-3xl font-black text-white">Finalizar Pedido</h2>
              <p className="text-white/90 text-sm">Revisa y confirma tu orden</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Validación de carrito vacío */}
          {items.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={64} className="text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Carrito vacío</h3>
              <p className="text-gray-600 mb-6">Agrega productos antes de proceder al pago</p>
              <button
                onClick={onClose}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold"
              >
                Volver
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna Izquierda - Resumen del Pedido */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Tu Pedido</h3>
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-300">
                        <div>
                          <span className="font-bold text-lg text-gray-900">
                            {item.quantity}x {item.product.name}
                          </span>
                          <p className="text-sm text-gray-600">${item.product.price.toFixed(2)} c/u</p>
                        </div>
                        <span className="font-black text-xl text-green-600">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total con validación visual */}
                  <div className={`mt-6 p-6 rounded-2xl border-2 ${
                    total > 0 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                      : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-gray-900">Total:</span>
                      <span className={`text-3xl font-black ${
                        total > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    {total === 0 && (
                      <p className="text-sm text-red-600 mt-2 font-medium">
                        ⚠️ Error calculando el total
                      </p>
                    )}
                  </div>
                </div>

                {/* Instrucciones */}
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white p-2 rounded-full">
                      🎤
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Habla con el asistente</h4>
                      <p className="text-sm text-blue-700">
                        Los datos se llenarán automáticamente mientras hablas. Solo necesitas ingresar la tarjeta manualmente por seguridad.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha - Datos del Cliente */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📍 Datos de Entrega</h3>
                  
                  {/* Campo: Nombre */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      customer.name 
                        ? 'bg-green-50 border-green-400' 
                        : 'bg-yellow-50 border-yellow-400 animate-pulse'
                    }`}>
                      <User size={20} className={customer.name ? 'text-green-600' : 'text-yellow-600'} />
                      <span className="flex-1 font-medium text-gray-900">
                        {customer.name || '🎤 Dile tu nombre al asistente...'}
                      </span>
                      {customer.name && <Check size={20} className="text-green-600" />}
                    </div>
                  </div>

                  {/* Campo: Teléfono */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      customer.phone 
                        ? 'bg-green-50 border-green-400' 
                        : customer.name 
                          ? 'bg-yellow-50 border-yellow-400 animate-pulse' 
                          : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Phone size={20} className={customer.phone ? 'text-green-600' : customer.name ? 'text-yellow-600' : 'text-gray-400'} />
                      <span className="flex-1 font-medium text-gray-900">
                        {customer.phone || (customer.name ? '🎤 Esperando teléfono...' : 'Esperando...')}
                      </span>
                      {customer.phone && <Check size={20} className="text-green-600" />}
                    </div>
                  </div>

                  {/* Campo: Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email (Opcional)</label>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      customer.email 
                        ? 'bg-green-50 border-green-400' 
                        : customer.phone 
                          ? 'bg-yellow-50 border-yellow-400' 
                          : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Mail size={20} className={customer.email ? 'text-green-600' : customer.phone ? 'text-yellow-600' : 'text-gray-400'} />
                      <span className="flex-1 font-medium text-gray-900 text-sm">
                        {customer.email || (customer.phone ? '🎤 Email (opcional)...' : 'Esperando...')}
                      </span>
                      {customer.email && <Check size={20} className="text-green-600" />}
                    </div>
                  </div>

                  {/* Campo: Dirección */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dirección de Entrega</label>
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      customer.address 
                        ? 'bg-green-50 border-green-400' 
                        : customer.phone 
                          ? 'bg-yellow-50 border-yellow-400 animate-pulse' 
                          : 'bg-gray-50 border-gray-300'
                    }`}>
                      <MapPin size={20} className={customer.address ? 'text-green-600' : customer.phone ? 'text-yellow-600' : 'text-gray-400'} />
                      <span className="flex-1 font-medium text-gray-900 text-sm">
                        {customer.address || (customer.phone ? '🎤 Esperando dirección...' : 'Esperando...')}
                      </span>
                      {customer.address && <Check size={20} className="text-green-600" />}
                    </div>
                  </div>
                </div>

                {/* Datos de Pago - Solo visible cuando datos completos */}
                {isDataComplete ? (
                  <div className="space-y-4 animate-in slide-in-from-bottom">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl border-2 border-purple-300">
                      <Lock size={20} className="text-purple-600" />
                      <div>
                        <h3 className="text-lg font-bold text-purple-900">💳 Pago Seguro</h3>
                        <p className="text-xs text-purple-700">Ingresa tu tarjeta manualmente</p>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Número de tarjeta (16 dígitos)"
                      value={cardData.number}
                      onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})}
                      maxLength={16}
                      className="w-full p-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none font-medium transition"
                    />
                    
                    <input
                      type="text"
                      placeholder="Nombre en la tarjeta"
                      value={cardData.name}
                      onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                      className="w-full p-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none font-medium transition"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={cardData.expiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                          }
                          setCardData({...cardData, expiry: value});
                        }}
                        maxLength={5}
                        className="p-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none font-medium transition"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                        maxLength={3}
                        className="p-4 rounded-xl border-2 border-gray-300 focus:border-blue-500 outline-none font-medium transition"
                      />
                    </div>

                    <button
                      onClick={handleConfirmOrder}
                      disabled={!isCardComplete || total === 0}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg"
                    >
                      <CreditCard size={24} />
                      Confirmar Pago ${total.toFixed(2)}
                    </button>

                    {!isCardComplete && (
                      <p className="text-sm text-orange-600 text-center font-medium">
                        ⚠️ Completa todos los datos de la tarjeta
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-300 text-center">
                    <p className="text-yellow-900 font-medium">
                      🎤 Completa tus datos hablando con el asistente para continuar
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}