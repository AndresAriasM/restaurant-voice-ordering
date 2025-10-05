'use client';

import { useState } from 'react';
import { X, ShoppingCart, User, Phone, Mail, MapPin, CreditCard, Lock, Check } from 'lucide-react';
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

  const handleConfirmOrder = () => {
    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
      alert('⚠️ Por favor completa todos los datos de la tarjeta');
      return;
    }
    alert(`✅ ¡Pedido confirmado por $${getTotal().toFixed(2)}!\n\n📦 Entrega a: ${customer.name}\n📍 ${customer.address}\n⏱️ Tiempo estimado: 30-40 minutos`);
    onClose();
  };

  const isDataComplete = customer.name && customer.phone && customer.address;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda - Resumen del Pedido */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Tu Pedido</h3>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-300">
                      <div>
                        <span className="font-bold text-lg text-gray-900">{item.quantity}x {item.product.name}</span>
                        <p className="text-sm text-gray-600">${item.product.price} c/u</p>
                      </div>
                      <span className="font-black text-xl text-green-600">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300">
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-black text-gray-900">Total:</span>
                        <span className="text-3xl font-black text-green-600">
                        ${items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                        </span>
                    </div>
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
                    <p className="text-sm text-blue-700">Los datos se llenarán automáticamente mientras hablas. Solo necesitas ingresar la tarjeta manualmente por seguridad.</p>
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                  <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    customer.email 
                      ? 'bg-green-50 border-green-400' 
                      : customer.phone 
                        ? 'bg-yellow-50 border-yellow-400 animate-pulse' 
                        : 'bg-gray-50 border-gray-300'
                  }`}>
                    <Mail size={20} className={customer.email ? 'text-green-600' : customer.phone ? 'text-yellow-600' : 'text-gray-400'} />
                    <span className="flex-1 font-medium text-gray-900 text-sm">
                      {customer.email || (customer.phone ? '🎤 Esperando email...' : 'Esperando...')}
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
                      : customer.email 
                        ? 'bg-yellow-50 border-yellow-400 animate-pulse' 
                        : 'bg-gray-50 border-gray-300'
                  }`}>
                    <MapPin size={20} className={customer.address ? 'text-green-600' : customer.email ? 'text-yellow-600' : 'text-gray-400'} />
                    <span className="flex-1 font-medium text-gray-900 text-sm">
                      {customer.address || (customer.email ? '🎤 Esperando dirección...' : 'Esperando...')}
                    </span>
                    {customer.address && <Check size={20} className="text-green-600" />}
                  </div>
                </div>
              </div>

              {/* Datos de Pago - Solo visible cuando datos completos */}
              {isDataComplete && (
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
                      onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
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
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg"
                  >
                    <CreditCard size={24} />
                    Confirmar Pago ${items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}