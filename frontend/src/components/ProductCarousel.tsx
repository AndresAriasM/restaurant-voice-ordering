'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=500&fit=crop',
  'side': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=500&fit=crop',
  'drink': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=500&fit=crop',
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

  if (products.length === 0) return null;

  return (
    <div className="relative w-full h-[650px] flex items-center justify-center">
      {/* Contenedor de productos */}
      <div className="relative w-full max-w-6xl h-full flex items-center justify-center overflow-visible">
        {products.map((product, i) => {
          const offset = i - currentIndex;
          const isActive = offset === 0;
          
          // Calcular posición para mostrar productos a ambos lados
          const absOffset = Math.abs(offset);
          const isVisible = absOffset <= 2;
          
          return (
            <div
              key={product.id}
              className="absolute transition-all duration-700 ease-out"
              style={{
                transform: `translateX(${offset * 500}px) scale(${isActive ? 1 : 0.7 - absOffset * 0.1})`,
                opacity: !isVisible ? 0 : isActive ? 1 : 0.3,
                zIndex: isActive ? 30 : 20 - absOffset,
                pointerEvents: isActive ? 'auto' : 'none',
                filter: isActive ? 'none' : 'blur(2px)',
              }}
            >
              <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden w-[450px] transition-all duration-300 ${
                isActive ? 'ring-4 ring-blue-500 shadow-blue-200' : ''
              }`}>
                <div className="relative h-[380px] bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={IMAGES[product.category as keyof typeof IMAGES] || IMAGES.burger}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-bold text-2xl shadow-lg">
                    ${product.price}
                  </div>
                  {isActive && (
                    <div className="absolute bottom-6 left-6 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                      ✨ Seleccionado
                    </div>
                  )}
                </div>
                <div className="p-8 bg-gradient-to-br from-white to-gray-50">
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 capitalize text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {product.category}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles */}
      <button
        onClick={prev}
        className="absolute left-8 z-40 bg-white/95 hover:bg-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <ChevronLeft size={36} className="text-gray-800" />
      </button>
      <button
        onClick={next}
        className="absolute right-8 z-40 bg-white/95 hover:bg-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <ChevronRight size={36} className="text-gray-800" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-8 flex gap-3 bg-white/90 px-6 py-3 rounded-full shadow-lg">
        {products.map((product, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-3 rounded-full transition-all ${
              i === currentIndex ? 'w-12 bg-blue-500' : 'w-3 bg-gray-300 hover:bg-gray-400'
            }`}
            title={product.name}
          />
        ))}
      </div>

      {/* Nombre del producto actual - grande abajo */}
      <div className="absolute bottom-24 bg-white/95 px-8 py-4 rounded-2xl shadow-xl">
        <p className="text-2xl font-bold text-gray-900">{products[currentIndex].name}</p>
      </div>
    </div>
  );
}