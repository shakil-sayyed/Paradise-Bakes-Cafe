# Paradise Bakes & Cafe - Web Application

A comprehensive Progressive Web Application (PWA) for Paradise Bakes & Cafe, a pure vegetarian cafe specializing in cakes, pastries, pizzas, burgers, sandwiches, and snacks.

## 🌟 Features

### Customer-Facing Features
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Product Catalog**: Interactive menu with categories and search
- **PWA Support**: Installable app with offline capabilities
- **Order Management**: Real-time order tracking
- **Customer Portal**: Order history and loyalty points
- **WhatsApp Integration**: Automated order notifications

### Business Management System
- **Daily Operations**: Revenue and expense tracking
- **Order Management**: Complete order lifecycle management
- **Customer Management**: Customer database with loyalty tracking
- **Inventory Management**: Stock tracking and alerts
- **Analytics Dashboard**: Business insights and reports
- **Multi-User System**: Role-based access control

### Technical Features
- **Full-Stack**: React.js frontend with Node.js backend
- **Database**: MongoDB with optimized schemas
- **Authentication**: JWT-based secure authentication
- **Security**: Input validation, rate limiting, CORS
- **Performance**: Caching, compression, optimization
- **Monitoring**: Health checks, logging, error tracking

## 🏗️ Architecture

```
paradise-bakes-cafe/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── package.json
├── models/                # Database models
├── routes/                # API routes
├── middleware/            # Express middleware
├── scripts/               # Database scripts
├── server.js              # Main server file
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shakil-sayyed/Paradise-Bakes-Cafe.git
   cd Paradise-Bakes-Cafe
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp env.example .env
   
   # Edit environment variables
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Setup database and create admin user
   npm run db:setup
   
   # Seed initial data
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   # Start backend server
   npm run dev
   
   # In another terminal, start frontend
   cd client
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Admin Panel: http://localhost:3001/admin

## 🏢 Production Deployment

### EC2 Amazon Linux 2023 Deployment

1. **Connect to your EC2 instance**
   ```bash
   ssh -i your-key.pem ec2-user@18.212.72.188
   ```

2. **Run the deployment script**
   ```bash
   # Download and run deployment script
   wget https://raw.githubusercontent.com/shakil-sayyed/Paradise-Bakes-Cafe/main/deploy.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Access your application**
   - Public URL: http://18.212.72.188
   - Admin Panel: http://18.212.72.188/admin
   - Health Check: http://18.212.72.188/api/health

### Manual Deployment Steps

1. **System Setup**
   ```bash
   # Update system
   sudo yum update -y
   
   # Install Node.js and npm
   sudo yum install -y nodejs npm
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   sudo mkdir -p /opt/paradise-bakes-cafe
   cd /opt/paradise-bakes-cafe
   sudo git clone https://github.com/shakil-sayyed/Paradise-Bakes-Cafe.git .
   
   # Install dependencies
   sudo npm install --production
   cd client && sudo npm install && sudo npm run build
   
   # Setup environment
   sudo cp env.example .env
   sudo nano .env
   ```

3. **Database Setup**
   ```bash
   # Setup database
   sudo npm run db:setup
   sudo npm run db:seed
   ```

4. **Start Application**
   ```bash
   # Start with PM2
   sudo pm2 start ecosystem.config.js
   sudo pm2 save
   sudo pm2 startup
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application Configuration
NODE_ENV=production
PORT=3000
APP_NAME="Paradise Bakes & Cafe"
APP_URL=https://paradisebakescafe.com

# Database Configuration
DB_HOST=18.212.72.188
DB_NAME=pbc_database
DB_USER=shakil
DB_PASSWORD=Simple4me1!
DB_CONNECTION_LIMIT=10

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h
SESSION_SECRET=your_session_secret_here

# Business Information
BUSINESS_NAME="Paradise Bakes & Cafe"
BUSINESS_PHONE_1="8208540270"
BUSINESS_PHONE_2="8698793746"
BUSINESS_PHONE_3="9970458278"
BUSINESS_EMAIL="info@paradisebakescafe.com"
BUSINESS_ADDRESS="Sudarshan Nagar, Lane 5 (Corner), Market Road, Behind Shrushti Hotel, Pimple Gurav, Pune - 411061"

# Admin Credentials
ADMIN_USERNAME=shakil
ADMIN_PASSWORD=Paradise123!
```

### Database Configuration

The application uses MongoDB with the following collections:
- `users` - User authentication and management
- `business` - Daily revenue and expense tracking
- `orders` - Order management and tracking
- `customers` - Customer database and loyalty
- `menu` - Product catalog and pricing

## 👥 User Management

### Default Admin Users
- **Username**: shakil
- **Password**: Paradise123!
- **Role**: admin

### User Roles
- **admin**: Full system access
- **manager**: Business operations access
- **staff**: Limited order management access

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Business Operations
- `GET /api/business` - Get business entries
- `POST /api/business` - Create business entry
- `GET /api/business/dashboard/overview` - Dashboard data

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

### Customers
- `GET /api/customers` - Get customers
- `POST /api/customers` - Create customer
- `GET /api/customers/search/mobile/:mobile` - Search by mobile

### Menu
- `GET /api/menu` - Get menu items (public)
- `POST /api/menu` - Create menu item (admin)
- `PUT /api/menu/:id` - Update menu item

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper CORS setup for security
- **Helmet.js**: Security headers implementation
- **Password Hashing**: bcrypt for password security
- **SQL Injection Prevention**: MongoDB with proper validation

## 📱 PWA Features

- **Service Worker**: Offline functionality and caching
- **Web App Manifest**: Installable app experience
- **Responsive Design**: Mobile-first approach
- **Push Notifications**: Real-time updates
- **Background Sync**: Offline data synchronization

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📈 Monitoring & Maintenance

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Monitor with PM2
pm2 monit
pm2 logs
```

### Backup
```bash
# Manual backup
/opt/paradise-bakes-cafe/backup.sh

# Automated backups run daily at 2 AM
```

### Logs
- Application logs: `/opt/logs/paradise-cafe.log`
- PM2 logs: `/opt/logs/pm2-*.log`
- Nginx logs: `/var/log/nginx/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Phone**: 8208540270, 8698793746, 9970458278
- **Email**: info@paradisebakescafe.com
- **Address**: Sudarshan Nagar, Lane 5 (Corner), Market Road, Behind Shrushti Hotel, Pimple Gurav, Pune - 411061

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Node.js community for the robust runtime
- MongoDB team for the flexible database
- All contributors and supporters

---

**Paradise Bakes & Cafe** - Pure Vegetarian Delights, Crafted with Love ❤️
