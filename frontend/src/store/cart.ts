import { create } from 'zustand';

type CartItem = {
  product: { id: string; name: string; price: number };
  quantity: number;
};

type CustomerData = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type CartStore = {
  sessionId: string;
  items: CartItem[];
  focusedProductId: string | null;
  customer: CustomerData;
  showCheckout: boolean;
  setSessionId: (id: string) => void;
  setItems: (items: CartItem[]) => void;
  setFocusedProduct: (id: string | null) => void;
  setCustomer: (data: Partial<CustomerData>) => void;
  setShowCheckout: (show: boolean) => void;
  getTotal: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  sessionId: '',
  items: [],
  focusedProductId: null,
  customer: { name: '', phone: '', email: '', address: '' },
  showCheckout: false,
  setSessionId: (id) => set({ sessionId: id }),
  setItems: (items) => set({ items }),
  setFocusedProduct: (id) => set({ focusedProductId: id }),
  setCustomer: (data) => set(state => ({ customer: { ...state.customer, ...data } })),
  setShowCheckout: (show) => set({ showCheckout: show }),
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },
}));