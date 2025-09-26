import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  code: string;
  type: CouponType;
  amount: number; // percent (0-100) when type is 'percent', otherwise fixed currency
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  createdAt: Date;
  estimatedTime?: string;
}

interface OrderContextType {
  cart: CartItem[];
  orders: Order[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => string;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getCartItemQuantity: (itemId: string | number) => number;
  // coupons & totals
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  getCartTotals: () => { subtotal: number; discount: number; total: number };
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const { user, isLoading } = useAuth();

  // Load orders from backend
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        const formattedOrders = data.data.orders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.created_at)
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartItemQuantity = (itemId: string | number): number => {
    const normalizedId = String(itemId);
    const item = cart.find(cartItem => cartItem.id === normalizedId);
    return item ? item.quantity : 0;
  };

  const placeOrder = async (): Promise<string> => {
    try {
      const orderItems = cart.map(item => ({
        id: parseInt(item.id),
        quantity: item.quantity
      }));

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: orderItems, coupon: appliedCoupon?.code || undefined })
      });

      const data = await response.json();
      
      if (data.success) {
        clearCart();
        setAppliedCoupon(null);
        await loadOrders(); // Reload orders to get the new one
        return data.data.order.id.toString();
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  // Load orders when component mounts
  React.useEffect(() => {
    if (!isLoading && user) {
      loadOrders();
    }
  }, [user, isLoading]);

  // Coupons: simple client-side validation with common codes
  const validateCouponLocally = (code: string): Coupon | null => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;
    const catalog: Record<string, Coupon> = {
      'SAVE10': { code: 'SAVE10', type: 'percent', amount: 10 },
      'SAVE20': { code: 'SAVE20', type: 'percent', amount: 20 },
      'WELCOME5': { code: 'WELCOME5', type: 'fixed', amount: 5 },
    };
    return catalog[normalized] || null;
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      // If backend supports coupon validation, prefer it here
      // fallback to local validation
      const local = validateCouponLocally(code);
      if (local) {
        setAppliedCoupon(local);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const getCartTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
        discount = (subtotal * appliedCoupon.amount) / 100;
      } else {
        discount = appliedCoupon.amount;
      }
      // Clamp discount to subtotal
      if (discount > subtotal) discount = subtotal;
    }
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const value = {
    cart,
    orders,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    placeOrder,
    updateOrderStatus,
    loadOrders,
    getCartItemQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getCartTotals
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};