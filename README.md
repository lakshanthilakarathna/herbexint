# HERB - Liquor Wholesale Management System

A complete web-based sales management system for HERB liquor wholesale company with product catalog, customer CRM, order management, and GPS tracking.

## 🚀 Quick Start (Localhost)

### Prerequisites

- Node.js 18+ installed
- npm or yarn installed

### Installation

1. **Clone or download the project**
   ```bash
   cd herbexint
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Go to: `http://localhost:8080`

### Login Credentials

**Admin Account:**
- Email: `admin@herb.com`
- Password: `password123`

**Sales Representative:**
- Email: `rep@herb.com`
- Password: `password123`

## ✨ Features

### 📦 Liquor Product Management
- ✅ Add liquor products with images
- ✅ Set wholesale, cost, and retail prices (LKR)
- ✅ Bulk import via CSV
- ✅ Export catalog as PDF
- ✅ Share digital catalog via URL
- ✅ Image upload and preview
- ✅ All data stored in browser localStorage

### 👥 Customer CRM
- ✅ Complete customer profiles
- ✅ Customer types: Bar, Restaurant, Liquor Store
- ✅ Address management
- ✅ Contact information
- ✅ Search and filter
- ✅ View/Edit customer details

### 🛒 Order Management
- ✅ Create orders with multiple products
- ✅ Customer selection with search
- ✅ GPS location auto-capture
- ✅ Real-time location tracking
- ✅ Order status management
- ✅ Order history

### 👤 User Management
- ✅ Admin and Sales Rep roles
- ✅ Role-based permissions
- ✅ User profile management

### 📊 Dashboard
- ✅ Sales statistics
- ✅ Order tracking
- ✅ Stock alerts (Admin only)
- ✅ Revenue overview (Admin only)

### 📱 Mobile Responsive
- ✅ Works on all devices
- ✅ Touch-friendly interface
- ✅ Mobile navigation
- ✅ Optimized for field sales

## 🔐 User Roles & Permissions

### Admin
- ✅ Full system access
- ✅ Create/manage users
- ✅ View all reports
- ✅ Manage products, customers, orders
- ✅ Access to revenue and analytics
- ✅ Delete capabilities

### Sales Representative
- ✅ Create and manage orders
- ✅ Manage customers
- ✅ View products
- ✅ Access own sales data
- ❌ Cannot delete customers
- ❌ Cannot see total revenue
- ❌ Cannot access user management

## 💾 Data Storage

All data is stored in your browser's localStorage. This means:
- ✅ Works completely offline
- ✅ No backend server required
- ✅ Data persists between sessions
- ⚠️ Data is browser-specific (clears if you clear browser data)
- ⚠️ Data is not synced across devices

## 🛠️ Technology Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React
- **Maps:** Geolocation API
- **PDF:** jsPDF
- **Storage:** localStorage (browser)

## 📚 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🔧 Development

### Project Structure

```
herbexint/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Page components
│   ├── contexts/       # Authentication & state
│   ├── services/       # API services (localStorage)
│   └── lib/           # Utilities
├── public/            # Static assets
└── package.json       # Dependencies
```

### Making Changes

1. Edit files in `src/` directory
2. Changes hot-reload automatically
3. Check browser console for any errors

## 🌟 Features Implemented

✅ HERB branding with liquor company colors  
✅ Liquor wholesale product management  
✅ Local browser storage (no AWS needed)  
✅ Simple local authentication  
✅ Mobile responsive design  
✅ GPS tracking for orders  
✅ PDF export functionality  
✅ Role-based access control  

## 📝 License

Private - All rights reserved

## 👥 Team

HERB Liquor Wholesale Team - 2025

---

**🚀 Your HERB liquor wholesale management system is ready to use locally!**

Start it with: `npm run dev`  
Then visit: http://localhost:8080
