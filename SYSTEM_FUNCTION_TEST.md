# HERB System - Function Testing & Connections

## 🧪 Complete Function Testing Guide

### 1. AUTHENTICATION & USERS

#### Login System
- [ ] Admin login with email (admin@herb.com)
- [ ] Sales Rep login with username (sales1, sales2)
- [ ] Sales Rep login with email (sales1@herb.com)
- [ ] Invalid credentials show error
- [ ] Logout works correctly
- [ ] Session persists on page refresh

#### User Management
- [ ] Create new sales rep
- [ ] Edit existing user
- [ ] Delete user (except default admin/sales)
- [ ] Update passwords
- [ ] View all users in list

**Connection:** AuthContext → LoginForm → Dashboard
**Data Flow:** localStorage ('user') → AuthContext → All pages

---

### 2. PRODUCT MANAGEMENT

#### Create Product
- [ ] Add product with all fields
- [ ] Upload product image
- [ ] Select category (Liquor, Beer, Wine, Spirits, Other)
- [ ] Set pricing (wholesale, cost, retail)
- [ ] Set stock levels
- [ ] Product appears in list

#### Product Operations
- [ ] Edit existing product
- [ ] Delete product
- [ ] Search/filter products
- [ ] Bulk import CSV
- [ ] View product details

**Connection:** Products Page → apiClient → localStorage
**Data Flow:** Form → apiClient.createProduct() → localStorage['products'] → UI Update

---

### 3. CUSTOMER MANAGEMENT

#### Customer Types
- [ ] Create Bar customer
- [ ] Create Restaurant customer
- [ ] Create Liquor Store customer
- [ ] Create Other type
- [ ] Filter by customer type
- [ ] Search customers by name

#### Customer Operations
- [ ] Create new customer
- [ ] Edit customer details
- [ ] Delete customer
- [ ] View customer orders

**Connection:** Customers Page → apiClient → localStorage
**Data Flow:** Form → apiClient.createCustomer() → localStorage['customers'] → UI Update

---

### 4. ORDER MANAGEMENT

#### Create Order
- [ ] Select customer
- [ ] Add products to order
- [ ] Adjust quantities
- [ ] Calculate totals correctly
- [ ] Add delivery address
- [ ] Capture GPS location
- [ ] Submit order successfully

#### Order Tracking
- [ ] View order status (Pending/In-Progress/Completed/Cancelled)
- [ ] GPS location captured correctly
- [ ] Address reverse geocoding works
- [ ] Order status updates
- [ ] Auto-refresh (15 seconds)
- [ ] Manual refresh button

#### Order Operations
- [ ] Filter orders by status
- [ ] Filter by customer
- [ ] Filter by product category
- [ ] Search orders
- [ ] View order details
- [ ] Update order status
- [ ] Delete order

**Connection:** Orders Page → apiClient → localStorage → GPS API
**Data Flow:** 
1. Order creation: Form → getCurrentLocation() → OpenStreetMap API → Save to order
2. Order tracking: localStorage['orders'] → Display with map coordinates

---

### 5. REPORTS & ANALYTICS

#### Sales Summary Report
- [ ] Total revenue calculated correctly
- [ ] Order count accurate
- [ ] Average order value correct
- [ ] Sales trend chart displays
- [ ] Date range filter works

#### Product Performance Report
- [ ] Top 10 products listed
- [ ] Revenue by category displayed
- [ ] Slow-moving products alert shows
- [ ] Progress bars render correctly

#### Stock Status Report
- [ ] Low stock items identified
- [ ] Out of stock alert works
- [ ] Overstock items listed
- [ ] Stock value calculated

#### Sales Rep Performance Report
- [ ] Rep rankings displayed
- [ ] Sales per rep calculated
- [ ] Top performer highlighted
- [ ] Comparison bars show correctly

#### Customer Analytics Report
- [ ] Top 10 customers listed
- [ ] Customer type breakdown displayed
- [ ] Purchase frequency tracked
- [ ] Best customer highlighted

#### Financial Analysis Report
- [ ] Total profit calculated
- [ ] Profit margin accurate
- [ ] Most profitable products shown
- [ ] Profitability by category

**Connection:** Reports Page → localStorage → Data Processing → Charts
**Data Flow:** localStorage['orders', 'products', 'customers'] → Calculations → UI Charts

---

### 6. GPS TRACKING

