import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useOrder } from '../contexts/OrderContext';
import { ShoppingCart, Clock, History, Star, TrendingUp, Users } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { cart, orders } = useOrder();

  const pendingOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing'
  ).length;

  const dashboardCards = [
    {
      title: 'Order Food',
      description: 'Browse menu and place orders',
      icon: ShoppingCart,
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      link: '/order',
      badge: cart.length > 0 ? cart.reduce((sum, item) => sum + item.quantity, 0) : null
    },
    {
      title: 'Track Orders',
      description: 'Monitor your current orders',
      icon: Clock,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      link: '/track',
      badge: pendingOrders > 0 ? pendingOrders : null
    },
    {
      title: 'Order History',
      description: 'View all past orders',
      icon: History,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      link: '/history',
      badge: orders.length > 0 ? orders.length : null
    }
  ];

  const stats = [
    {
      label: 'Total Orders',
      value: orders.length.toString(),
      icon: TrendingUp,
      color: 'text-orange-600'
    },
    {
      label: 'Active Orders',
      value: pendingOrders.toString(),
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      label: 'Items in Cart',
      value: cart.reduce((sum, item) => sum + item.quantity, 0).toString(),
      icon: ShoppingCart,
      color: 'text-green-600'
    }
  ];

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Welcome to FoodDelight!</h3>
              <p className="text-orange-100">Discover delicious meals and track your orders seamlessly</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 p-4 rounded-full">
                <Users size={48} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color}`}>
                  <stat.icon size={32} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 group"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} ${card.hoverColor} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <card.icon className="h-8 w-8 text-white" />
                  </div>
                  {card.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {card.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors duration-200">
                  {card.title}
                </h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} items • ${order.total.toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};