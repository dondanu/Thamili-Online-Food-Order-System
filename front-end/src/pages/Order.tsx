import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Filter } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useOrder } from '../contexts/OrderContext';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export const Order: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, removeFromCart, getCartItemQuantity } = useOrder();

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      } else {
        // Fallback to mock data if API fails
        setMenuItems([
          {
            id: 1,
            name: 'Margherita Pizza',
            description: 'Fresh tomatoes, mozzarella, basil',
            price: 12.99,
            category: 'Pizza',
            image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
            available: true
          },
          {
            id: 2,
            name: 'Chicken Burger',
            description: 'Grilled chicken, lettuce, tomato, mayo',
            price: 9.99,
            category: 'Burgers',
            image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
            available: true
          },
          {
            id: 3,
            name: 'Caesar Salad',
            description: 'Romaine lettuce, croutons, parmesan',
            price: 8.99,
            category: 'Salads',
            image: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg',
            available: true
          },
          {
            id: 4,
            name: 'Pasta Carbonara',
            description: 'Creamy pasta with bacon and parmesan',
            price: 14.99,
            category: 'Pasta',
            image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg',
            available: true
          },
          {
            id: 5,
            name: 'Fish Tacos',
            description: 'Grilled fish, cabbage slaw, lime crema',
            price: 11.99,
            category: 'Mexican',
            image: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg',
            available: true
          },
          {
            id: 6,
            name: 'Chocolate Cake',
            description: 'Rich chocolate cake with ganache',
            price: 6.99,
            category: 'Desserts',
            image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
            available: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      // Fallback to mock data
      setMenuItems([
        {
          id: 1,
          name: 'Margherita Pizza',
          description: 'Fresh tomatoes, mozzarella, basil',
          price: 12.99,
          category: 'Pizza',
          image: 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg',
          available: true
        },
        {
          id: 2,
          name: 'Chicken Burger',
          description: 'Grilled chicken, lettuce, tomato, mayo',
          price: 9.99,
          category: 'Burgers',
          image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
          available: true
        }
      ]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(['All', ...data]);
      } else {
        setCategories(['All', 'Pizza', 'Burgers', 'Salads', 'Pasta', 'Mexican', 'Desserts']);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['All', 'Pizza', 'Burgers', 'Salads', 'Pasta', 'Mexican', 'Desserts']);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMenuItems(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Order Food</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>Filter by category</span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-orange-500">${item.price}</span>
                      <div className="flex items-center space-x-2">
                        {getCartItemQuantity(item.id) > 0 ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium">{getCartItemQuantity(item.id)}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Your Cart ({cartItemsCount})</h2>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-gray-500 text-xs">${item.price} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg text-orange-500">${cartTotal.toFixed(2)}</span>
                    </div>
                    <button className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};