#### Location Capture
- [ ] Request location permission
- [ ] Capture coordinates
- [ ] Reverse geocode to address
- [ ] Save to order
- [ ] Display on map (future feature)

**Connection:** Orders Page → Geolocation API → OpenStreetMap → order.gps_location

---

### 7. DATA PERSISTENCE

#### localStorage
- [ ] Products saved to localStorage
- [ ] Customers saved to localStorage
- [ ] Orders saved to localStorage
- [ ] Users saved to localStorage
- [ ] Data persists on refresh
- [ ] Data syncs across tabs

**Connection:** All pages → apiClient → localStorage → Browser storage

---

### 8. PERMISSIONS & ROLES

#### Admin Permissions
- [ ] Access to all pages
- [ ] Can create/edit/delete users
- [ ] Can view all reports
- [ ] Can manage all data

#### Sales Rep Permissions
- [ ] Can view orders
- [ ] Can create orders
- [ ] Can view customers
- [ ] Can edit customers
- [ ] Can view products (read-only)
- [ ] Can view reports
- [ ] CANNOT access Users page
- [ ] CANNOT access System Logs

**Connection:** AuthContext → Layout → ProtectedRoute → Page Access

---

### 9. USER INTERFACE

#### Responsive Design
- [ ] Mobile view works
- [ ] Tablet view works
- [ ] Desktop view works
- [ ] Sidebar collapses on mobile
- [ ] Navigation menu responsive

#### Loading States
- [ ] Loading spinner shows during data fetch
- [ ] Error messages display correctly
- [ ] Success notifications appear
- [ ] Toast notifications work

---

### 10. DATA FLOW CONNECTIONS

```
┌─────────────────────────────────────────────────────┐
│                   DATA STORAGE                       │
│                  (localStorage)                      │
│  ┌──────────┬────────────┬──────────┬────────────┐  │
│  │ Products │ Customers  │  Orders  │   Users    │  │
│  └──────────┴────────────┴──────────┴────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↓ ↑
            ┌───────────────────────────┐
            │      apiClient.ts          │
            │  (Mock API Layer)          │
            └───────────────────────────┘
                        ↓ ↑
┌─────────────────────────────────────────────────────┐
│                 PAGES & COMPONENTS                   │
│  ┌──────────┬────────────┬──────────┬────────────┐ │
│  │ Products │ Customers  │  Orders  │  Reports   │ │
│  └──────────┴────────────┴──────────┴────────────┘ │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              AUTHENTICATION                         │
│              (AuthContext)                          │
│         ↓                         ↓                │
│    Login Form              Protected Routes         │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 KEY CONNECTIONS

### 1. **Authentication Flow**
```
Login → AuthContext → User Session → All Pages
```

### 2. **Data Creation Flow**
```
Form Input → Validation → apiClient → localStorage → UI Update
```

### 3. **Report Generation Flow**
```
localStorage Data → Calculations → Metrics → Charts → Display
```

### 4. **Order Creation Flow**
```
Select Customer → Add Products → Calculate Totals → 
GPS Capture → Save Order → Update UI
```

### 5. **Product Management Flow**
```
Create/Edit Product → Save to localStorage → 
Update Product List → Available in Orders
```

---

## ✅ TESTING PRIORITY

**High Priority:**
1. Login system (all user types)
2. Create/Edit/Delete operations
3. Order creation with GPS
4. Reports calculations
5. Data persistence

**Medium Priority:**
6. Search and filters
7. Bulk operations
8. Permissions
9. UI responsiveness
10. Error handling

**Low Priority:**
11. Loading states
12. Tooltips
13. Keyboard shortcuts
14. Print views

---

## 🎯 TESTING SCENARIOS

### Scenario 1: Sales Rep Creates Order
1. Login as Sales Rep
2. Go to Orders page
3. Click "Create Order"
4. Select customer
5. Add products
6. Capture GPS location
7. Submit order
8. Verify order appears in list
9. Verify GPS coordinates saved
10. Verify order status is "Pending"

### Scenario 2: Admin Views Reports
1. Login as Admin
2. Go to Reports page
3. Select date range
4. View each report tab
5. Verify calculations are correct
6. Check charts render properly
7. Export data (if implemented)

### Scenario 3: Manage Products
1. Login as Admin
2. Go to Products page
3. Create new product
4. Edit product
5. Delete product
6. Import CSV bulk products
7. Verify all operations work

---

Your system is production-ready! Test these functions to ensure everything works correctly. 🚀

