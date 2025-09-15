import React from 'react';
import { Layout } from '../components/Layout';
import { useOrder } from '../contexts/OrderContext';
import { Clock, CheckCircle, Package, Truck, MapPin } from 'lucide-react';

export const Track: React.FC = () => {
  const { orders, placeOrder, cart } = useOrder();

  const activeOrders = orders.filter(order => 
    order.status === 'pending' || 
    order.status === 'confirmed' || 
    order.status === 'preparing' || 
    order.status === 'ready'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'ready':
        return <Truck className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusMessage = (status: string, estimatedTime?: string) => {
    switch (status) {
      case 'pending':
        return 'Order placed, waiting for confirmation';
      case 'confirmed':
        return `Order confirmed! Estimated time: ${estimatedTime || '20-25 minutes'}`;
      case 'preparing':
        return 'Your delicious food is being prepared';
      case 'ready':
        return 'Order ready for pickup or delivery!';
      default:
        return 'Processing your order';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending':
        return 25;
      case 'confirmed':
        return 50;
      case 'preparing':
        return 75;
      case 'ready':
        return 100;
      default:
        return 0;
    }
  };

  const handleQuickOrder = () => {
    if (cart.length > 0) {
      placeOrder()
        .then((orderId) => {
          alert(`Order placed successfully! Order ID: ${orderId}`);
        })
        .catch((error) => {
          alert(`Failed to place order: ${error.message}`);
        });
    } else {
      alert('Your cart is empty. Add some items first!');
    }
  };

  return (
    <Layout title="Track Orders">
      <div className="space-y-6">
        {/* Quick Actions */}
        {cart.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800">Items in Cart</h3>
                <p className="text-orange-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items ready to order
                </p>
              </div>
              <button
                onClick={handleQuickOrder}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
              >
                Place Order
              </button>
            </div>
          </div>
        )}

        {activeOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-600 mb-6">You don't have any orders being prepared right now.</p>
            <a
              href="/order"
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
            >
              <Package className="h-5 w-5 mr-2" />
              Order Now
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                {/* Order Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      Placed on {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{order.items.length} items</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Order Progress</span>
                    <span className="text-sm text-gray-600">{getProgressPercentage(order.status)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        order.status === 'ready' ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${getProgressPercentage(order.status)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{order.status}</p>
                    <p className="text-sm text-gray-600">{getStatusMessage(order.status, order.estimatedTime)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-orange-600 font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimated Time */}
                {order.estimatedTime && order.status !== 'ready' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center text-blue-700">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Estimated delivery: {order.estimatedTime}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};