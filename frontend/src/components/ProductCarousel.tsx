'use client';

import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type Props = {
  products: Product[];
  focusedProductId?: string | null;
};

const IMAGES = {
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&q=80',
  'side': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop&q=80',
  'drink': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop&q=80',
};

const CATEGORY_EMOJI = {
  'burger': '🍔',
  'side': '🍟',
  'drink': '🥤',
};

const CATEGORY_LABEL = {
  'burger': 'Hamburguesa',
  'side': 'Acompañamiento',
  'drink': 'Bebida',
};

export default function ProductCarousel({ products, focusedProductId }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sincronizar con focusedProductId
  useEffect(() => {
    if (focusedProductId) {
      const index = products.findIndex(p => p.id === focusedProductId);
      if (index !== -1) {
        console.log('🎯 Moviendo carrusel al producto:', products[index].name, 'index:', index);
        setCurrentIndex(index);
      }
    }
  }, [focusedProductId, products]);

  const next = () => setCurrentIndex((i) => (i + 1) % products.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + products.length) % products.length);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🍔</div>
          <p className="text-xl text-gray-500 font-medium">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Contenedor de productos */}
      <div className="relative h-[600px] flex items-center justify-center">
        {products.map((product, i) => {
          const offset = i - currentIndex;
          const isActive = offset === 0;
          const absOffset = Math.abs(offset);
          const isVisible = absOffset <= 2;
          
          return (
            <div
              key={product.id}
              className="absolute transition-all duration-700 ease-out"
              style={{
                transform: `translateX(${offset * 420}px) scale(${isActive ? 1 : 0.75 - absOffset * 0.08}) translateY(${!isActive ? absOffset * 20 : 0}px)`,
                opacity: !isVisible ? 0 : isActive ? 1 : 0.4,
                zIndex: isActive ? 30 : 20 - absOffset,
                pointerEvents: isActive ? 'auto' : 'none',
                filter: isActive ? 'none' : 'blur(3px) grayscale(0.3)',
              }}
            >
              <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden w-[400px] transition-all duration-300 ${
                isActive ? 'ring-4 ring-orange-400 shadow-orange-200/50' : ''
              }`}>
                {/* Imagen del producto */}
                <div className="relative h-[320px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={IMAGES[product.category as keyof typeof IMAGES] || IMAGES.burger}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  
                  {/* Badge de precio */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-full font-black text-2xl shadow-lg">
                    ${product.price.toFixed(2)}
                  </div>

                  {/* Badge de categoría */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-sm text-gray-800 shadow-lg flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_EMOJI[product.category as keyof typeof CATEGORY_EMOJI]}</span>
                    <span>{CATEGORY_LABEL[product.category as keyof typeof CATEGORY_LABEL]}</span>
                  </div>
                  
                  {/* Indicador de seleccionado */}
                  {isActive && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-in zoom-in">
                      <Star size={16} fill="white" />
                      Producto Actual
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="p-6 bg-gradient-to-br from-white to-gray-50">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#FFA500" className="text-orange-500" />
                        ))}
                      </div>
                      <span className="text-sm font-medium">(4.8)</span>
                    </div>
                    {isActive && (
                      <span className="text-sm text-green-600 font-bold">
                        ✓ Disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles */}
      <button
        onClick={prev}
        disabled={products.length <= 1}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-orange-200"
      >
        <ChevronLeft size={28} className="text-orange-600" />
      </button>
      <button
        onClick={next}
        disabled={products.length <= 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-orange-200"
      >
        <ChevronRight size={28} className="text-orange-600" />
      </button>

      {/* Indicadores mejorados */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-xl border-2 border-orange-200">
        {products.map((product, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === currentIndex 
                ? 'w-8 bg-orange-500' 
                : 'w-2.5 bg-gray-300 hover:bg-gray-400'
            }`}
            title={product.name}
          />
        ))}
      </div>
    </div>
  );
}