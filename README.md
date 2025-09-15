# Food Order System

A complete food ordering system built with React.js frontend and Node.js backend with MySQL database.

## Features

### Frontend (React.js)
- **Authentication**: User registration and login with JWT tokens
- **Dashboard**: Overview of orders, cart, and quick actions
- **Menu Browsing**: Browse food items by category with search and filters
- **Cart Management**: Add, remove, and update quantities
- **Order Tracking**: Real-time order status updates
- **Order History**: Complete history of all past orders
- **Responsive Design**: Works on all devices

### Backend (Node.js + MySQL)
- **RESTful API**: Clean API endpoints for all operations
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: MySQL with proper relationships and constraints
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Order Management**: Complete order lifecycle management
- **Menu Management**: Dynamic menu items with categories

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Context API for state management

### Backend
- Node.js with Express
- MySQL database
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation
- helmet for security headers
- cors for cross-origin requests

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Database Setup
1. Install MySQL and create a database:
```sql
CREATE DATABASE food_order_system;
```

2. Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=food_order_system
DB_PORT=3306
```

### Installation
1. Install dependencies:
```bash
npm install
```

2. Start the backend server:
```bash
npm run server
```

3. In a new terminal, start the frontend:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Database Tables
The system automatically creates the following tables:
- `users` - User accounts and authentication
- `menu_items` - Food items with categories and pricing
- `orders` - Order information and status
- `order_items` - Individual items within each order

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get all categories
- `GET /api/menu/:id` - Get single menu item

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=food_order_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## Usage

1. **Registration/Login**: Create an account or login with existing credentials
2. **Browse Menu**: View food items organized by categories
3. **Add to Cart**: Select items and quantities
4. **Place Order**: Submit your order and receive confirmation
5. **Track Order**: Monitor real-time status updates
6. **View History**: Check all past orders and details

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Security headers with Helmet
- SQL injection prevention with parameterized queries

## Development

### Running in Development Mode
```bash
# Start backend with auto-reload
npm run server:dev

# Start frontend
npm run dev
```

### Database Reset
To reset the database, drop and recreate it:
```sql
DROP DATABASE food_order_system;
CREATE DATABASE food_order_system;
```

The tables will be automatically recreated when you restart the server.

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Update database credentials for production
3. Set a secure JWT secret
4. Configure proper CORS origins
5. Use a process manager like PM2 for the backend
6. Build the frontend: `npm run build`
7. Serve the built files with a web server like Nginx

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.